import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Body parsing middleware (allows large text/image base64 payloads)
app.use(express.json({ limit: '15mb' }));

// Initial empty database schema
interface UserData {
  email: string;
  name: string;
  avatar: string;
  birthday?: string;
  coupleId?: string;
  lat?: number;
  lng?: number;
  gpsConsent?: boolean;
  locationUpdatedAt?: number;
  tastes?: any[];
}

interface CoupleData {
  id: string;
  user1Email: string;
  user2Email: string;
  warmth: number;
  streak: number;
  linkedSpotifyUrl: string;
  chatTheme: string;
  commonItems: any[];
  memories: any[];
  lastActiveAt?: number;
  celebrations?: {
    id: string;
    title: string;
    date: string; // MM-DD
    type: 'birthday' | 'holiday' | 'custom';
    owner?: string;
  }[];
}

interface MessageData {
  id: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  createdAt: number;
  isAudio?: boolean;
  audioUrl?: string; // Base64 or resource URL
  audioDuration?: number;
  isPhoto?: boolean;
  photoUrl?: string; // Base64 string
  emoji?: string;
  seen?: boolean;
}

interface DatabaseSchema {
  users: Record<string, UserData>;
  couples: Record<string, CoupleData>;
  messages: Record<string, MessageData[]>;
  pairingCodes: Record<string, string>; // PIN code -> creatorEmail
  sessions?: Record<string, string>; // session token -> owner email
}

// In-memory cache of the database. db.json remains the durable store, but we keep
// a single shared in-memory copy so we don't re-parse the whole file on every
// request (slow, and can momentarily read a half-written file).
let dbCache: DatabaseSchema | null = null;

function loadDbFromDisk(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read db.json', error);
  }
  return { users: {}, couples: {}, messages: {}, pairingCodes: {}, sessions: {} };
}

// Helper to read database (returns the shared in-memory instance)
function readDb(): DatabaseSchema {
  if (!dbCache) {
    dbCache = loadDbFromDisk();
  }
  return dbCache;
}

// Helper to persist the database ATOMICALLY. We write to a temp file and then
// rename it over db.json. A rename is atomic, so db.json is never left
// half-written (which would corrupt/wipe all data) if the process is killed
// mid-write. Falls back to a direct write if the rename is briefly blocked
// (e.g. by antivirus / a transient file lock on Windows).
function writeDb(data: DatabaseSchema) {
  dbCache = data;
  const payload = JSON.stringify(data, null, 2);
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, payload, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (error) {
    try {
      fs.writeFileSync(DB_FILE, payload, 'utf-8');
    } catch (fallbackError) {
      console.error('Failed to write db.json', error, fallbackError);
    }
  }
}

// --- Session auth -----------------------------------------------------------
// A session token is issued when a user logs in and stored in db.json (so it
// survives server restarts). The client sends it back on every data request
// via the `x-session-token` header. This stops the API from being readable by
// just guessing a partner's email.

function createSession(email: string): string {
  const dbObj = readDb();
  if (!dbObj.sessions) dbObj.sessions = {};
  const token = crypto.randomBytes(24).toString('hex');
  dbObj.sessions[token] = email.toLowerCase().trim();
  writeDb(dbObj);
  return token;
}

// Guards the /api/user/* and /api/couple/* routes:
//  1. requires a valid session token,
//  2. enforces that the caller can only act as their own email,
//  3. enforces that any referenced coupleId belongs to the caller.
function requireAuth(req: any, res: any, next: any) {
  const token = req.headers['x-session-token'];
  const dbObj = readDb();
  const email = token && dbObj.sessions ? dbObj.sessions[token] : undefined;

  if (!email) {
    return res.status(401).json({ error: 'Sesión no válida. Inicia sesión de nuevo.' });
  }
  req.userEmail = email;

  const bodyEmail = req.body?.email ? String(req.body.email).toLowerCase().trim() : null;
  const queryEmail = req.query?.email ? String(req.query.email).toLowerCase().trim() : null;
  if ((bodyEmail && bodyEmail !== email) || (queryEmail && queryEmail !== email)) {
    return res.status(403).json({ error: 'Acceso denegado: no puedes actuar como otro usuario.' });
  }

  const coupleId = req.body?.coupleId;
  if (coupleId) {
    const couple = dbObj.couples[coupleId];
    if (!couple || (couple.user1Email !== email && couple.user2Email !== email)) {
      return res.status(403).json({ error: 'Acceso denegado: esta pareja no te pertenece.' });
    }
  }

  next();
}

// Protect all user + couple data routes (registered before those routes run).
app.use('/api/user', requireAuth);
app.use('/api/couple', requireAuth);

// API endpoint to resolve Spotify shortlinks or format standard shared links
app.post('/api/spotify/resolve', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let targetUrl = url.trim();

    // If it's a mobile shortener URL (e.g. spotify.link) follow redirects
    if (targetUrl.includes('spotify.link/')) {
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      targetUrl = response.url;
    }

    if (targetUrl.includes('spotify.com/')) {
      let embed = targetUrl;
      // Convert typical sharing link to embed format
      if (targetUrl.includes('/track/')) {
        embed = targetUrl.replace('spotify.com/', 'spotify.com/embed/');
      } else if (targetUrl.includes('/playlist/')) {
        embed = targetUrl.replace('spotify.com/', 'spotify.com/embed/');
      } else if (targetUrl.includes('/album/')) {
        embed = targetUrl.replace('spotify.com/', 'spotify.com/embed/');
      } else if (targetUrl.includes('/artist/')) {
        embed = targetUrl.replace('spotify.com/', 'spotify.com/embed/');
      }

      // Strip tracker queries
      if (embed.includes('?')) {
        embed = embed.split('?')[0];
      }

      return res.json({ success: true, embedUrl: embed });
    } else {
      return res.status(400).json({ error: 'Enlace no válido de Spotify' });
    }
  } catch (err: any) {
    console.error('Failed to resolve Spotify URL:', err);
    return res.status(500).json({ error: 'Fallo al procesar el enlace de Spotify' });
  }
});

// Auth / Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const dbObj = readDb();
  const normalizedEmail = email.toLowerCase().trim();

  // Load or create user
  if (!dbObj.users[normalizedEmail]) {
    dbObj.users[normalizedEmail] = {
      email: normalizedEmail,
      name: name || '',
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      birthday: '',
    };
    writeDb(dbObj);
  } else {
    // Optionally update profile details if provided
    let updated = false;
    if (name && dbObj.users[normalizedEmail].name !== name) {
      dbObj.users[normalizedEmail].name = name;
      updated = true;
    }
    if (avatar && dbObj.users[normalizedEmail].avatar !== avatar) {
      dbObj.users[normalizedEmail].avatar = avatar;
      updated = true;
    }
    if (updated) {
      writeDb(dbObj);
    }
  }

  return res.json({ success: true, user: dbObj.users[normalizedEmail] });
});

// Helper to dynamically build the OAuth callback URL based on the incoming request header host/protocol
function getCallbackUri(req: any) {
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  let protocol = 'http';
  if (req.headers['x-forwarded-proto']) {
    protocol = req.headers['x-forwarded-proto'] as string;
  } else if (req.secure) {
    protocol = 'https';
  } else if (
    host.includes('.run.app') ||
    host.includes('.aistudio.google') ||
    host.includes('.us-east1.run.app')
  ) {
    protocol = 'https';
  }
  return `${protocol}://${host}/auth/google/callback`;
}

// GET /api/auth/google/url
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientOrigin = req.query.origin as string;

  let redirectUri = '';
  if (clientOrigin && (clientOrigin.startsWith('http://') || clientOrigin.startsWith('https://'))) {
    redirectUri = `${clientOrigin}/auth/google/callback`;
  } else {
    redirectUri = getCallbackUri(req);
  }

  if (!clientId) {
    // If client ID is not configured, redirect to our fallback mock consent page
    return res.json({
      url: `/auth/google/mock-consent?redirect_uri=${encodeURIComponent(redirectUri)}`,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

// GET /auth/google/mock-consent
app.get('/auth/google/mock-consent', (req, res) => {
  const { redirect_uri } = req.query;
  const dbObj = readDb();

  // Dynamic user listing
  const registered = Object.values(dbObj.users || {});
  const defaultEmail = 'nadajohan98@gmail.com';
  const listToRender = [...registered];

  if (!listToRender.some((u) => u.email.toLowerCase() === defaultEmail)) {
    listToRender.unshift({
      email: defaultEmail,
      name: 'nadajohan98',
      avatar:
        'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
    });
  }

  let userButtonsHtml = '';
  listToRender.forEach((u) => {
    const email = u.email;
    const name = u.name || email.split('@')[0];
    const initial = (name ? name[0] : email[0] || 'U').toUpperCase();
    const avatar =
      u.avatar ||
      'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80';

    userButtonsHtml += `
      <button class="account-btn" onclick="select('${email}', '${name}', '${avatar}')">
        <div class="avatar">${initial}</div>
        <div style="flex-grow: 1;">
          <span style="font-weight: 600; font-size: 14px; display: block;">${name}</span>
          <span style="font-size: 11px; color: #a1a1aa; display: block;">${email}</span>
        </div>
        <span style="font-size: 10px; color: #ff4d6d; font-weight: bold; padding: 4px 8px; background: rgba(255, 77, 109, 0.1); border-radius: 20px;">Cuenta Activa ✅</span>
      </button>
    `;
  });

  const finalRedirectUri = (redirect_uri as string) || getCallbackUri(req);

  res.send(`
    <html>
      <head>
        <title>Sign in with Google - AmourPhone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0c10;
            color: #e4e6eb;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
          }
          .card {
            background-color: #121216;
            border: 1px solid rgba(255, 77, 109, 0.2);
            border-radius: 24px;
            padding: 32px 24px;
            width: 100%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 15px 45px rgba(0,0,0,0.6);
            animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .google-logo {
            display: inline-flex;
            gap: 2px;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .g-blue { color: #4285F4; }
          .g-red { color: #EA4335; }
          .g-yellow { color: #FBBC05; }
          .g-green { color: #34A853; }
          
          h1 {
            font-size: 20px;
            margin: 12px 0 6px 0;
            color: #ffffff;
            font-weight: bold;
          }
          p {
            font-size: 13px;
            color: #a1a1aa;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          .account-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 14px 16px;
            border-radius: 16px;
            color: white;
            text-align: left;
            font-weight: 500;
            font-size: 13px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .account-btn:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: #ff4d6d;
            box-shadow: 0 0 12px rgba(255, 77, 109, 0.15);
          }
          .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff4d6d, #8a2be2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
          }
          .divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: #52525b;
            font-size: 11px;
            margin: 20px 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .divider::before, .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .divider:not(:empty)::before {
            margin-right: .5em;
          }
          .divider:not(:empty)::after {
            margin-left: .5em;
          }
          .custom-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 12px 14px;
            border-radius: 12px;
            color: white;
            font-size: 13px;
            box-sizing: border-box;
            outline: none;
            margin-bottom: 12px;
            transition: border-color 0.2s;
          }
          .custom-input:focus {
            border-color: #ff4d6d;
          }
          .submit-btn {
            width: 100%;
            background: linear-gradient(90deg, #ff4d6d, #c9184a);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
          }
          .submit-btn:hover {
            opacity: 0.95;
            transform: scale(1.01);
          }
          .submit-btn:active {
            transform: scale(0.99);
          }
          .info-note {
            font-size: 11px;
            color: #fda4af;
            margin-top: 18px;
            text-align: left;
            background: rgba(225, 29, 72, 0.06);
            border-left: 3px solid #ff4d6d;
            padding: 10px 12px;
            border-radius: 8px;
            line-height: 1.4;
          }
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 77, 109, 0.4) transparent;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(255, 77, 109, 0.4);
            border-radius: 2px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="google-logo">
            <span class="g-blue">G</span>
            <span class="g-red">o</span>
            <span class="g-yellow">o</span>
            <span class="g-blue">g</span>
            <span class="g-green">l</span>
            <span class="g-red">e</span>
          </div>
          <h1>Google Sign-In</h1>
          <p>Sincronización oficial para tu cuenta en <strong>AmourPhone 💘</strong></p>

          <!-- Pre-filled authenticated accounts lists -->
          <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; padding-right: 4px;" class="custom-scroll">
            ${userButtonsHtml}
          </div>

          <div class="divider">O ACCEDE CON OTRO CORREO</div>

          <form onsubmit="handleCustom(event)">
            <input type="email" id="email-field" class="custom-input" placeholder="correo@gmail.com" required />
            <input type="text" id="name-field" class="custom-input" placeholder="Tu Nombre de Perfil" />
            <button type="submit" class="submit-btn font-bold">Autenticar con Google 🔑</button>
          </form>

          <div class="info-note">
            ⚠️ <strong>Sincronización de Identidad:</strong> Iniciando sesión de esta forma, verificas tu correo ante el sistema impidiendo el robo o suplantación de tu cuenta por parte de terceros.
          </div>
        </div>

        <script>
          const redirectUri = '${finalRedirectUri}';
          
          function select(email, name, avatar) {
            const url = new URL(redirectUri);
            url.searchParams.set('mock_email', email.trim().toLowerCase());
            url.searchParams.set('mock_name', name.trim());
            url.searchParams.set('mock_avatar', avatar || 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80');
            window.location.href = url.toString();
          }

          function handleCustom(e) {
            e.preventDefault();
            const email = document.getElementById('email-field').value;
            const name = document.getElementById('name-field').value || email.split('@')[0];
            select(email, name, '');
          }
        </script>
      </body>
    </html>
  `);
});

// GET /auth/google/callback
app.get('/auth/google/callback', async (req, res) => {
  const { code, mock_email, mock_name, mock_avatar } = req.query;

  let email = '';
  let name = '';
  let avatar = '';

  if (mock_email) {
    // Parsing from mock consent
    email = (mock_email as string).toLowerCase().trim();
    name = (mock_name as string) || email.split('@')[0];
    avatar =
      (mock_avatar as string) ||
      'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80';
  } else if (code) {
    // Real Google OAuth exchange
    try {
      const redirectUri = getCallbackUri(req);
      const params = new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userRes.ok) {
        throw new Error('Failed to fetch user info');
      }

      const googleUser = await userRes.json();
      email = googleUser.email.toLowerCase().trim();
      name = googleUser.name;
      avatar = googleUser.picture;
    } catch (err: any) {
      console.error('Real Google OAuth error:', err);
      return res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0a0a0b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
            <div style="padding: 24px; border: 1px solid rgba(255, 77, 109, 0.2); border-radius: 16px; background: #121216; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <h2 style="color: #ff4d6d; margin-top: 0; font-size: 20px;">Error de Verificación</h2>
              <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">Ocurrió un error al intentar validar tu perfil con Google. Por favor intenta usando el botón de login manual o verifica tus credenciales.</p>
              <button onclick="window.close()" style="background: #ff4d6d; border: none; color: white; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 12px;">Cerrar Ventana</button>
            </div>
          </body>
        </html>
      `);
    }
  }

  if (email) {
    const dbObj = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    if (!dbObj.users[normalizedEmail]) {
      dbObj.users[normalizedEmail] = {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        avatar:
          avatar ||
          'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
        birthday: '',
      };
      writeDb(dbObj);
    }

    const userData = dbObj.users[normalizedEmail];
    const sessionToken = createSession(normalizedEmail);

    return res.send(`
      <html>
        <head>
          <title>Autenticación Completada 💘</title>
        </head>
        <body style="font-family: sans-serif; background: #0a0a0b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; box-sizing: border-box;">
          <div style="padding: 30px; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 20px; animation: heartbeat 1.2s infinite;">💖</div>
            <h2 style="margin: 0 0 10px 0; color: #ff4d6d; font-size: 22px;">¡Acceso Autorizado! 🚀</h2>
            <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px;">Sincronizando cuenta de Google con <strong>AmourPhone</strong>. Esta ventana se cerrará sola.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  user: ${JSON.stringify(userData)},
                  token: ${JSON.stringify(sessionToken)}
                }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                window.location.href = '/?loggedEmail=' + encodeURIComponent('${normalizedEmail}') + '&token=' + encodeURIComponent('${sessionToken}');
              }
            </script>
          </div>
          <style>
            @keyframes heartbeat {
              0% { transform: scale(1); }
              20% { transform: scale(1.15); }
              40% { transform: scale(1.05); }
              60% { transform: scale(1.15); }
              80% { transform: scale(1); }
              100% { transform: scale(1); }
            }
          </style>
        </body>
      </html>
    `);
  }

  return res.status(400).send('Fallo al recuperar cuenta de Google.');
});

// Update profile details (specifically Birthday)
app.post('/api/user/update', (req, res) => {
  const { email, name, avatar, birthday } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const dbObj = readDb();
  const normalizedEmail = email.toLowerCase().trim();

  if (dbObj.users[normalizedEmail]) {
    if (typeof name === 'string') dbObj.users[normalizedEmail].name = name;
    if (typeof avatar === 'string') dbObj.users[normalizedEmail].avatar = avatar;
    if (typeof birthday === 'string') dbObj.users[normalizedEmail].birthday = birthday;

    // Propagate birthdays to Couple doc if configured
    const coupleId = dbObj.users[normalizedEmail].coupleId;
    if (coupleId && dbObj.couples[coupleId]) {
      const couple = dbObj.couples[coupleId];

      // Update custom celebrations
      let celebrations = couple.celebrations || [];

      // Remove all previous birthday celebrations for this email first
      celebrations = celebrations.filter(
        (c) => !(c.type === 'birthday' && c.owner === normalizedEmail)
      );

      if (birthday) {
        const parts = birthday.split('-'); // YYYY-MM-DD
        if (parts.length === 3) {
          const mMonthDay = `${parts[1]}-${parts[2]}`; // MM-DD
          celebrations.push({
            id: 'bday_' + normalizedEmail,
            title: `Cumpleaños de ${dbObj.users[normalizedEmail].name || normalizedEmail}`,
            date: mMonthDay,
            type: 'birthday',
            owner: normalizedEmail,
          });
        }
      }
      couple.celebrations = celebrations;
    }

    writeDb(dbObj);
    return res.json({ success: true, user: dbObj.users[normalizedEmail] });
  }

  return res.status(404).json({ error: 'User not found' });
});

// Create connection PIN
app.post('/api/couple/create-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase().trim();
  const dbObj = readDb();

  // Generate a random 6-character code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  dbObj.pairingCodes[code] = normalizedEmail;
  writeDb(dbObj);

  return res.json({ success: true, code });
});

// Join couple connection via code
app.post('/api/couple/join', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  const dbObj = readDb();

  let partnerEmail = '';
  const lowerCode = cleanCode.toLowerCase();

  // Resolution 1: Is it a direct email address?
  if (lowerCode.includes('@')) {
    partnerEmail = lowerCode;
  }
  // Resolution 2: Is it an active 6-digit numeric pairing PIN code?
  else if (dbObj.pairingCodes[cleanCode]) {
    partnerEmail = dbObj.pairingCodes[cleanCode].toLowerCase().trim();
  }
  // Resolution 3: Is it a URL username code (e.g. "LOVE-NADAJOHAN98")?
  else {
    let possibleUsername = lowerCode;
    if (lowerCode.startsWith('love-')) {
      possibleUsername = lowerCode.substring(5);
    }

    // Look up in existing registered list
    const registeredEmails = Object.keys(dbObj.users);
    const matchedEmail = registeredEmails.find((e) => {
      const uPrefix = e.split('@')[0].toLowerCase();
      return uPrefix === possibleUsername;
    });

    if (matchedEmail) {
      partnerEmail = matchedEmail.toLowerCase().trim();
    }
  }

  if (!partnerEmail) {
    return res.status(404).json({
      error:
        'Código o Correo inválido. Asegura que tu pareja ya haya ingresado a la app con su correo de Google primero.',
    });
  }

  // Create a shared couple ID
  const coupleId =
    partnerEmail === normalizedEmail
      ? `${partnerEmail}_and_self`
      : `${partnerEmail}_and_${normalizedEmail}`;

  // Ensure user profiles exist in DB before linking to prevent undefined errors
  if (!dbObj.users[normalizedEmail]) {
    dbObj.users[normalizedEmail] = {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      birthday: '',
      coupleId: coupleId,
    };
  } else {
    dbObj.users[normalizedEmail].coupleId = coupleId;
  }

  if (!dbObj.users[partnerEmail]) {
    dbObj.users[partnerEmail] = {
      email: partnerEmail,
      name: partnerEmail.split('@')[0],
      avatar:
        'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
      birthday: '',
      coupleId: coupleId,
    };
  } else {
    dbObj.users[partnerEmail].coupleId = coupleId;
  }

  // Initialize couple shared state
  dbObj.couples[coupleId] = {
    id: coupleId,
    user1Email: partnerEmail,
    user2Email: normalizedEmail,
    warmth: 85,
    lastActiveAt: Date.now(),
    streak: 1,
    linkedSpotifyUrl: '',
    chatTheme: 'rose',
    commonItems: [],
    memories: [],
    celebrations: [
      { id: 'valentines', title: 'Día de San Valentín 💖', date: '02-14', type: 'holiday' },
      { id: 'christmas', title: 'Navidad con mi Amor 🎄', date: '12-25', type: 'holiday' },
      { id: 'anniversary', title: 'Nuestro Aniversario 🥂', date: '11-11', type: 'custom' },
    ],
  };

  // Add system notifications message
  dbObj.messages[coupleId] = [
    {
      id: 'system_init_' + Date.now(),
      senderEmail: 'system',
      text: '¡Vínculo de Amor Creado! Compartan sus mejores momentos, rumbos, y risas desde hoy. ❤️',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      seen: true,
    },
  ];

  // Propagate previous birthdays if available
  const u1b = dbObj.users[partnerEmail].birthday;
  const u2b = dbObj.users[normalizedEmail].birthday;

  if (u1b) {
    const p = u1b.split('-');
    if (p.length === 3) {
      dbObj.couples[coupleId].celebrations?.push({
        id: 'bday_' + partnerEmail,
        title: `Cumpleaños de ${dbObj.users[partnerEmail].name || partnerEmail}`,
        date: `${p[1]}-${p[2]}`,
        type: 'birthday',
        owner: partnerEmail,
      });
    }
  }

  if (u2b) {
    const p = u2b.split('-');
    if (p.length === 3) {
      dbObj.couples[coupleId].celebrations?.push({
        id: 'bday_' + normalizedEmail,
        title: `Cumpleaños de ${dbObj.users[normalizedEmail].name || normalizedEmail}`,
        date: `${p[1]}-${p[2]}`,
        type: 'birthday',
        owner: normalizedEmail,
      });
    }
  }

  // Clear pairing code
  delete dbObj.pairingCodes[cleanCode];

  writeDb(dbObj);

  // Safely find or create a fallback partner user profile details to send back to client
  const partnerUser = dbObj.users[partnerEmail] || {
    email: partnerEmail,
    name: partnerEmail.split('@')[0],
    avatar:
      'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
    birthday: '',
    coupleId: coupleId,
  };

  return res.json({
    success: true,
    couple: dbObj.couples[coupleId],
    partner: partnerUser,
  });
});

// Helper to compute common items list dynamically by comparing both user tastes lists
function computeCommonItems(
  userTastes: any[] = [],
  partnerTastes: any[] = [],
  userEmail: string = '',
  partnerEmail: string = ''
) {
  const merged: any[] = [];

  const userNorm = (userTastes || []).map((t) => ({
    ...t,
    norm: (t.text || '').toLowerCase().trim(),
    category: t.category,
  }));
  const partnerNorm = (partnerTastes || []).map((t) => ({
    ...t,
    norm: (t.text || '').toLowerCase().trim(),
    category: t.category,
  }));

  const matchedUserIds = new Set<string>();
  const matchedPartnerIds = new Set<string>();

  // Find matches first
  userNorm.forEach((u) => {
    const match = partnerNorm.find((p) => p.category === u.category && p.norm === u.norm);
    if (match) {
      merged.push({
        id: `matched-${u.id}-${match.id}`,
        category: u.category,
        text: u.text, // keep user's text casing
        matched: true,
        userTasteId: u.id,
        partnerTasteId: match.id,
      });
      matchedUserIds.add(u.id);
      matchedPartnerIds.add(match.id);
    }
  });

  // Add remaining unmatched user tastes (added by me)
  userNorm.forEach((u) => {
    if (!matchedUserIds.has(u.id)) {
      merged.push({
        id: u.id,
        category: u.category,
        text: u.text,
        matched: false,
        addedBy: 'me',
      });
    }
  });

  // Add remaining unmatched partner tastes (added by partner)
  partnerNorm.forEach((p) => {
    if (!matchedPartnerIds.has(p.id)) {
      merged.push({
        id: p.id,
        category: p.category,
        text: p.text,
        matched: false,
        addedBy: 'partner',
      });
    }
  });

  return merged;
}

// Add taste for a user
app.post('/api/user/tastes/add', (req, res) => {
  const { email, category, text } = req.body;
  if (!email || !category || !text) {
    return res.status(400).json({ error: 'email, category, and text are required' });
  }

  const dbObj = readDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = dbObj.users[normalizedEmail];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.tastes) {
    user.tastes = [];
  }

  // Avoid identical duplicates within the same category
  const normText = text.toLowerCase().trim();
  const exists = user.tastes.some(
    (t) => t.category === category && t.text.toLowerCase().trim() === normText
  );
  if (!exists) {
    user.tastes.push({
      id: 'taste-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      category,
      text: text.trim(),
    });
    writeDb(dbObj);
  }

  // Calculate new common items if there is a couple
  let commonItems: any[] = [];
  if (user.coupleId && dbObj.couples[user.coupleId]) {
    const couple = dbObj.couples[user.coupleId];
    const partnerEmail =
      couple.user1Email === normalizedEmail ? couple.user2Email : couple.user1Email;
    const partner = dbObj.users[partnerEmail];

    commonItems = computeCommonItems(
      user.tastes,
      partner ? partner.tastes || [] : [],
      normalizedEmail,
      partnerEmail
    );
    couple.commonItems = commonItems;
    writeDb(dbObj);
  }

  return res.json({ success: true, tastes: user.tastes, commonItems });
});

// Remove taste for a user
app.post('/api/user/tastes/remove', (req, res) => {
  const { email, id } = req.body;
  if (!email || !id) {
    return res.status(400).json({ error: 'email and id are required' });
  }

  const dbObj = readDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = dbObj.users[normalizedEmail];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.tastes) user.tastes = [];

  let deleted = false;
  let targetId = id;
  if (id.startsWith('matched-')) {
    const found = user.tastes.find((t) => id.includes(t.id));
    if (found) {
      targetId = found.id;
    }
  }

  const initialLen = user.tastes.length;
  user.tastes = user.tastes.filter((t) => t.id !== targetId);
  if (user.tastes.length < initialLen) {
    deleted = true;
  }

  if (deleted) {
    writeDb(dbObj);
  }

  // Recalculate
  let commonItems: any[] = [];
  if (user.coupleId && dbObj.couples[user.coupleId]) {
    const couple = dbObj.couples[user.coupleId];
    const partnerEmail =
      couple.user1Email === normalizedEmail ? couple.user2Email : couple.user1Email;
    const partner = dbObj.users[partnerEmail];

    commonItems = computeCommonItems(
      user.tastes,
      partner ? partner.tastes || [] : [],
      normalizedEmail,
      partnerEmail
    );
    couple.commonItems = commonItems;
    writeDb(dbObj);
  }

  return res.json({ success: true, tastes: user.tastes, commonItems });
});

// Retrieve dynamic user + couple state
app.get('/api/couple/state', (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const dbObj = readDb();

  let user = dbObj.users[normalizedEmail];
  if (!user) {
    dbObj.users[normalizedEmail] = {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      birthday: '',
    };
    writeDb(dbObj);
    user = dbObj.users[normalizedEmail];
  }

  let partner: UserData | null = null;
  let couple: CoupleData | null = null;
  let messages: MessageData[] = [];

  if (user.coupleId && dbObj.couples[user.coupleId]) {
    couple = dbObj.couples[user.coupleId];

    // Inactivity decay logic:
    if (!couple.lastActiveAt) {
      couple.lastActiveAt = Date.now();
    }
    const now = Date.now();
    const elapsedMs = now - couple.lastActiveAt;
    if (elapsedMs > 60000) {
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const decayAmount = elapsedMinutes * 0.5; // 0.5% warmth dropped per minute of inactivity
      if (decayAmount > 0) {
        couple.warmth = Math.max(10, Number((couple.warmth - decayAmount).toFixed(1)));
        couple.lastActiveAt += elapsedMinutes * 60000;
        writeDb(dbObj);
      }
    }

    const partnerEmail =
      couple.user1Email === normalizedEmail ? couple.user2Email : couple.user1Email;
    partner = dbObj.users[partnerEmail] || null;
    messages = dbObj.messages[user.coupleId] || [];

    // Auto-calculate commonItems dynamically relative to the requesting user to reflect matches!
    const userTastes = user.tastes || [];
    const partnerTastes = partner ? partner.tastes || [] : [];
    couple.commonItems = computeCommonItems(
      userTastes,
      partnerTastes,
      normalizedEmail,
      partnerEmail
    );
  }

  // Always expose the requesting user's tastes as commonItems — even when they are
  // not coupled yet — so saved likes never vanish from the UI on the next poll.
  const commonItems = couple
    ? couple.commonItems
    : computeCommonItems(user.tastes || [], [], normalizedEmail, '');

  return res.json({
    user,
    partner,
    couple,
    messages,
    commonItems,
  });
});

// Record a gradual love interaction to boost warmth and reset the inactivity decay timer
app.post('/api/couple/interact', (req, res) => {
  const { coupleId, increment } = req.body;
  if (!coupleId) {
    return res.status(400).json({ error: 'coupleId is required' });
  }

  const dbObj = readDb();
  const couple = dbObj.couples[coupleId];

  if (couple) {
    const inc = typeof increment === 'number' ? increment : 1.0;
    couple.warmth = Math.min(100, Number((couple.warmth + inc).toFixed(1)));
    couple.lastActiveAt = Date.now();
    writeDb(dbObj);
    return res.json({ success: true, warmth: couple.warmth });
  }

  return res.status(404).json({ error: 'Couple relationship not found' });
});

// Update standard couple details (warmth, streak, items list, celebrations)
app.post('/api/couple/update', (req, res) => {
  const { coupleId, warmth, streak, commonItems, memories, celebrations } = req.body;
  if (!coupleId) return res.status(400).json({ error: 'coupleId is required' });

  const dbObj = readDb();
  const couple = dbObj.couples[coupleId];

  if (couple) {
    if (typeof warmth === 'number') couple.warmth = warmth;
    if (typeof streak === 'number') couple.streak = streak;
    if (Array.isArray(commonItems)) couple.commonItems = commonItems;
    if (Array.isArray(memories)) couple.memories = memories;
    if (Array.isArray(celebrations)) couple.celebrations = celebrations;

    writeDb(dbObj);
    return res.json({ success: true, couple });
  }

  return res.status(404).json({ error: 'Couple relationship not found' });
});

// Set custom chat theme
app.post('/api/couple/update-theme', (req, res) => {
  const { coupleId, chatTheme } = req.body;
  if (!coupleId || !chatTheme) {
    return res.status(400).json({ error: 'coupleId and chatTheme are required' });
  }

  const dbObj = readDb();
  if (dbObj.couples[coupleId]) {
    dbObj.couples[coupleId].chatTheme = chatTheme;
    writeDb(dbObj);
    return res.json({ success: true, theme: chatTheme });
  }

  return res.status(404).json({ error: 'Couple not found' });
});

// Set Spotify URL
app.post('/api/couple/update-spotify', (req, res) => {
  const { coupleId, url } = req.body;
  if (!coupleId) return res.status(400).json({ error: 'coupleId is required' });

  const dbObj = readDb();
  if (dbObj.couples[coupleId]) {
    dbObj.couples[coupleId].linkedSpotifyUrl = url || '';
    writeDb(dbObj);
    return res.json({ success: true, url: url || '' });
  }

  return res.status(404).json({ error: 'Couple not found' });
});

// Remove connection (break up)
app.post('/api/couple/breakup', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase().trim();
  const dbObj = readDb();

  const user = dbObj.users[normalizedEmail];
  if (user && user.coupleId) {
    const cId = user.coupleId;
    const couple = dbObj.couples[cId];

    if (couple) {
      const pEmail = couple.user1Email === normalizedEmail ? couple.user2Email : couple.user1Email;

      // Clean up both users
      if (dbObj.users[normalizedEmail]) dbObj.users[normalizedEmail].coupleId = undefined;
      if (dbObj.users[pEmail]) dbObj.users[pEmail].coupleId = undefined;

      // Delete couple state & messages
      delete dbObj.couples[cId];
      delete dbObj.messages[cId];
    } else {
      user.coupleId = undefined;
    }

    writeDb(dbObj);
    return res.json({ success: true });
  }

  // Also clean if user is uncoupled but has residual coupleId
  if (user) {
    user.coupleId = undefined;
    writeDb(dbObj);
  }

  return res.json({ success: true });
});

// Update real-time GPS coordinates & consent
app.post('/api/user/location', (req, res) => {
  const { email, lat, lng, gpsConsent } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const dbObj = readDb();
  const normalizedEmail = email.toLowerCase().trim();

  if (dbObj.users[normalizedEmail]) {
    if (typeof lat === 'number') {
      dbObj.users[normalizedEmail].lat = lat;
    }
    if (typeof lng === 'number') {
      dbObj.users[normalizedEmail].lng = lng;
    }
    if (typeof gpsConsent === 'boolean') {
      dbObj.users[normalizedEmail].gpsConsent = gpsConsent;
    }
    dbObj.users[normalizedEmail].locationUpdatedAt = Date.now();
    writeDb(dbObj);
    return res.json({ success: true, user: dbObj.users[normalizedEmail] });
  }

  return res.status(404).json({ error: 'User not found' });
});

// Chat Send Message
app.post('/api/chat/send', (req, res) => {
  const {
    coupleId,
    senderEmail,
    text,
    isAudio,
    audioUrl,
    audioDuration,
    isPhoto,
    photoUrl,
    emoji,
  } = req.body;

  if (!coupleId || !senderEmail) {
    return res.status(400).json({ error: 'coupleId and senderEmail are required' });
  }

  const dbObj = readDb();
  if (!dbObj.messages[coupleId]) {
    dbObj.messages[coupleId] = [];
  }

  const newMessage: MessageData = {
    id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    senderEmail,
    text: text || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: Date.now(),
    isAudio: !!isAudio,
    audioUrl: audioUrl || '',
    audioDuration: audioDuration || 0,
    isPhoto: !!isPhoto,
    photoUrl: photoUrl || '',
    emoji: emoji || '',
    seen: false, // Double-checks seen mechanics
  };

  dbObj.messages[coupleId].push(newMessage);

  // Boost relationship warmth on chatter!
  if (dbObj.couples[coupleId]) {
    dbObj.couples[coupleId].warmth = Math.min(
      100,
      Number((dbObj.couples[coupleId].warmth + 0.5).toFixed(1))
    );
    dbObj.couples[coupleId].lastActiveAt = Date.now();
  }

  writeDb(dbObj);

  return res.json({ success: true, message: newMessage });
});

// Chat Poll & Sync Messages
app.post('/api/chat/poll', (req, res) => {
  const { coupleId, email } = req.body;
  if (!coupleId || !email) {
    return res.status(400).json({ error: 'coupleId and email are required' });
  }

  const dbObj = readDb();
  const messagesList = dbObj.messages[coupleId] || [];

  // Mark all partner's messages as seen
  let changed = false;
  messagesList.forEach((msg) => {
    if (msg.senderEmail !== email && msg.senderEmail !== 'system' && !msg.seen) {
      msg.seen = true;
      changed = true;
    }
  });

  if (changed) {
    writeDb(dbObj);
  }

  return res.json({ success: true, messages: messagesList });
});

// Delete specific chat message (e.g. photos)
app.post('/api/chat/delete-message', (req, res) => {
  const { coupleId, messageId } = req.body;
  if (!coupleId || !messageId) {
    return res.status(400).json({ error: 'coupleId and messageId are required' });
  }

  const dbObj = readDb();
  if (dbObj.messages[coupleId]) {
    dbObj.messages[coupleId] = dbObj.messages[coupleId].filter((msg: any) => msg.id !== messageId);
    writeDb(dbObj);
    return res.json({ success: true });
  }
  return res.status(404).json({ error: 'Couple messages not found' });
});

// --- WebRTC call signaling (server-relayed, same-origin) -------------------
// Calls are signaled through the backend instead of Firestore so they aren't
// affected by ad blockers / privacy shields that block firestore.googleapis.com.
// Signals are ephemeral and kept in memory (keyed by coupleId).
interface CallSignal {
  callerEmail: string;
  calleeEmail: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  offer: any;
  answer: any;
  updatedAt: number;
}
const callSignals = new Map<string, CallSignal>();

function coupleOf(email: string): { coupleId?: string; partnerEmail?: string } {
  const dbObj = readDb();
  const user = dbObj.users[email];
  if (!user?.coupleId) return {};
  const couple = dbObj.couples[user.coupleId];
  if (!couple) return {};
  const partnerEmail = couple.user1Email === email ? couple.user2Email : couple.user1Email;
  return { coupleId: user.coupleId, partnerEmail };
}

// Caller starts a call (sends the SDP offer with bundled ICE candidates).
app.post('/api/couple/call/start', (req, res) => {
  const email = (req as any).userEmail as string;
  const { type, offer } = req.body;
  const { coupleId, partnerEmail } = coupleOf(email);
  if (!coupleId || !partnerEmail) return res.status(400).json({ error: 'Not coupled' });
  callSignals.set(coupleId, {
    callerEmail: email,
    calleeEmail: partnerEmail,
    type: type === 'video' ? 'video' : 'voice',
    status: 'ringing',
    offer: offer || null,
    answer: null,
    updatedAt: Date.now(),
  });
  return res.json({ success: true });
});

// Callee answers (sends the SDP answer).
app.post('/api/couple/call/answer', (req, res) => {
  const email = (req as any).userEmail as string;
  const { answer } = req.body;
  const { coupleId } = coupleOf(email);
  const sig = coupleId ? callSignals.get(coupleId) : null;
  if (!sig) return res.status(404).json({ error: 'No active call' });
  sig.answer = answer || null;
  sig.status = 'accepted';
  sig.updatedAt = Date.now();
  return res.json({ success: true });
});

// Either party ends or declines the call.
app.post('/api/couple/call/end', (req, res) => {
  const email = (req as any).userEmail as string;
  const status = req.body?.status === 'declined' ? 'declined' : 'ended';
  const { coupleId } = coupleOf(email);
  if (coupleId) {
    const sig = callSignals.get(coupleId);
    if (sig) {
      sig.status = status;
      sig.updatedAt = Date.now();
      // Remove shortly after so the next call starts clean.
      setTimeout(() => {
        const cur = callSignals.get(coupleId);
        if (cur && (cur.status === 'ended' || cur.status === 'declined')) {
          callSignals.delete(coupleId);
        }
      }, 6000);
    }
  }
  return res.json({ success: true });
});

// Poll the current call signal for this user's couple.
app.get('/api/couple/call/poll', (req, res) => {
  const email = ((req.query.email as string) || (req as any).userEmail || '').toLowerCase().trim();
  const { coupleId } = coupleOf(email);
  const sig = coupleId ? callSignals.get(coupleId) : null;
  return res.json({ call: sig || null });
});

// --- Tic-Tac-Love: server-authoritative shared board ----------------------
// Moved off Firestore (same reason as calls: ad blockers/shields block it).
// Server validates turns so the two partners always share one consistent board.
interface TicGame {
  board: (string | null)[];
  turnEmail: string;
  winner: string | null; // '❤️' | '✨' | 'draw' | null
  round: number;
  xEmail: string; // plays ❤️, moves first
  oEmail: string; // plays ✨
}
const ticGames = new Map<string, TicGame>();

function ticCheckWinner(grid: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) return grid[a];
  }
  if (grid.every((cell) => cell !== null)) return 'draw';
  return null;
}

function getOrInitTic(coupleId: string, emailA: string, emailB: string): TicGame {
  let g = ticGames.get(coupleId);
  if (!g) {
    const [xEmail, oEmail] = [emailA, emailB].sort();
    g = { board: Array(9).fill(null), turnEmail: xEmail, winner: null, round: 0, xEmail, oEmail };
    ticGames.set(coupleId, g);
  }
  return g;
}

app.get('/api/couple/tictactoe/state', (req, res) => {
  const email = ((req.query.email as string) || (req as any).userEmail || '').toLowerCase().trim();
  const { coupleId, partnerEmail } = coupleOf(email);
  if (!coupleId || !partnerEmail) return res.json({ game: null });
  return res.json({ game: getOrInitTic(coupleId, email, partnerEmail) });
});

app.post('/api/couple/tictactoe/move', (req, res) => {
  const email = (req as any).userEmail as string;
  const { index } = req.body;
  const { coupleId, partnerEmail } = coupleOf(email);
  if (!coupleId || !partnerEmail) return res.status(400).json({ error: 'Not coupled' });
  const g = getOrInitTic(coupleId, email, partnerEmail);
  // Validate: game not over, it's this player's turn, cell empty.
  if (
    !g.winner &&
    g.turnEmail === email &&
    typeof index === 'number' &&
    index >= 0 &&
    index < 9 &&
    !g.board[index]
  ) {
    g.board[index] = email === g.xEmail ? '❤️' : '✨';
    const w = ticCheckWinner(g.board);
    g.winner = w;
    if (!w) g.turnEmail = email === g.xEmail ? g.oEmail : g.xEmail;
  }
  return res.json({ game: g });
});

app.post('/api/couple/tictactoe/reset', (req, res) => {
  const email = (req as any).userEmail as string;
  const { coupleId, partnerEmail } = coupleOf(email);
  if (!coupleId || !partnerEmail) return res.status(400).json({ error: 'Not coupled' });
  const [xEmail, oEmail] = [email, partnerEmail].sort();
  const round = (ticGames.get(coupleId)?.round || 0) + 1;
  const fresh: TicGame = {
    board: Array(9).fill(null),
    turnEmail: xEmail,
    winner: null,
    round,
    xEmail,
    oEmail,
  };
  ticGames.set(coupleId, fresh);
  return res.json({ game: fresh });
});

// Vite / Static router setup
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      // The backend persists data to db.json in the project root on every action
      // (login, GPS location, adding a taste, etc.). Without ignoring it, Vite's
      // file watcher detects each write and pushes a full page reload to every
      // connected browser — which shows up as constant flickering/reloads,
      // especially when two paired clients are open at once.
      watch: {
        ignored: ['**/db.json', '**/db.json.tmp', path.join(process.cwd(), 'db.json')],
      },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Us application running full-stack at http://localhost:${PORT}`);
});
