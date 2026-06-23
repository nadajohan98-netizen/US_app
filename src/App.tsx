import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppTab, CoupleState, LanguageCode } from './types';
import { translations } from './translations';
// Code-split each tab so mobile users only download the module they actually open.
const HomeSection = lazy(() => import('./components/HomeSection'));
const GamesSection = lazy(() => import('./components/GamesSection'));
const DrawSection = lazy(() => import('./components/DrawSection'));
const MagicSection = lazy(() => import('./components/MagicSection'));
const AmourPhone = lazy(() => import('./components/AmourPhone'));
import { Home, Gamepad2, Brush, Camera, MessageCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { setSessionToken } from './api';
import { useWebRTCCall } from './hooks/useWebRTCCall';
import CallScreen from './components/CallScreen';

interface FloatingHeart {
  id: number;
  left: number;
  size: number;
  delay: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [language, setLanguage] = useState<LanguageCode>('es');

  // Adorable initial couple state
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('couple_app_email') || null;
  });

  const [couple, setCouple] = useState<CoupleState>(() => {
    const email = localStorage.getItem('couple_app_email');
    if (email) {
      const saved = localStorage.getItem('couple_app_state_' + email);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    // If not logged in with Google, we start with completely EMPTY/BLANK states!
    // "y claro al momento de que una persona se instale la app no tendra nada de esta informacion... al inicio salir vacio"
    return {
      meName: '',
      meAvatar: '',
      partnerName: '',
      partnerAvatar: '',
      warmth: 0,
      streak: 0,
      lastPlayedSongTime: '',
      songPlaying: false,
      whispersCount: 0,
      chatMessages: [],
      lastInteractionType: null,
      lastInteractionTime: null,
      letters: [],
      gifts: [],
      mePoints: 0,
      partnerPoints: 0,
      linkedSpotifyUrl: '',
      commonItems: [],
      memories: [],
    };
  });

  // Invitation / Pairing states from URL
  const [partnerInvite, setPartnerInvite] = useState<{
    code: string;
    name: string;
    avatar: string;
  } | null>(null);
  const [partnerInviteError, setPartnerInviteError] = useState<string | null>(null);
  const [appToast, setAppToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 5000);
  };
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  // Permission management state
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(() => {
    return localStorage.getItem('permissions_granted') === 'true';
  });

  // Pairing PIN states
  const [myPairingPin, setMyPairingPin] = useState<string>('');
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [partnerPinInput, setPartnerPinInput] = useState<string>('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState<boolean>(false);
  const [isScanningSimulated, setIsScanningSimulated] = useState<boolean>(false);
  const [qrScanningActive, setQrScanningActive] = useState<boolean>(false);

  // Request browser location and audio permissions
  const requestMediaAndGeoPermissions = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 8000 }
        );
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Media prompt bypassed or timed out context');
      }
      localStorage.setItem('permissions_granted', 'true');
      setPermissionsGranted(true);
      triggerToast('✨ Permisos activados exitosamente!');
      addFloatingHearts();
    } catch (e) {
      console.error('Error asking for permissions:', e);
      localStorage.setItem('permissions_granted', 'true');
      setPermissionsGranted(true);
    }
  };

  // Generate pairing code from server
  const fetchMyPairingPin = async (userEmail: string) => {
    if (!userEmail) return;
    setPinLoading(true);
    try {
      const res = await fetch('/api/couple/create-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyPairingPin(data.code);
      }
    } catch (err) {
      console.error('Error obtaining pair ticket');
    } finally {
      setPinLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail && !couple.coupleId && !myPairingPin) {
      fetchMyPairingPin(currentUserEmail);
    }
  }, [currentUserEmail, couple.coupleId, myPairingPin]);

  // Simple localized translator function
  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  useEffect(() => {
    // Generate initial ambient hearts
    const initialHeartsList = Array.from({ length: 8 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 100,
      size: Math.random() * 12 + 10,
      delay: Math.random() * 8,
    }));
    setHearts(initialHeartsList);

    // Parse URL query codes for coupling (?joinCode=CODE_HERE&joinName=NAME_HERE&joinAvatar=...)
    const params = new URLSearchParams(window.location.search);

    // Non-popup login fallback: the OAuth callback may redirect with ?loggedEmail=&token=
    const loggedEmail = params.get('loggedEmail');
    const loggedToken = params.get('token');
    if (loggedEmail) {
      const cleanEmail = loggedEmail.toLowerCase().trim();
      if (loggedToken) setSessionToken(loggedToken);
      localStorage.setItem('couple_app_email', cleanEmail);
      setCurrentUserEmail(cleanEmail);
      // Strip the auth params from the URL so the token isn't left in the address bar.
      params.delete('loggedEmail');
      params.delete('token');
      const rest = params.toString();
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + (rest ? `?${rest}` : '')
      );
    }

    const joinCode = params.get('joinCode') || params.get('partnerCode');
    const joinName = params.get('joinName') || params.get('partnerName');
    const joinAvatar = params.get('joinAvatar') || params.get('partnerAvatar');

    if (joinCode && joinName) {
      setPartnerInvite({
        code: joinCode,
        name: joinName,
        avatar: joinAvatar || '',
      });
    }
  }, []);

  // Listen for official Google Auth login callback popup
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1')
      ) {
        return;
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.user) {
        const user = event.data.user;
        const email = user.email.toLowerCase().trim();
        // Persist the session token so authenticated /api requests are allowed.
        if (event.data.token) {
          setSessionToken(event.data.token);
        }
        localStorage.setItem('couple_app_email', email);
        setCurrentUserEmail(email);

        // Load state corresponding to this email address
        const saved = localStorage.getItem('couple_app_state_' + email);
        if (saved) {
          try {
            setCouple(JSON.parse(saved));
          } catch (e) {
            /* no-op */
          }
        } else {
          // Reset state for new logged-in user email profile
          setCouple((prev) => ({
            ...prev,
            meName: user.name || email.split('@')[0],
            meAvatar:
              user.avatar ||
              'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
            warmth: prev.warmth === 0 ? 80 : prev.warmth,
          }));
        }

        // Celebrate!
        for (let i = 0; i < 6; i++) {
          setTimeout(addFloatingHearts, i * 150);
        }
      }
    };

    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, []);

  const startGoogleLogin = async () => {
    try {
      const origin = window.location.origin;
      const res = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(origin)}`);
      if (!res.ok) throw new Error('Failed to fetch Auth URL');
      const data = await res.json();

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        triggerToast(
          '⚠️ Por favor habilita las ventanas emergentes (popups) de tu navegador para poder sincronizarte mediante Google.'
        );
        return;
      }
    } catch (err) {
      console.error('Google Auth error:');
      triggerToast('⚠️ Error al iniciar la conexión oficial de Google. Revisa tu conexión de red.');
    }
  };

  // Save changes ONLY if logged in to Google! Otherwise, it clears on page reload.
  // "y que toda la informacion del usuario solo se guarde con agragar su correo de lo contrario se le borrara toda la información cada vez que ingrese"
  useEffect(() => {
    if (currentUserEmail) {
      localStorage.setItem('couple_app_state_' + currentUserEmail, JSON.stringify(couple));
    }
  }, [couple]);

  // Real-time Firestore subscription to Partner's GPS location via WebSockets
  useEffect(() => {
    if (!currentUserEmail || !couple.partnerEmail) return;

    const partnerEmailClean = couple.partnerEmail.toLowerCase().trim();
    const docRef = doc(db, 'locations', partnerEmailClean);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCouple((prev) => {
            if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return prev;
            // Ignore sub-~11m GPS jitter so a moving/idle partner doesn't trigger
            // a constant re-render loop on this client.
            const EPS = 0.0001;
            const latMoved =
              typeof prev.partnerLat !== 'number' || Math.abs(data.lat - prev.partnerLat) > EPS;
            const lngMoved =
              typeof prev.partnerLng !== 'number' || Math.abs(data.lng - prev.partnerLng) > EPS;
            const nextConsent = data.gpsConsent ?? prev.partnerGpsConsent;
            const consentChanged = nextConsent !== prev.partnerGpsConsent;
            if (!latMoved && !lngMoved && !consentChanged) return prev;
            return {
              ...prev,
              partnerLat: data.lat,
              partnerLng: data.lng,
              partnerGpsConsent: nextConsent,
              partnerLocationUpdatedAt: data.updatedAt || Date.now(),
            };
          });
        }
      },
      (error) => {
        console.warn("Error listening to partner's location via Firestore:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUserEmail, couple.partnerEmail]);

  // Full-Stack State Polling Loop so both partners sync in real-time automatically!
  useEffect(() => {
    if (!currentUserEmail) return;

    let inFlight = false; // avoid overlapping requests if one is slow
    let cancelled = false; // ignore late responses after unmount / email change
    const POLL_MS = 4000; // gentle interval; real-time GPS still uses Firestore

    const syncState = async () => {
      // Skip while the tab is in the background or a request is already pending.
      if (inFlight || (typeof document !== 'undefined' && document.hidden)) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/couple/state?email=${encodeURIComponent(currentUserEmail)}`);
        if (cancelled) return;
        if (res.status === 401) {
          // Session expired or invalid — clear it so the user is asked to log in again.
          setSessionToken(null);
          localStorage.removeItem('couple_app_email');
          localStorage.removeItem('couple_app_token');
          setCurrentUserEmail(null);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.couple) {
            setCouple((prev) => {
              const formattedMessages = (data.messages || []).map((m: any) => ({
                id: m.id,
                sender:
                  m.senderEmail === currentUserEmail
                    ? 'me'
                    : m.senderEmail === 'system'
                      ? 'system'
                      : 'partner',
                text: m.text,
                timestamp: m.timestamp,
                isAudio: m.isAudio,
                audioUrl: m.audioUrl,
                audioDuration: m.audioDuration,
                isPhoto: m.isPhoto,
                photoUrl: m.photoUrl,
                emoji: m.emoji,
                seen: m.seen,
              }));

              const merged = {
                ...prev,
                meName: data.user.name || currentUserEmail.split('@')[0],
                meAvatar:
                  data.user.avatar ||
                  prev.meAvatar ||
                  'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
                meBirthday: data.user.birthday || '',
                meLat: data.user.lat,
                meLng: data.user.lng,
                meGpsConsent: data.user.gpsConsent,
                partnerName: data.partner
                  ? data.partner.name || data.partner.email.split('@')[0]
                  : '',
                partnerAvatar: data.partner
                  ? data.partner.avatar ||
                    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80'
                  : '',
                partnerBirthday: data.partner ? data.partner.birthday || '' : '',
                partnerLat: data.partner ? data.partner.lat : undefined,
                partnerLng: data.partner ? data.partner.lng : undefined,
                partnerGpsConsent: data.partner ? data.partner.gpsConsent : undefined,
                partnerLocationUpdatedAt: data.partner ? data.partner.locationUpdatedAt : undefined,
                partnerEmail: data.partner ? data.partner.email : '',
                coupleId: data.couple.id,
                warmth: data.couple.warmth,
                streak: data.couple.streak,
                linkedSpotifyUrl: data.couple.linkedSpotifyUrl,
                chatTheme: data.couple.chatTheme || 'rose',
                chatMessages: formattedMessages,
                commonItems: data.commonItems || data.couple.commonItems || prev.commonItems || [],
                memories: data.couple.memories || prev.memories || [],
                celebrations: data.couple.celebrations || [],
              };
              // Skip the re-render + localStorage write when nothing actually changed.
              if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
              return merged;
            });
          } else {
            // Logged in but not coupled yet. Refresh profile + own tastes, clear any
            // stale partner data, but ONLY re-render when something actually changed.
            setCouple((prev) => {
              const merged = {
                ...prev,
                meName: data.user.name || currentUserEmail.split('@')[0],
                meAvatar:
                  data.user.avatar ||
                  prev.meAvatar ||
                  'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
                meBirthday: data.user.birthday || '',
                meLat: data.user.lat,
                meLng: data.user.lng,
                meGpsConsent: data.user.gpsConsent,
                partnerName: '',
                partnerAvatar: '',
                partnerBirthday: '',
                partnerEmail: '',
                partnerLat: undefined,
                partnerLng: undefined,
                partnerGpsConsent: undefined,
                coupleId: undefined,
                celebrations: [],
                warmth: 0,
                streak: 0,
                lastPlayedSongTime: '',
                songPlaying: false,
                whispersCount: 0,
                chatMessages: [],
                lastInteractionType: null,
                lastInteractionTime: null,
                letters: [],
                gifts: [],
                mePoints: 0,
                partnerPoints: 0,
                linkedSpotifyUrl: '',
                commonItems: data.commonItems || prev.commonItems || [],
                memories: [],
              };
              // Skip the re-render + localStorage write when nothing actually changed.
              if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Polled state synchronization error:', error);
      } finally {
        inFlight = false;
      }
    };

    syncState();
    const intervalTimer = setInterval(syncState, POLL_MS);

    // Resync immediately when the user comes back to the tab.
    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) syncState();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentUserEmail]);

  // Utility to let sections spawn interactive hearts
  const addFloatingHearts = () => {
    const newHeartId = Date.now();
    const newHeartObj: FloatingHeart = {
      id: newHeartId,
      left: Math.random() * 100,
      size: Math.random() * 15 + 12,
      delay: 0,
    };
    setHearts((prev) => [...prev, newHeartObj]);

    // Cleanup stale hearts to optimize client page calculations
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeartId));
    }, 6000);
  };

  // Accept URL partnership sync invitation: automatically joins through full-stack join API
  const acceptPartnerInvite = async () => {
    if (!partnerInvite) return;
    setPartnerInviteError(null);

    // If guest / not logged in, prompt they must link Google Email first
    if (!currentUserEmail) {
      setPartnerInviteError(
        'Inicia sesión con tu de Google primero para poder guardar esta vinculación.'
      );
      return;
    }

    try {
      const joinRes = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          code: partnerInvite.code,
        }),
      });

      if (joinRes.ok) {
        const data = await joinRes.json();
        setCouple((prev) => ({
          ...prev,
          partnerName: partnerInvite.name,
          partnerAvatar:
            partnerInvite.avatar ||
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80',
          warmth: Math.max(prev.warmth, 85),
          streak: Math.max(prev.streak, 1),
          coupleId: data.couple.id,
        }));
        setPartnerInvite(null);
        for (let i = 0; i < 8; i++) {
          setTimeout(addFloatingHearts, i * 150);
        }
        // Clean up query string so it doesn't prompt again
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const err = await joinRes.json();
        setPartnerInviteError(err.error || 'Fallo en el intento de vinculación automática.');
      }
    } catch (e) {
      console.error(e);
      setPartnerInviteError('Error al conectar con la bóveda de emparejamiento.');
    }
  };

  // Connects using a 6-character partner PIN
  const submitPairingPin = async (codeToSubmit: string) => {
    if (!currentUserEmail) return;
    setPairingError(null);
    setPairingSuccess(false);

    const cleanCode = codeToSubmit.trim();
    if (!cleanCode) {
      setPairingError('Por favor ingresa un código válido de 6 caracteres.');
      return;
    }

    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          code: cleanCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPairingSuccess(true);
        triggerToast('💘 ¡Vinculación exitosa con tu pareja! Bienvenidos a bordo.');

        // Fetch fresh state immediately
        const stateRes = await fetch(
          `/api/couple/state?email=${encodeURIComponent(currentUserEmail)}`
        );
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData.couple) {
            setCouple((prev) => ({
              ...prev,
              coupleId: stateData.couple.id,
              partnerName: stateData.partner?.name || 'Pareja',
              partnerAvatar: stateData.partner?.avatar || '',
              warmth: stateData.couple.warmth,
              streak: stateData.couple.streak,
              memories: stateData.couple.memories || [],
            }));
          }
        }

        for (let i = 0; i < 12; i++) {
          setTimeout(addFloatingHearts, i * 180);
        }
      } else {
        const err = await res.json();
        setPairingError(err.error || 'No se pudo encontrar ese código o vincular las cuentas.');
      }
    } catch (e) {
      console.error(e);
      setPairingError('Ocurrió un error al vincular con el servidor.');
    }
  };

  const recordCoupleInteraction = async (increment: number) => {
    // If not logged in or not coupled, update locally
    if (!currentUserEmail || !couple.coupleId) {
      setCouple((prev) => ({
        ...prev,
        warmth: Math.min(100, Number(((prev.warmth || 50) + increment).toFixed(1))),
      }));
      return;
    }

    try {
      const res = await fetch('/api/couple/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: couple.coupleId,
          increment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCouple((prev) => ({
          ...prev,
          warmth: data.warmth,
        }));
      } else {
        setCouple((prev) => ({
          ...prev,
          warmth: Math.min(100, Number(((prev.warmth || 50) + increment).toFixed(1))),
        }));
      }
    } catch (e) {
      console.error('Error recording couple interaction:', e);
      setCouple((prev) => ({
        ...prev,
        warmth: Math.min(100, Number(((prev.warmth || 50) + increment).toFixed(1))),
      }));
    }
  };

  // Real-time WebRTC calling (audio/video) with Firestore signaling + ringing.
  const webrtc = useWebRTCCall({
    currentUserEmail: currentUserEmail,
    partnerEmail: couple.partnerEmail || null,
    coupleId: couple.coupleId || null,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-200 font-sans overflow-x-hidden relative flex flex-col selection:bg-[#ff4d6d]/30 selection:text-white pb-20">
      {/* Real-time call overlay (incoming ring + active call) */}
      <CallScreen
        status={webrtc.status}
        callType={webrtc.callType}
        muted={webrtc.muted}
        cameraOff={webrtc.cameraOff}
        isSharingScreen={webrtc.isSharingScreen}
        canShareScreen={webrtc.canShareScreen}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        remoteStreamRevision={webrtc.remoteStreamRevision}
        partnerName={couple.partnerName}
        partnerAvatar={couple.partnerAvatar}
        meAvatar={couple.meAvatar}
        lang={language}
        onAccept={webrtc.acceptCall}
        onDecline={webrtc.declineCall}
        onHangUp={webrtc.hangUp}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onShareScreen={webrtc.shareScreen}
      />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="absolute bottom-[-5vh] text-[#ff4d6d]/8 fill-[#ff4d6d]/5 animate-[float_10s_linear_infinite] select-none"
            style={{
              left: `${heart.left}%`,
              fontSize: `${heart.size}px`,
              animationDelay: `${heart.delay}s`,
              transform: 'translateY(100vh)',
            }}
          >
            ♥
          </span>
        ))}
      </div>

      {/* PAIRING REQUEST INCOMING OVERLAY */}
      {partnerInvite && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-pink-500/30 rounded-3xl p-6 text-center max-w-[350px] w-full space-y-4 shadow-2xl relative">
            <span className="text-4xl inline-block animate-bounce">💌💘</span>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                ¡Invitación de Conexión!
              </h3>
              <p className="text-[11px] text-slate-300">
                Tu pareja <strong className="text-pink-550">{partnerInvite.name}</strong> quiere
                vincular su cuenta contigo para compartir el Álbum, Cha y Juegos de Amor.
              </p>
            </div>

            {partnerInviteError && (
              <div className="p-3 rounded-xl bg-red-950/45 border border-red-500/20 text-[10px] text-red-300 text-left leading-relaxed">
                <span className="font-bold text-red-400 block mb-0.5">⚠️ Error de Vinculación</span>
                {partnerInviteError}
                {currentUserEmail === 'nadajohan98@gmail.com' && (
                  <span className="block mt-1 text-[9px] text-[#ffccd5]">
                    Para probar con otro correo simulado, abre una ventana privada de incógnito e
                    ingresa en &quot;Vincular con Google&quot; usando{' '}
                    <strong>&quot;O ACCEDE CON OTRO CORREO&quot;</strong> (ej. pareja@gmail.com)
                    para crear dos perfiles diferentes.
                  </span>
                )}
              </div>
            )}

            {!currentUserEmail ? (
              <div className="space-y-3.5 pt-2 text-left border-t border-white/5">
                <span className="text-[9px] font-black uppercase text-pink-500 tracking-widest block">
                  Verificación de Cuenta Requerida
                </span>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Para poder sincronizarte en tiempo real con <strong>{partnerInvite.name}</strong>,
                  guardar cartas, respuestas y personalizar tu avatar de forma duradera, debes
                  acceder oficialmente con tu Google.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setPartnerInvite(null);
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                    className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-[#1e1e24] border-none"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={startGoogleLogin}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.02] text-white font-sans font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg transition-all border-none cursor-pointer"
                  >
                    Iniciar con Google 🔑
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setPartnerInvite(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer border border-[#1e1e24]"
                >
                  Rechazar
                </button>
                <button
                  onClick={acceptPartnerInvite}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.02] text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer border-none"
                >
                  Aceptar 💖
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container Wrapper */}
      <main
        className={`flex-1 w-full mx-auto px-5 pt-4 z-10 transition-all duration-300 ${activeTab === 'chat' ? 'max-w-[1100px]' : 'max-w-[600px]'}`}
      >
        {/* Step 1: Request Geolocation & Media Permissions */}
        {!permissionsGranted && (
          <div className="max-w-md mx-auto my-8 bg-[#121216] border border-[#ff4d6d]/20 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-[#ff4d6d]/10 rounded-full flex items-center justify-center mx-auto text-[#ff4d6d] text-4xl animate-pulse">
              🛰️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                Us • Permisos Requeridos
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                ¡Hola, enamorado/a! Para que la sincronización en tiempo real, mapas y videollamadas
                funcionen, necesitamos activar los permisos de tu navegador.
              </p>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 text-left space-y-4 border border-white/5">
              <div className="flex gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <span className="text-[11px] font-bold text-white block">
                    Ubicación GPS (Tiempo Real)
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Muestra la distancia exacta entre ambos en un mapa interactivo para acortar lat,
                    distancia.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <span className="text-lg">🎙️</span>
                <div>
                  <span className="text-[11px] font-bold text-white block">Cámara y Micrófono</span>
                  <p className="text-[10px] text-zinc-500">
                    Obligatorio para enviar audios románticos y realizar llamadas interactivas de
                    amor.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={requestMediaAndGeoPermissions}
              className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.01] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer border-none"
            >
              Aceptar y Activar Sincronización 🔗
            </button>
          </div>
        )}

        {/* Step 2: Google Authentication Required */}
        {permissionsGranted && !currentUserEmail && (
          <div className="max-w-md mx-auto my-8 bg-[#121216] border border-[#ff4d6d]/20 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400 text-4xl">
              🔑
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                Tus Recuerdos en la Nube
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Inicia sesión de forma rápida y segura con Google para resguardar tus cartas, fotos
                y línea del tiempo de pareja de por vida sin saturar tu dispositivo.
              </p>
            </div>

            <button
              onClick={startGoogleLogin}
              className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-purple-650 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <span>Ingresar con Google 🌐</span>
            </button>

            <button
              onClick={() => setPermissionsGranted(false)}
              className="text-[10px] text-zinc-500 hover:text-rose-400 underline block mx-auto cursor-pointer bg-transparent border-none"
            >
              Revisar permisos del dispositivo
            </button>
          </div>
        )}

        {/* Step 3: Pair Accounts via Interactive QR & Numeric Code */}
        {permissionsGranted && currentUserEmail && !couple.coupleId && (
          <div className="max-w-2xl mx-auto my-4 space-y-6 animate-fadeIn pb-12">
            <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <span className="text-4xl text-rose-500 block animate-bounce">💌</span>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
                  Bóveda de Sincronización de Pareja
                </h2>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  Para habilitar el chat secreto, álbum de recuerdos y ubicación GPS en vivo,
                  vincula tu cuenta con tu amor. Es un proceso inmediato y único.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* QR Display Frame */}
                <div className="bg-black/45 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4 text-center">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">
                    Tu Código QR de Sincronización
                  </span>

                  {myPairingPin ? (
                    <div className="p-2 bg-white rounded-2xl aspect-square w-44 flex items-center justify-center shadow-lg relative group">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/?joinCode=' + myPairingPin)}`}
                        alt="Pairing QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-600 animate-pulse text-xs">
                      Cargando QR...
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block">
                      Tu código numérico manual:
                    </span>
                    <strong className="text-lg md:text-xl font-mono text-white tracking-widest uppercase bg-zinc-900/60 px-3 py-1 rounded-lg border border-white/10 select-all">
                      {myPairingPin || 'Generando...'}
                    </strong>
                  </div>
                </div>

                {/* Input Pin Code / Scanner Simulator */}
                <div className="bg-black/45 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block leading-none">
                      Vincular con tu Amor
                    </span>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Escanea su código QR o escribe su código numérico de 6 dígitos a continuación.
                    </p>

                    <div>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="Ej. AB49D2"
                        value={partnerPinInput}
                        onChange={(e) => setPartnerPinInput(e.target.value.toUpperCase())}
                        className="w-full text-center py-3 bg-zinc-900 border border-white/10 rounded-xl font-mono font-bold text-white tracking-widest placeholder-zinc-700 text-lg focus:border-[#ff4d6d]/40 focus:outline-none transition-colors"
                      />
                    </div>

                    {pairingError && (
                      <p className="text-[10px] text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/20">
                        ⚠️ {pairingError}
                      </p>
                    )}

                    <button
                      onClick={() => submitPairingPin(partnerPinInput)}
                      className="w-full py-3 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.01] active:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer border-none"
                    >
                      Vincular Corazones 💘
                    </button>
                  </div>

                  {/* Camera / Scan QR Simulator Block */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <button
                      onClick={() => setQrScanningActive((prev) => !prev)}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-white/5 flex items-center justify-center gap-1.5"
                    >
                      📷 {qrScanningActive ? 'Apagar Lector QR' : 'Escanear QR de Pareja'}
                    </button>

                    {qrScanningActive && (
                      <div className="aspect-video w-full rounded-xl bg-black border border-rose-500/30 overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.85)_100%)] z-10" />

                        {/* Live camera preview simulator or real feed */}
                        <div className="absolute inset-0 flex items-center justify-center select-none text-zinc-800">
                          <span className="text-[9px] uppercase font-black tracking-widest animate-pulse text-zinc-600">
                            Simulador de Cámara QR Activa
                          </span>
                        </div>

                        {/* Futuristic Green Scanline */}
                        <div className="absolute left-0 right-0 h-0.5 bg-green-400/80 animate-[bounce_3s_infinite] shadow-[0_0_12px_#4ade80] z-20" />

                        {/* Frame corner visual guides */}
                        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-rose-500 z-20" />
                        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-rose-500 z-20" />
                        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-rose-500 z-20" />
                        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-rose-500 z-20" />

                        {/* Simulate Pairing Option for Quick Demo/Test */}
                        <div className="absolute bottom-2 left-2 right-2 z-30 flex gap-1">
                          <button
                            onClick={() => {
                              setPartnerPinInput('SIMULADO');
                              submitPairingPin('SIMULADO');
                            }}
                            className="flex-1 py-1 bg-[#ff4d6d] hover:bg-pink-600 text-white font-black text-[8px] rounded uppercase select-none cursor-pointer border-none"
                          >
                            ⚡ Simular Sincronización Automática (Demo)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reset/Exit Options */}
              <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 justify-between items-center text-[10px] text-zinc-500 font-sans">
                <span>
                  Conectado como: <strong>{currentUserEmail}</strong>
                </span>
                <button
                  onClick={() => {
                    setCurrentUserEmail(null);
                    localStorage.removeItem('couple_app_email');
                    localStorage.removeItem('couple_app_token');
                    localStorage.removeItem('user_email');
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 hover:text-rose-400 rounded transition-colors cursor-pointer border-none"
                >
                  Cerrar Sesión de Google / Usar otro Correo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fully authenticated & paired dashboard tabs (lazy-loaded per tab) */}
        {permissionsGranted && currentUserEmail && couple.coupleId && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
              </div>
            }
          >
            {activeTab === 'home' && (
              <HomeSection
                state={couple}
                setState={setCouple}
                t={t}
                lang={language}
                setLang={setLanguage}
                floatingHearts={hearts}
                addFloatingHearts={addFloatingHearts}
                currentUserEmail={currentUserEmail}
                setCurrentUserEmail={setCurrentUserEmail}
                setActiveTab={setActiveTab}
                startGoogleLogin={startGoogleLogin}
                onInteract={recordCoupleInteraction}
                onStartCall={webrtc.startCall}
              />
            )}

            {activeTab === 'chat' && (
              <div className="bg-[#121216]/20 border border-white/5 rounded-3xl p-1 md:p-3 shadow-2xl relative animate-fadeIn mb-10 overflow-hidden">
                <AmourPhone
                  state={couple}
                  setState={setCouple}
                  t={t}
                  lang={language}
                  addFloatingHearts={addFloatingHearts}
                  currentUserEmail={currentUserEmail}
                  onClose={() => setActiveTab('home')}
                  isTabMode={true}
                  onInteract={recordCoupleInteraction}
                />
              </div>
            )}

            {activeTab === 'games' && (
              <GamesSection
                state={couple}
                setState={setCouple}
                t={t}
                lang={language}
                currentUserEmail={currentUserEmail}
                addFloatingHearts={addFloatingHearts}
                onInteract={recordCoupleInteraction}
              />
            )}

            {activeTab === 'draw' && (
              <DrawSection
                state={couple}
                setState={setCouple}
                t={t}
                lang={language}
                addFloatingHearts={addFloatingHearts}
                onInteract={recordCoupleInteraction}
              />
            )}

            {activeTab === 'magic' && (
              <MagicSection
                state={couple}
                setState={setCouple}
                t={t}
                lang={language}
                addFloatingHearts={addFloatingHearts}
                onInteract={recordCoupleInteraction}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* Persistent Bottom navigation shell */}
      {permissionsGranted && currentUserEmail && couple.coupleId && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0e]/90 backdrop-blur-xl border-t border-white/5 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] rounded-t-3xl animate-slideUp">
          <div className="max-w-[600px] mx-auto flex justify-around items-center px-4">
            {/* 1. Home Tab Button */}
            <button
              onClick={() => {
                setActiveTab('home');
                addFloatingHearts();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-rose-550 text-white rounded-full p-2.5 shadow-[0_4px_15px_rgba(255,77,109,0.3)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-5.5 h-5.5" />
            </button>

            {/* 1.5. Chat Tab Button */}
            <button
              onClick={() => {
                setActiveTab('chat');
                addFloatingHearts();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-rose-550 text-white rounded-full p-2.5 shadow-[0_4px_15px_rgba(255,77,109,0.3)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Chat de Pareja"
            >
              <MessageCircle className="w-5.5 h-5.5" />
            </button>

            {/* 2. Games Tab Button */}
            <button
              onClick={() => {
                setActiveTab('games');
                addFloatingHearts();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'games'
                  ? 'bg-rose-550 text-white rounded-full p-2.5 shadow-[0_4px_15px_rgba(255,77,109,0.3)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-5.5 h-5.5" />
            </button>

            {/* 3. Draw Tab Button */}
            <button
              onClick={() => {
                setActiveTab('draw');
                addFloatingHearts();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-rose-550 text-white rounded-full p-2.5 shadow-[0_4px_15px_rgba(255,77,109,0.3)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brush className="w-5.5 h-5.5" />
            </button>

            {/* 4. AI Photo Studio Tab Button */}
            <button
              onClick={() => {
                setActiveTab('magic');
                addFloatingHearts();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'magic'
                  ? 'bg-rose-550 text-white rounded-full p-2.5 shadow-[0_4px_15px_rgba(255,77,109,0.3)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-5.5 h-5.5" />
            </button>
          </div>
        </nav>
      )}

      {appToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-6 md:right-6 z-[200] max-w-sm w-[90%] md:w-auto bg-stone-900/95 backdrop-blur-md border border-[#ff4d6d]/30 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-[fadeIn_0.2s_ease-out]">
          <span className="text-base">✨</span>
          <p className="text-xs text-slate-200 leading-normal font-sans font-medium">{appToast}</p>
        </div>
      )}
    </div>
  );
}
