<div align="center">

# 💞 Us — App para Parejas a Distancia

Una aplicación full‑stack para parejas: chat privado en tiempo real, ubicación
GPS compartida en un mapa, llamadas/video simuladas con "watch‑party", álbum de
recuerdos, buzón de cartas y regalos, juegos, gustos en común y generación de
escenas románticas con IA.

</div>

---

## ✨ Funcionalidades

- **Vinculación de pareja** por código PIN o enlace/QR (cada quien con su correo).
- **Chat privado (AmourPhone)** con notas de voz, fotos y stickers, sincronizado en tiempo real.
- **Ubicación GPS compartida** en mapa (radar en vivo + Google Maps), con distancia y tiempo estimado de encuentro.
- **Medidor de "calidez"** de la relación que sube con las interacciones.
- **Buzón de amor**: cartas y regalos interactivos.
- **Gustos en común**: si coinciden con los de tu pareja, hacen _match_ automático.
- **Llamadas de voz/video reales (WebRTC)** entre la pareja, con timbre entrante (aceptar/rechazar) y compartir pantalla en escritorio.
- **Álbum de recuerdos compartido**: ambos suben sus fotos (propias o juntos) y quedan guardadas juntas en el álbum, con subida a Cloudinary.
- **Multi‑idioma**: Español, Inglés y Portugués.

## 🧱 Stack técnico

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Backend:** Express (servido con `tsx`), que además monta Vite en _middleware mode_ en desarrollo.
- **Tiempo real:** Cloud Firestore (ubicación de la pareja vía WebSockets).
- **Persistencia de datos:** archivo `db.json` en el servidor (usuarios, parejas, mensajes, sesiones).
- **Media:** Cloudinary (subidas sin firma) para fotos y audios.
- **Auth:** OAuth de Google (con pantalla simulada de respaldo para desarrollo) + token de sesión.

## 🗂️ Estructura del proyecto

```
.
├── server.ts                 # Servidor Express + API + Vite middleware + db.json
├── vite.config.ts            # Config de Vite (ignora db.json en el watcher)
├── index.html
├── db.json                   # Almacén de datos en disco (se crea/actualiza solo)
├── firebase-applet-config.json
├── cloudinary-config.json    # { cloudName, uploadPreset } (valores públicos)
├── firestore.rules           # Reglas de seguridad de Firestore
└── src/
    ├── main.tsx              # Entry point (instala el wrapper de auth de fetch)
    ├── App.tsx               # Estado global, login, polling y sincronización
    ├── api.ts                # Token de sesión + wrapper de fetch para /api/*
    ├── firebase.ts           # Inicialización de Firebase/Firestore
    ├── storage.ts            # Subidas a Cloudinary
    ├── translations.ts       # i18n (es / en / pt)
    ├── types.ts
    ├── hooks/
    │   ├── useCallSimulation.ts   # Estado de llamadas/watch‑party
    │   └── useGpsTracking.ts      # GPS, mapa, geocoding y permisos
    ├── utils/                # Funciones puras (geo, formato)
    ├── data/                 # Datos constantes (presets de avatar)
    └── components/           # UI (HomeSection + paneles/modales/secciones)
```

> `HomeSection` actúa como contenedor y delega en componentes y hooks dedicados.

## 🚀 Cómo correrlo en local

**Requisitos:** Node.js 18+ (recomendado 20+).

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env.local` con tus variables (ver [`.env.example`](.env.example)).
3. Configura `cloudinary-config.json` con tu `cloudName` y tu `uploadPreset` sin firma.
4. Arranca en modo desarrollo:
   ```bash
   npm run dev
   ```
   La app queda disponible en `http://localhost:3000`.

### Scripts

| Script          | Qué hace                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `npm run dev`   | Servidor de desarrollo (Express + Vite middleware).                      |
| `npm run build` | Compila el frontend (Vite) y empaqueta el servidor (esbuild) en `dist/`. |
| `npm start`     | Ejecuta el build de producción (`node dist/server.js`).                  |
| `npm run lint`  | Chequeo de tipos con `tsc --noEmit`.                                     |

## 🔐 Variables de entorno

Definir en `.env.local` (no se sube al repo):

| Variable               | Requerida       | Para qué                          |
| ---------------------- | --------------- | --------------------------------- |
| `GOOGLE_CLIENT_ID`     | Para login real | OAuth de Google en producción.    |
| `GOOGLE_CLIENT_SECRET` | Para login real | Intercambio del código OAuth.     |
| `APP_URL`              | Opcional        | URL pública para callbacks/links. |

Si no defines `GOOGLE_CLIENT_ID`, el servidor usa una **pantalla de login simulada**
para poder desarrollar/probar sin OAuth real.

## 🛡️ Notas de seguridad (importante para producción)

- **Login simulado solo para demo:** la pantalla de "Google" de respaldo permite entrar
  con cualquier correo. En producción **configura el OAuth real** (`GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET`) para que la verificación de identidad sea real.
- **Tokens de sesión:** al iniciar sesión el servidor emite un token que el cliente envía
  en cada petición a `/api/*` (header `x-session-token`). El middleware exige token válido,
  impide actuar como otro correo e impide acceder a una pareja ajena.
- **`db.json`** es un almacén sencillo en disco, ideal para demo/portafolio. Para producción
  conviene migrar a una base de datos real (Firestore, Postgres, etc.).
- `cloudinary-config.json` contiene valores **públicos por diseño** (cloud name + preset sin
  firma); no hay secretos ahí.

## 🏗️ Arquitectura y sincronización

- El cliente hace **polling** de `/api/couple/state` cada 4 s para sincronizar estado;
  se **pausa cuando la pestaña está oculta** y se reanuda al volver.
- La **ubicación GPS** va por **Firestore en tiempo real** (no por polling), con un
  **umbral anti‑jitter** (~11 m) para no re‑renderizar con el temblor del GPS.
- El servidor escribe `db.json` de forma **atómica** (archivo temporal + rename) para no
  corromper los datos, y Vite **ignora `db.json`** en su watcher (si no, recargaba la página).

---

Hecho con ❤️ como proyecto de portafolio.
