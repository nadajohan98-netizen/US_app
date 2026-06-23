import React, { useState, useEffect } from 'react';
import { CoupleState, LanguageCode } from '../types';
import { useGpsTracking } from '../hooks/useGpsTracking';
import PermissionsAssistantModal from './PermissionsAssistantModal';
import GpsPanel from './GpsPanel';
import EditProfileModal from './EditProfileModal';
import GoogleLoginModal from './GoogleLoginModal';
import BreakupModal from './BreakupModal';
import ConnectionPanel from './ConnectionPanel';
import BentoSongChat from './BentoSongChat';
import TopAppBar from './TopAppBar';
import DailyMemoryWidget from './DailyMemoryWidget';
import CelebrationsCard from './CelebrationsCard';
import AmourPhone from './AmourPhone';
import CommonVibes from './CommonVibes';
import LoveMailbox from './LoveMailbox';

interface HomeSectionProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  floatingHearts: { id: number; left: number; size: number; delay: number }[];
  addFloatingHearts: () => void;
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => void;
  setActiveTab?: (tab: any) => void;
  startGoogleLogin?: () => Promise<void>;
  onInteract?: (inc: number) => void;
  onStartCall?: (type: 'voice' | 'video') => void;
}

export default function HomeSection({
  state,
  setState,
  t,
  lang,
  setLang,
  floatingHearts,
  addFloatingHearts,
  currentUserEmail,
  setCurrentUserEmail,
  setActiveTab,
  startGoogleLogin,
  onInteract,
  onStartCall,
}: HomeSectionProps) {
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperAlert, setWhisperAlert] = useState<string | null>(null);

  const showTempAlert = (msg: string) => {
    setWhisperAlert(msg);
    setTimeout(() => {
      setWhisperAlert(null);
    }, 4000);
  };

  // AmourPhone & Automated PIN coupling states
  const [amourPhoneOpen, setAmourPhoneOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');

  useEffect(() => {
    if (pairingOpen && currentUserEmail && !pairingCode) {
      fetch('/api/couple/create-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code) {
            setPairingCode(data.code);
          }
        })
        .catch((err) => console.error('Could not fetch pairing code:'));
    }
  }, [pairingOpen, currentUserEmail, pairingCode]);

  // Conversational dryness / Frialdad state
  const [frialdad, setFrialdad] = useState(30);

  // Profile mod, Google Sync, QR states
  const [editingProfileTarget, setEditingProfileTarget] = useState<'me' | 'partner' | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileAvatarInput, setProfileAvatarInput] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [partnerSearchCode, setPartnerSearchCode] = useState('');
  const [partnerLinkError, setPartnerLinkError] = useState<string | null>(null);
  const [partnerLinkSuccess, setPartnerLinkSuccess] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkCopiedAlert, setLinkCopiedAlert] = useState(false);
  const [showBreakUpModal, setShowBreakUpModal] = useState(false);

  // Real WebRTC calls are started via the onStartCall prop (App-level hook).
  const handleStartCall = (type: 'voice' | 'video') => {
    if (onStartCall) onStartCall(type);
  };

  // GPS tracking + map sharing state and logic (extracted to a hook)
  const {
    showGpsPanel,
    setShowGpsPanel,
    dismissGpsIntro,
    setDismissGpsIntro,
    gpsPasscode,
    gpsLocked,
    setGpsLocked,
    passcodeInput,
    setPasscodeInput,
    locationRequesting,
    userLat,
    setUserLat,
    userLng,
    setUserLng,
    partnerLat,
    setPartnerLat,
    partnerLng,
    setPartnerLng,
    gpsTravelMode,
    setGpsTravelMode,
    isSatelliteView,
    setIsSatelliteView,
    gpsSearchVal,
    setGpsSearchVal,
    gpsCustomSpot,
    setGpsCustomSpot,
    gpsRealtimeMovement,
    setGpsRealtimeMovement,
    googleMapsZoom,
    setGoogleMapsZoom,
    mapViewMode,
    setMapViewMode,
    myGeoQuery,
    setMyGeoQuery,
    partnerGeoQuery,
    setPartnerGeoQuery,
    geoSearching,
    searchAddress,
    triggerLocationRequest,
    handleRequestAllPermissions,
    handleSimulatePermissions,
  } = useGpsTracking({ state, setState, currentUserEmail, lang, addFloatingHearts, showTempAlert });

  // Screen Share & Film Stream state now lives in useCallSimulation

  // Voice-note recording/playback was orphaned here after the chat moved into
  // AmourPhone (which has its own complete implementation), so it was removed.

  // Spotify integration state
  const [spotifyInput, setSpotifyInput] = useState('');
  const linkedSpotifyUrl = state.linkedSpotifyUrl || null;
  const setLinkedSpotifyUrl = (url: string | null) => {
    setState((prev) => ({
      ...prev,
      linkedSpotifyUrl: url || '',
    }));
  };

  // partnerStatusStr + coordinate sync + GPS streaming effects now live in useGpsTracking

  // Sync Video/Film comments rotation effect now lives in useCallSimulation

  // formatDuration now imported from ../utils/format

  const handleLinkSpotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyInput.trim()) return;
    const input = spotifyInput.trim();

    try {
      const res = await fetch('/api/spotify/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
      });

      if (res.ok) {
        const data = await res.json();
        const embed = data.embedUrl;

        // Persist to Express backend if coupled
        if (state.coupleId) {
          await fetch('/api/couple/update-spotify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coupleId: state.coupleId,
              url: embed,
            }),
          });
        }

        setLinkedSpotifyUrl(embed);
        showTempAlert(t('spotifyLinkedSuccess'));
        setSpotifyInput('');
        addFloatingHearts();
      } else {
        const err = await res.json();
        showTempAlert(err.error || t('invalidSpotifyUrl'));
      }
    } catch (err) {
      console.error('Spotify linkage failed:');
      showTempAlert(t('invalidSpotifyUrl'));
    }
  };

  const handleDisconnectSpotify = async () => {
    if (state.coupleId) {
      try {
        await fetch('/api/couple/update-spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: state.coupleId,
            url: '',
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setLinkedSpotifyUrl(null);
    localStorage.removeItem('linkedSpotifyUrl');
  };

  // fetchIpLocation now imported from ../utils/geo

  const handleNudge = () => {
    addFloatingHearts();
    const oldWarmth = state.warmth;
    const incrementAmount = 1.0;
    const newWarmth = Math.min(100, Number((oldWarmth + incrementAmount).toFixed(1)));
    setState((prev) => ({
      ...prev,
      warmth: newWarmth,
      lastInteractionType: 'nudge',
      lastInteractionTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    if (onInteract) onInteract(incrementAmount);

    // Set feedback alert
    const customUserMsg = t('nudgeAlert').replace('{partner}', state.partnerName);
    showTempAlert(customUserMsg);

    // Simular un toque de vuelta
    setTimeout(() => {
      const secondaryIncrement = 1.0;
      setState((prev) => ({
        ...prev,
        warmth: Math.min(100, Number((prev.warmth + secondaryIncrement).toFixed(1))),
        chatMessages: [
          ...prev.chatMessages,
          {
            id: String(Date.now()),
            sender: 'partner',
            text:
              lang === 'es'
                ? `¡Toque de vuelta de ${state.partnerName}! Te amo ❤️`
                : lang === 'en'
                  ? `Nudge back from ${state.partnerName}! Love you ❤️`
                  : `Carinho de volta de ${state.partnerName}! Te amo ❤️`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
      if (onInteract) onInteract(secondaryIncrement);
    }, 3000);
  };

  const handleKiss = () => {
    // Generate lots of hearts
    for (let i = 0; i < 5; i++) {
      setTimeout(addFloatingHearts, i * 150);
    }
    const oldWarmth = state.warmth;
    const incrementAmount = 1.5;
    const newWarmth = Math.min(100, Number((oldWarmth + incrementAmount).toFixed(1)));
    setState((prev) => ({
      ...prev,
      warmth: newWarmth,
      lastInteractionType: 'kiss',
      lastInteractionTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    if (onInteract) onInteract(incrementAmount);

    const customUserMsg = t('kissAlert').replace('{partner}', state.partnerName);
    showTempAlert(customUserMsg);

    // Simulated reply
    setTimeout(() => {
      addFloatingHearts();
      const secondaryIncrement = 1.0;
      setState((prev) => ({
        ...prev,
        warmth: Math.min(100, Number((prev.warmth + secondaryIncrement).toFixed(1))),
        chatMessages: [
          ...prev.chatMessages,
          {
            id: String(Date.now()),
            sender: 'partner',
            text:
              lang === 'es'
                ? `¡Muuuuack! Recibido y devuelto 💋`
                : lang === 'en'
                  ? `Muuuack! Received and sent back 💋`
                  : `Muuuack! Recebido e devolvido 💋`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
      if (onInteract) onInteract(secondaryIncrement);
    }, 2500);
  };

  const handleShare = () => {
    addFloatingHearts();
    setShowGpsPanel((prev) => !prev);
    setState((prev) => ({
      ...prev,
      lastInteractionType: 'share',
      lastInteractionTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  };

  const [chatSender, setChatSender] = useState<'me' | 'partner'>('me');

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperInput.trim()) return;

    if (!state.partnerName) {
      showTempAlert(
        lang === 'es'
          ? 'Comienza vinculando a tu pareja para interactuar.'
          : 'Start by linking your partner to interact.'
      );
      return;
    }

    const userMsg = whisperInput.trim();
    setWhisperInput('');

    // Frialdad calculation metrics based on response text dryness
    const textLength = userMsg.length;
    const lowerText = userMsg.toLowerCase();
    const sweetWords = [
      'amor',
      'te amo',
      'lindo',
      'bella',
      'hermoso',
      'extraño',
      'quiero',
      'beso',
      'abrazos',
      'carta',
      'regalo',
      'bebe',
      'cariño',
      'corazón',
    ];
    const isSweet = sweetWords.some((word) => lowerText.includes(word));

    if (textLength <= 5) {
      // Extremely dry replies
      setFrialdad(85);
    } else if (isSweet || textLength >= 22) {
      // Very warm sweet words or detailed sentences
      setFrialdad(5);
    } else {
      // Average variability
      setFrialdad(Math.max(10, Math.floor(Math.random() * 25) + 20));
    }

    const newMessage = {
      id: String(Date.now()),
      sender: chatSender,
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const incrementWhisper = 0.5;
    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage],
      warmth: Math.min(100, Number(((prev.warmth || 50) + incrementWhisper).toFixed(1))),
    }));
    if (onInteract) onInteract(incrementWhisper);
    addFloatingHearts();
  };

  const handleCompleteBreakup = (downloadMemories: boolean) => {
    if (downloadMemories) {
      const lettersCount = (state.letters || []).length;
      const giftsCount = (state.gifts || []).length;
      const memoriesCount = (state.memories || []).length;

      const dataString = `
============================================================
💔 ÁLBUM Y RECUERDOS CON ${state.partnerName.toUpperCase()} 💔
============================================================
Generado de forma automática el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

Nuestra hermosa e imborrable historia resumida en este archivo de despedida.

✨ ESTADÍSTICAS DEL AMOR:
------------------------------------------------------------
• Me: ${state.meName || 'Tú'}
• Pareja: ${state.partnerName}
• Nivel de Calidez alcanzado: ${state.warmth}%
• Racha de Conexión: ${state.streak} días
• Puntos de Juegos: Yo (${state.mePoints || 0} pts) | ${state.partnerName} (${state.partnerPoints || 0} pts)
• Total de Cartas: ${lettersCount}
• Total de Regalos: ${giftsCount}
• Total de Fotos del Álbum: ${memoriesCount}

============================================================
💌 CARTAS DE NUESTRO BUZÓN:
============================================================
${
  (state.letters || []).length === 0
    ? 'No se enviaron cartas en la relación.'
    : (state.letters || [])
        .map(
          (l, i) => `
[Carta #${i + 1}]
De: ${l.sender === 'me' ? state.meName || 'Yo' : state.partnerName}
Fecha: ${l.timestamp}
Título: ${l.title}
Contenido:
${l.content}
------------------------------------------------------------`
        )
        .join('\n')
}

============================================================
🎁 REGALOS INTERCAMBIADOS:
============================================================
${
  (state.gifts || []).length === 0
    ? 'No se enviaron regalos en la relación.'
    : (state.gifts || [])
        .map(
          (g, i) => `
[Regalo #${i + 1}]
De: ${g.sender === 'me' ? state.meName || 'Yo' : state.partnerName}
Regalo: ${g.title}
Caja elegida: Sabor ${g.boxStyle}
Detalles adicionales: ${g.desc || 'Sin explicación'}
Fecha: ${g.timestamp}
Estatus final: ${g.unwrapped ? 'Abierto con felicidad' : 'Sin abrir'}
------------------------------------------------------------`
        )
        .join('\n')
}

============================================================
📸 RECUERDOS Y FOTOS DE NUESTRO ÁLBUM:
============================================================
${
  (state.memories || []).length === 0
    ? 'No se registraron fotos ni recuerdos generados.'
    : (state.memories || [])
        .map(
          (m, i) => `
[Foto #${i + 1}]: ${m.titleDefault}
Tipo de Foto: ${m.isUpload ? 'Selfie Real/Foto normal' : 'Foto del álbum'}
Estilo artístico: ${m.style}
Fecha del Recuerdo: ${m.date}
Enlace de la Foto: ${m.image}
${m.desc ? `Comentarios: "${m.desc}"` : ''}
------------------------------------------------------------`
        )
        .join('\n')
}

============================================================
💬 ÚLTIMOS MENSAJES DE NUESTRO CHAT PRIVADO:
============================================================
${
  (state.chatMessages || []).length === 0
    ? 'Chat vacío.'
    : (state.chatMessages || [])
        .map(
          (msg) => `
[${msg.timestamp}] ${msg.sender === 'me' ? state.meName || 'Yo' : state.partnerName}: ${msg.text}`
        )
        .join('\n')
}

============================================================
¡Fin del archivo de recuerdos! Que siempre recuerdes lo lindo de lo vivido. ❤️
============================================================
`;

      const blob = new Blob([dataString], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `album y recuerdos con ${state.partnerName}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    if (currentUserEmail) {
      fetch('/api/couple/breakup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail }),
      })
        .then((res) => res.json())
        .then(() => {
          setState((prev) => ({
            ...prev,
            coupleId: undefined,
            partnerName: '',
            partnerAvatar: '',
            partnerBirthday: '',
            partnerLat: undefined,
            partnerLng: undefined,
            partnerGpsConsent: undefined,
            warmth: 0,
            streak: 0,
            songPlaying: false,
            chatMessages: [],
            letters: [],
            gifts: [],
            mePoints: 0,
            partnerPoints: 0,
            linkedSpotifyUrl: '',
            commonItems: [],
            memories: [],
          }));
          localStorage.removeItem('couple_app_state_' + currentUserEmail);
          localStorage.removeItem('couple_app_state_');
          localStorage.removeItem('common_items');
          localStorage.removeItem('linkedSpotifyUrl');
          showTempAlert(
            lang === 'es'
              ? 'Relación desvinculada con éxito 💔'
              : 'Relationship disconnected successfully 💔'
          );
        })
        .catch((err) => {
          console.error('Failed to post breakup to server');
          showTempAlert(
            lang === 'es'
              ? 'Desvinculación forzada localmente 💔'
              : 'Disconnection forced locally 💔'
          );
          setState((prev) => ({
            ...prev,
            coupleId: undefined,
            partnerName: '',
            partnerAvatar: '',
            partnerBirthday: '',
            partnerLat: undefined,
            partnerLng: undefined,
            partnerGpsConsent: undefined,
            warmth: 0,
            streak: 0,
            songPlaying: false,
            chatMessages: [],
            letters: [],
            gifts: [],
            mePoints: 0,
            partnerPoints: 0,
            linkedSpotifyUrl: '',
            commonItems: [],
            memories: [],
          }));
          localStorage.removeItem('couple_app_state_' + currentUserEmail);
          localStorage.removeItem('couple_app_state_');
        });
    } else {
      setState((prev) => ({
        ...prev,
        coupleId: undefined,
        partnerName: '',
        partnerAvatar: '',
        partnerBirthday: '',
        partnerLat: undefined,
        partnerLng: undefined,
        partnerGpsConsent: undefined,
        warmth: 0,
        streak: 0,
        songPlaying: false,
        chatMessages: [],
        letters: [],
        gifts: [],
        mePoints: 0,
        partnerPoints: 0,
        linkedSpotifyUrl: '',
        commonItems: [],
        memories: [],
      }));
      localStorage.removeItem('couple_app_state_');
      showTempAlert(
        lang === 'es'
          ? 'Relación desvinculada con éxito 💔'
          : 'Relationship disconnected successfully 💔'
      );
    }

    setShowBreakUpModal(false);
  };

  const toggleSong = () => {
    setState((prev) => ({
      ...prev,
      songPlaying: !prev.songPlaying,
    }));
  };

  // Safe SVG circle progress calculation
  const radius = 45;
  const strokeDasharray = String(2 * Math.PI * radius);
  const strokeDashoffset = String(
    Number(strokeDasharray) - (state.warmth / 100) * Number(strokeDasharray)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* GLOBAL HIGH-PRIORITY PERMISSIONS ASSISTANT DIALOG OVERLAY */}
      {currentUserEmail && !state.meGpsConsent && !dismissGpsIntro && (
        <PermissionsAssistantModal
          lang={lang}
          onGrant={handleRequestAllPermissions}
          onSimulate={handleSimulatePermissions}
          onSkip={() => {
            setDismissGpsIntro(true);
            showTempAlert(
              lang === 'es'
                ? "Presiona 'Compartir Lugar' más tarde para autorizar"
                : "Tap 'Share Location' later to set permissions"
            );
          }}
        />
      )}

      {/* Top App Bar */}
      <TopAppBar
        state={state}
        lang={lang}
        setLang={setLang}
        setEditingProfileTarget={setEditingProfileTarget}
        setProfileNameInput={setProfileNameInput}
        setProfileAvatarInput={setProfileAvatarInput}
        addFloatingHearts={addFloatingHearts}
        handleStartCall={handleStartCall}
      />

      {/* Temp alerts popup */}
      {whisperAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[450px] bg-slate-900/95 text-white py-3 px-5 rounded-2xl shadow-2xl border border-[#ff4d6d] text-center text-xs font-semibold transition-all animate-bounce">
          {whisperAlert}
        </div>
      )}

      {/* Main Connection Row */}
      <ConnectionPanel
        state={state}
        setState={setState}
        t={t}
        lang={lang}
        currentUserEmail={currentUserEmail}
        setCurrentUserEmail={setCurrentUserEmail}
        startGoogleLogin={startGoogleLogin}
        addFloatingHearts={addFloatingHearts}
        showTempAlert={showTempAlert}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        setShowGoogleModal={setShowGoogleModal}
        setShowBreakUpModal={setShowBreakUpModal}
        setEditingProfileTarget={setEditingProfileTarget}
        setProfileNameInput={setProfileNameInput}
        setProfileAvatarInput={setProfileAvatarInput}
        pairingOpen={pairingOpen}
        setPairingOpen={setPairingOpen}
        pairingCode={pairingCode}
        partnerSearchCode={partnerSearchCode}
        setPartnerSearchCode={setPartnerSearchCode}
        isLinking={isLinking}
        setIsLinking={setIsLinking}
        partnerLinkError={partnerLinkError}
        setPartnerLinkError={setPartnerLinkError}
        partnerLinkSuccess={partnerLinkSuccess}
        setPartnerLinkSuccess={setPartnerLinkSuccess}
        linkCopiedAlert={linkCopiedAlert}
        setLinkCopiedAlert={setLinkCopiedAlert}
      />

      {/* Dynamic celebrations card / love calendar anniversaries segment */}
      <section className="mt-1">
        <CelebrationsCard
          state={state}
          setState={setState}
          t={t}
          lang={lang}
          addFloatingHearts={addFloatingHearts}
          currentUserEmail={currentUserEmail}
        />
      </section>

      {/* Quick interaction control panel */}
      <section className="grid grid-cols-3 gap-3">
        <button
          onClick={handleNudge}
          className="flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 shadow-sm hover:border-[#ff4d6d]/40 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-11 h-11 bg-white/5 group-hover:bg-white/10 font-bold rounded-full flex items-center justify-center text-[#ff4d6d] text-xl font-sans mb-1.5 transition-colors">
            👋
          </div>
          <span className="text-xs font-bold text-slate-200">{t('nudgeBtn')}</span>
        </button>

        <button
          onClick={handleKiss}
          className="flex flex-col items-center justify-center p-4 bg-[#ff4d6d]/10 backdrop-blur-xs rounded-2xl border border-[#ff4d6d]/20 shadow-lg hover:border-[#ff4d6d]/50 hover:bg-[#ff4d6d]/20 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-11 h-11 bg-[#ff4d6d]/25 rounded-full flex items-center justify-center mb-1.5 tracking-wide shadow-md border border-[#ff4d6d]/20 group-hover:scale-110 transition-all animate-heartbeat">
            💋
          </div>
          <span className="text-xs font-extrabold text-[#ff4d6d]">{t('kissBtn')}</span>
        </button>

        <button
          onClick={handleShare}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border active:scale-95 transition-all text-center group cursor-pointer ${showGpsPanel ? 'bg-[#ff4d6d]/20 border-[#ff4d6d] shadow-lg' : 'bg-white/5 border-white/10 shadow-sm hover:border-[#ff4d6d]/40 hover:bg-white/10'}`}
        >
          <div className="w-11 h-11 bg-white/5 group-hover:bg-white/10 rounded-full flex items-center justify-center text-[#ff4d6d] text-xl font-sans mb-1.5 transition-colors">
            📍
          </div>
          <span className="text-xs font-bold text-slate-250">{t('shareBtn')}</span>
        </button>
      </section>

      {/* Interactive GPS Panel with passcode */}
      {showGpsPanel && (
        <GpsPanel
          state={state}
          setState={setState}
          t={t}
          lang={lang}
          currentUserEmail={currentUserEmail}
          addFloatingHearts={addFloatingHearts}
          showTempAlert={showTempAlert}
          gpsPasscode={gpsPasscode}
          gpsLocked={gpsLocked}
          setGpsLocked={setGpsLocked}
          passcodeInput={passcodeInput}
          setPasscodeInput={setPasscodeInput}
          userLat={userLat}
          userLng={userLng}
          setUserLat={setUserLat}
          setUserLng={setUserLng}
          partnerLat={partnerLat}
          partnerLng={partnerLng}
          setPartnerLat={setPartnerLat}
          setPartnerLng={setPartnerLng}
          mapViewMode={mapViewMode}
          setMapViewMode={setMapViewMode}
          isSatelliteView={isSatelliteView}
          setIsSatelliteView={setIsSatelliteView}
          googleMapsZoom={googleMapsZoom}
          setGoogleMapsZoom={setGoogleMapsZoom}
          gpsSearchVal={gpsSearchVal}
          setGpsSearchVal={setGpsSearchVal}
          gpsCustomSpot={gpsCustomSpot}
          setGpsCustomSpot={setGpsCustomSpot}
          gpsTravelMode={gpsTravelMode}
          setGpsTravelMode={setGpsTravelMode}
          gpsRealtimeMovement={gpsRealtimeMovement}
          setGpsRealtimeMovement={setGpsRealtimeMovement}
          myGeoQuery={myGeoQuery}
          setMyGeoQuery={setMyGeoQuery}
          partnerGeoQuery={partnerGeoQuery}
          setPartnerGeoQuery={setPartnerGeoQuery}
          geoSearching={geoSearching}
          searchAddress={searchAddress}
          locationRequesting={locationRequesting}
          triggerLocationRequest={triggerLocationRequest}
          setShowGpsPanel={setShowGpsPanel}
        />
      )}

      {/* Daily Memory Widget */}
      <DailyMemoryWidget state={state} t={t} />

      {/* 💌 BUZÓN DE AMOR: CARTAS Y REGALOS */}
      <LoveMailbox
        state={state}
        setState={setState}
        t={t}
        lang={lang}
        currentUserEmail={currentUserEmail}
        addFloatingHearts={addFloatingHearts}
        showTempAlert={showTempAlert}
        onInteract={onInteract}
      />

      {/* Things in Common Board / Cosas en Común */}
      <CommonVibes
        state={state}
        setState={setState}
        t={t}
        lang={lang}
        currentUserEmail={currentUserEmail}
        addFloatingHearts={addFloatingHearts}
        showTempAlert={showTempAlert}
      />

      {/* Bento Tiles: Song & Chat */}
      <BentoSongChat
        state={state}
        t={t}
        lang={lang}
        linkedSpotifyUrl={linkedSpotifyUrl}
        handleDisconnectSpotify={handleDisconnectSpotify}
        toggleSong={toggleSong}
        handleLinkSpotify={handleLinkSpotify}
        spotifyInput={spotifyInput}
        setSpotifyInput={setSpotifyInput}
        setActiveTab={setActiveTab}
        setAmourPhoneOpen={setAmourPhoneOpen}
        addFloatingHearts={addFloatingHearts}
      />

      {/* 1. EDIT PROFILE DIALOG MODAL (ANIMAL PRESETS, CHARACTERS & CUSTOM URLS) */}
      {editingProfileTarget && (
        <EditProfileModal
          editingProfileTarget={editingProfileTarget}
          profileNameInput={profileNameInput}
          setProfileNameInput={setProfileNameInput}
          profileAvatarInput={profileAvatarInput}
          setProfileAvatarInput={setProfileAvatarInput}
          lang={lang}
          currentUserEmail={currentUserEmail}
          setState={setState}
          onInteract={onInteract}
          addFloatingHearts={addFloatingHearts}
          showTempAlert={showTempAlert}
          setEditingProfileTarget={setEditingProfileTarget}
        />
      )}

      {/* 2. GOOGLE LOGIN OVERLAY DIALOG */}
      {showGoogleModal && (
        <GoogleLoginModal
          startGoogleLogin={startGoogleLogin}
          showTempAlert={showTempAlert}
          setShowGoogleModal={setShowGoogleModal}
        />
      )}

      {/* 3. BREAK UP CONFIRMATION DIALOG MODAL */}
      {showBreakUpModal && (
        <BreakupModal
          state={state}
          lang={lang}
          handleCompleteBreakup={handleCompleteBreakup}
          setShowBreakUpModal={setShowBreakUpModal}
          showTempAlert={showTempAlert}
        />
      )}

      {/* Full screen realistic telephone mock AmourPhone chat overlay */}
      {amourPhoneOpen && (
        <AmourPhone
          state={state}
          setState={setState}
          t={t}
          lang={lang}
          addFloatingHearts={addFloatingHearts}
          currentUserEmail={currentUserEmail}
          onClose={() => setAmourPhoneOpen(false)}
        />
      )}
    </div>
  );
}

