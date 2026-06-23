import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, CoupleState } from '../types';
import { uploadMedia, uploadDataUrl } from '../storage';
import {
  ChevronLeft,
  CheckCheck,
  Camera,
  Flame,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Send,
  Mic,
} from 'lucide-react';

interface AmourPhoneProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: string;
  addFloatingHearts: () => void;
  currentUserEmail: string | null;
  onClose?: () => void;
  isTabMode?: boolean;
  onInteract?: (inc: number) => void;
}

const THEMES = [
  {
    id: 'rose',
    name: 'Pastel Rose 🌸',
    bg: 'bg-[#1e1316] text-[#ffeef0]',
    style: 'bg-gradient-to-b from-[#ff4d6d]/20 to-[#c9184a]/10',
    accent: '#ff4d6d',
    bubbleMe: 'bg-[#ff4d6d] text-white',
    bubblePartner: 'bg-white/10 text-slate-100',
    pattern: '🌸',
  },
  {
    id: 'amethyst',
    name: 'Ametista Neon 🔮',
    bg: 'bg-[#150f1d] text-[#f7f4fa]',
    style: 'bg-gradient-to-b from-purple-950/30 to-violet-900/10',
    accent: '#8b5cf6',
    bubbleMe: 'bg-purple-600 text-white',
    bubblePartner: 'bg-white/10 text-slate-200',
    pattern: '✨',
  },
  {
    id: 'twilight',
    name: 'Crepúsculo Celestial 🌌',
    bg: 'bg-[#0b0c16] text-[#eef6ff]',
    style: 'bg-gradient-to-b from-blue-950/40 to-indigo-950/20',
    accent: '#3b82f6',
    bubbleMe: 'bg-blue-600 text-white',
    bubblePartner: 'bg-white/10 text-slate-200',
    pattern: '🌌',
  },
  {
    id: 'vintage',
    name: 'Lofi Retro ☕',
    bg: 'bg-[#1a1412] text-[#fbf7f4]',
    style: 'bg-gradient-to-b from-amber-950/30 to-orange-950/10',
    accent: '#f59e0b',
    bubbleMe: 'bg-amber-600 text-white',
    bubblePartner: 'bg-white/10 text-slate-200',
    pattern: '☕',
  },
  {
    id: 'cyber',
    name: 'Cyber Amor ⚡',
    bg: 'bg-[#090b0e] text-[#e0ffe2]',
    style: 'bg-gradient-to-b from-teal-950/40 to-[#ff4d6d]/10',
    accent: '#10b981',
    bubbleMe: 'bg-teal-500 text-black font-extrabold',
    bubblePartner: 'bg-white/10 text-slate-300',
    pattern: '⚡',
  },
];

const QUICK_EMOJIS = ['❤️', '😘', '😍', '💕', '💋', '🥞', '🍿', '🛸', '🦖', '🍫'];

export default function AmourPhone({
  state,
  setState,
  t,
  lang,
  addFloatingHearts,
  currentUserEmail,
  onClose,
  isTabMode = false,
  onInteract,
}: AmourPhoneProps) {
  const [inputText, setInputText] = useState('');
  const [currentThemeId, setCurrentThemeId] = useState(state.chatTheme || 'rose');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [photoInputB64, setPhotoInputB64] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [mediaActivePlayId, setMediaActivePlayId] = useState<string | null>(null);
  const [audioPlayTime, setAudioPlayTime] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const voiceTickRef = useRef<number | null>(null);

  const selectedTheme = THEMES.find((th) => th.id === currentThemeId) || THEMES[0];

  useEffect(() => {
    // Sync current local theme to state theme
    if (state.chatTheme && state.chatTheme !== currentThemeId) {
      setCurrentThemeId(state.chatTheme);
    }
  }, [state.chatTheme]);

  // Scroll to bottom on updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  // Audio timer ticker
  useEffect(() => {
    if (isRecording) {
      voiceTickRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTime(0);
    }

    return () => {
      if (voiceTickRef.current !== null) {
        clearInterval(voiceTickRef.current);
        voiceTickRef.current = null;
      }
    };
  }, [isRecording]);

  // Change wallpaper theme and sync
  const handleThemeChange = async (themeId: string) => {
    setCurrentThemeId(themeId);
    if (state.coupleId) {
      try {
        await fetch('/api/couple/update-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: state.coupleId,
            chatTheme: themeId,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setState((prev) => ({ ...prev, chatTheme: themeId }));
    addFloatingHearts();
  };

  // Convert uploaded image file to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoInputB64(reader.result as string);
      addFloatingHearts();
    };
    reader.readAsDataURL(file);
  };

  // Helper to emit message to Express
  const postChatMessage = async (payload: {
    text: string;
    isAudio?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    isPhoto?: boolean;
    photoUrl?: string;
    emoji?: string;
  }) => {
    if (!currentUserEmail || !state.coupleId) return;

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: state.coupleId,
          senderEmail: currentUserEmail,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Optimistic append mapper
        const newMsg: ChatMessage = {
          id: data.message.id,
          sender: 'me',
          text: data.message.text,
          timestamp: data.message.timestamp,
          isAudio: data.message.isAudio,
          audioUrl: data.message.audioUrl,
          audioDuration: data.message.audioDuration,
          isPhoto: data.message.isPhoto,
          photoUrl: data.message.photoUrl,
          emoji: data.message.emoji,
          seen: data.message.seen,
        };

        const textIncrement = 0.5;
        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, newMsg],
          warmth: Math.min(100, Number((prev.warmth + textIncrement).toFixed(1))),
        }));
        if (onInteract) onInteract(textIncrement);
      }
    } catch (err) {
      console.error('Failed to post message:');
    }
  };

  // Trigger send text
  const handleSendText = () => {
    if (!inputText.trim()) return;
    postChatMessage({ text: inputText.trim() });
    setInputText('');
    for (let i = 0; i < 2; i++) setTimeout(addFloatingHearts, i * 150);
  };

  // Trigger send reactive emoji tag
  const handleSendEmoji = (emo: string) => {
    postChatMessage({ text: emo, emoji: emo });
    for (let i = 0; i < 4; i++) setTimeout(addFloatingHearts, i * 120);
  };

  // Trigger send attachment photo (uploads to Storage, sends only the URL)
  const handleSendPhoto = async () => {
    if (!photoInputB64) return;
    const pending = photoInputB64;
    setPhotoInputB64(null);
    const photoUrl = await uploadDataUrl(pending, 'chat-photos');
    postChatMessage({
      text: lang === 'es' ? '📷 Foto integrada' : '📷 Photo attached',
      isPhoto: true,
      photoUrl,
    });
  };

  // Delete chat message
  const handleDeleteMessage = async (messageId: string) => {
    if (!state.coupleId) return;
    try {
      const res = await fetch('/api/chat/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: state.coupleId,
          messageId: messageId,
        }),
      });
      if (res.ok) {
        setState((prev) => ({
          ...prev,
          chatMessages: prev.chatMessages.filter((m) => m.id !== messageId),
        }));
        addFloatingHearts();
      }
    } catch (err) {
      console.error('Error deleting chat message:');
    }
  };

  // Audio mock voice-note recorder (since HTML recording behaves differently in sandbo
  // we do actual audio or highly satisfying voice synth simulation!)
  const handleStartVoiceRecord = async () => {
    setIsRecording(true);
    addFloatingHearts();
    // Try browser media recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorderStreamRef.current = stream;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (recorderStreamRef.current) {
          recorderStreamRef.current.getTracks().forEach((track) => track.stop());
          recorderStreamRef.current = null;
        }
        uploadMedia(audioBlob, 'chat-audio')
          .then((audioUrl) => {
            postChatMessage({
              text: lang === 'es' ? '🎤 Nota de voz' : '🎤 Voice note',
              isAudio: true,
              audioUrl,
              audioDuration: Math.max(2, recordTime),
            });
          })
          .catch(() => {
            const reader = new FileReader();
            reader.onloadend = () => {
              postChatMessage({
                text: lang === 'es' ? '🎤 Nota de voz' : '🎤 Voice note',
                isAudio: true,
                audioUrl: reader.result as string,
                audioDuration: Math.max(2, recordTime),
              });
            };
            reader.readAsDataURL(audioBlob);
          });
      };
      recorder.start();
    } catch (e) {
      setIsRecording(false);
      console.warn(
        'Media recording blocked or not supported on this context. Falling back to cute simulated note.',
        e
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    recorderRef.current = null;
    if (recorderStreamRef.current) {
      recorderStreamRef.current.getTracks().forEach((track) => track.stop());
      recorderStreamRef.current = null;
    }
  };

  const handleDiscardRecording = () => {
    setIsRecording(false);
    stopRecording();
  };

  const handleStopVoiceRecord = () => {
    setIsRecording(false);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      stopRecording();
    } else {
      postChatMessage({
        text:
          lang === 'es'
            ? '🎤 Nota de voz simulada con Amor'
            : '🎤 Simulated voice note with Love',
        isAudio: true,
        audioUrl: 'simulated_sound_loop',
        audioDuration: Math.max(3, recordTime > 0 ? recordTime : 5),
      });
    }
    addFloatingHearts();
  };

  useEffect(() => {
    return () => {
      if (voiceTickRef.current !== null) {
        clearInterval(voiceTickRef.current);
        voiceTickRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (recorderStreamRef.current) {
        recorderStreamRef.current.getTracks().forEach((track) => track.stop());
        recorderStreamRef.current = null;
      }
    };
  }, []);

  // Playback handler for voice memos
  const handleToggleAudioPlayback = (msgId: string, urlStr?: string, duration: number = 5) => {
    if (mediaActivePlayId === msgId) {
      setMediaActivePlayId(null);
      setAudioPlayTime(0);
      return;
    }

    setMediaActivePlayId(msgId);
    setAudioPlayTime(0);

    // Dynamic wave simulation progression
    let sec = 0;
    const ticker = setInterval(() => {
      sec++;
      setAudioPlayTime(sec);
      if (sec >= duration) {
        clearInterval(ticker);
        setMediaActivePlayId(null);
        setAudioPlayTime(0);
      }
    }, 1000);

    // Audio tag reproduction
    if (urlStr && urlStr !== 'simulated_sound_loop') {
      try {
        const audio = new Audio(urlStr);
        audio.play().catch((e) => console.log('Autoplay restriction: ', e));
      } catch (ex) {
        /* no-op */
      }
    }
  };

  if (isTabMode) {
    return (
      <div className="w-full h-[760px] bg-[#0c0c0e]/95 rounded-3xl relative overflow-hidden flex flex-col md:flex-row select-none">
        {/* Wallpaper background layer */}
        <div className={`absolute inset-0 z-0 ${selectedTheme.bg} opacity-90 pointer-events-none`}>
          <div className={`absolute inset-0 ${selectedTheme.style} mix-blend-overlay`} />
        </div>

        {/* ================= LEFT BENTO SIDEBAR (Partner Connection & Theme Customize) ================= */}
        <aside className="w-full md:w-80 bg-black/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/5 p-5 z-10 flex flex-col justify-between shrink-0 text-left">
          <div className="space-y-6">
            {/* 1. Couple Portrait & Warmth */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 fill-rose-500 animate-pulse" />
                <span>
                  {state.streak || 0} {lang === 'es' ? 'Días' : 'Days'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 mt-2 shrink-0">
                <div className="relative">
                  <img
                    src={
                      state.meAvatar ||
                      'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80'
                    }
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/40"
                    alt={lang === 'es' ? 'Yo' : 'Me'}
                  />
                  <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[8px] font-black text-white px-1.5 py-0.25 rounded-full uppercase leading-none">
                    {lang === 'es' ? 'Tú' : 'You'}
                  </span>
                </div>

                <span className="text-xl animate-pulse">💝</span>

                <div className="relative">
                  <img
                    src={
                      state.partnerAvatar ||
                      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80'
                    }
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#ff4d6d]/40"
                    alt="Partner"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-pink-600 text-[8px] font-black text-white px-1.5 py-0.25 rounded-full uppercase leading-none">
                    {lang === 'es' ? 'Amor' : 'Love'}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <h4 className="text-xs font-black text-white truncate">
                  {state.meName || (lang === 'es' ? 'Yo' : 'Me')} {lang === 'es' ? 'y' : '&'}{' '}
                  {state.partnerName || (lang === 'es' ? 'Mi Amor' : 'My Love')}
                </h4>
                <div className="flex justify-between items-center text-[9px] text-zinc-400">
                  <span>{lang === 'es' ? 'Sintonía de Amor' : 'Love Sync'}</span>
                  <span className="font-mono text-rose-450 font-bold">{state.warmth || 0}%</span>
                </div>
                {/* Warmth Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-[#ff4d6d] rounded-full"
                    style={{ width: `${state.warmth || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Interactive Theme Wheel Customizer */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'es' ? 'Tema del Chat Compartido' : 'Shared Chat Theme'}
              </span>
              <p className="text-[9.5px] text-zinc-400 leading-normal">
                {lang === 'es'
                  ? 'Cambia el fondo y los globos de forma instantánea para ambos en tiempo real.'
                  : 'Change the wallpaper and bubbles instantly for both of you in real time.'}
              </p>

              <div className="grid grid-cols-1 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      currentThemeId === th.id
                        ? 'bg-white/10 border-white/20 text-white shadow-md'
                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: th.accent }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate leading-none">{th.name}</p>
                    </div>
                    <span className="text-[11px] opacity-70">{th.pattern}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick instructions / Info indicator */}
          <div className="pt-4 border-t border-white/5 text-left space-y-1 mt-4 md:mt-0">
            <span className="text-[8px] font-mono uppercase text-zinc-550 tracking-wider block">
              {lang === 'es' ? 'Canal Directo' : 'Direct Channel'}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-450 text-[10px] uppercase font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
              <span>{lang === 'es' ? 'AmourPhone Conectado' : 'AmourPhone Connected'}</span>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN AREA (Conversation Chronology & Long Letter Pad) ================= */}
        <section className="flex-1 flex flex-col relative z-20 h-full">
          {/* Main Top Header Bar */}
          <header className="bg-black/40 backdrop-blur-md border-b border-white/5 py-4 px-6 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={
                  state.partnerAvatar ||
                  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80'
                }
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#ff4d6d]/40"
                alt="Partner"
              />
              <div className="text-left space-y-0.5">
                <h4 className="text-sm font-black text-white tracking-wide">
                  {state.partnerName || (lang === 'es' ? 'Mi Amor' : 'My Love')}
                </h4>
                <p className="text-[10px] text-emerald-450 font-bold flex items-center gap-1.5 leading-none uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  ● {lang === 'es' ? 'En Línea' : 'Online'}
                </p>
              </div>
            </div>

            {/* Close / Return home action */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                {lang === 'es' ? 'Volver al Menú 🏠' : 'Back to Menu 🏠'}
              </button>
            )}
          </header>

          {/* CHAT CHRONICLE MESSAGES LOG AREA */}
          <section className="flex-1 overflow-y-auto px-6 py-4 space-y-3 flex flex-col custom-scrollbar bg-black/20">
            {!state.coupleId ? (
              <div className="my-auto flex flex-col items-center text-center space-y-4 p-8 select-none max-w-[420px] mx-auto bg-stone-900/90 border border-[#ff4d6d]/20 rounded-3xl shrink-0">
                <span className="text-5xl animate-bounce inline-block">🔒💝</span>
                <h3 className="font-sans font-black text-rose-450 text-sm uppercase tracking-wider">
                  {lang === 'es' ? 'AmourPhone Desconectado' : 'AmourPhone Disconnected'}
                </h3>
                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                  {lang === 'es'
                    ? 'Para poder mensajearte, enviar fotos o notas de voz en tiempo real con tu amor, debes vincular tu cuenta. Genera un enlace de invitación en el menú principal y envíaselo a tu pareja, o introduce su código PIN para uniros de forma instantánea.'
                    : 'To message photos or voice notes in real time with your love, you must link your account. Generate an invite link in the main menu and send it to your partner, or enter their PIN code to connect instantly.'}
                </p>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <p className="text-[10px] text-amber-300 font-bold">
                    {lang === 'es'
                      ? '⚠️ Asegúrate de que ambos ingresaron su correo en "Vincular con Google" en el menú principal antes de emparejar.'
                      : '⚠️ Make sure you both entered your email under "Link with Google" in the main menu before pairing.'}
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-[#ff4d6d] text-white hover:bg-[#ff4d6d]/90 font-bold text-xs rounded-xl transition-all cursor-pointer border-none shadow-md"
                  >
                    {lang === 'es'
                      ? 'Ir a Vincular en Pantalla Principal 🔗'
                      : 'Go to Linking on the Main Screen 🔗'}
                  </button>
                </div>
              </div>
            ) : state.chatMessages.length === 0 ? (
              <div className="my-auto flex flex-col items-center text-center space-y-4 p-8 select-none max-w-[340px] mx-auto bg-black/40 rounded-3xl border border-white/5">
                <span className="text-5xl animate-bounce inline-block bg-transparent border-none">
                  📲❤️
                </span>
                <h3 className="font-serif font-black text-white text-sm">
                  {lang === 'es' ? 'Tu espacio privado de amor' : 'Your private love space'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {lang === 'es'
                    ? '¡Sincronizado! Tu canal de comunicación de amor dedicado está activo. Envía emojis expresivos, fotos de tus paseos y notas de voz íntimas en tiempo real.'
                    : 'Synced successfully! Your custom romance channel is active. Try audio notes, photobooks, and expressive stickers.'}
                </p>
              </div>
            ) : (
              state.chatMessages.map((msg) => {
                const isSystem = msg.sender === 'system';
                const isMe = msg.sender === 'me';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="w-full flex justify-center py-2 animate-fadeIn">
                      <div className="bg-purple-950/40 border border-purple-500/20 text-purple-200 text-[10px] font-extrabold px-4 py-2 rounded-full max-w-[80%] text-center">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                const isBigEmoji = msg.emoji && msg.text === msg.emoji;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[65%] p-0.5 animate-fadeIn ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}`}
                  >
                    <div
                      className={`px-4 py-3 rounded-[20px] text-[13px] leading-relaxed transition-all ${
                        isBigEmoji
                          ? 'bg-transparent text-5xl shadow-none py-1 px-1'
                          : isMe
                            ? `${selectedTheme.bubbleMe} rounded-br-xs shadow-md shadow-black/20`
                            : `${selectedTheme.bubblePartner} rounded-bl-xs shadow-md shadow-black/20`
                      }`}
                    >
                      {/* Photo rendition */}
                      {msg.isPhoto && msg.photoUrl ? (
                        <div className="space-y-2">
                          <img
                            src={msg.photoUrl}
                            className="rounded-xl max-h-[220px] object-cover border border-white/10 hover:opacity-90 transition-opacity cursor-zoom-in"
                            onClick={() => setZoomedPhoto(msg.photoUrl || null)}
                            alt="Attachment"
                          />
                          <p className="text-[11px] break-all opacity-95">{msg.text}</p>
                        </div>
                      ) : msg.isAudio ? (
                        /* Wave Audio element widget */
                        <div className="flex items-center gap-3 min-w-[180px] py-1 select-none">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleAudioPlayback(msg.id, msg.audioUrl, msg.audioDuration)
                            }
                            aria-label={
                              lang === 'es' ? 'Reproducir nota de voz' : 'Play voice note'
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all border-none ${
                              isMe
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-[#ff4d6d]/20 hover:bg-[#ff4d6d]/30 text-[#ff4d6d]'
                            }`}
                          >
                            {mediaActivePlayId === msg.id ? (
                              <Pause className="w-3.5 h-3.5 fill-current animate-fadeIn" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.25 text-rose-50" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-end gap-0.5 h-5">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => {
                                const isPlaying = mediaActivePlayId === msg.id;
                                const barPct = bar / 12;
                                const playPct = isPlaying
                                  ? audioPlayTime / (msg.audioDuration || 5)
                                  : 0;
                                const isActive = isPlaying && barPct <= playPct;
                                const rHeight = isPlaying
                                  ? [14, 20, 8, 16, 12, 18, 10, 14, 20, 12, 16, 8][bar % 12]
                                  : [5, 7, 5, 9, 7, 5, 7, 5, 9, 5, 7, 5][bar % 12];

                                return (
                                  <div
                                    key={bar}
                                    className="w-[2.5px] rounded-full transition-all duration-300"
                                    style={{
                                      height: `${rHeight}px`,
                                      backgroundColor: isActive
                                        ? '#ffffff'
                                        : isMe
                                          ? 'rgba(255,255,255,0.45)'
                                          : 'rgba(255,77,109,0.5)',
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[8px] font-mono tracking-tighter mt-1 opacity-75">
                              {mediaActivePlayId === msg.id
                                ? `${audioPlayTime}s / ${msg.audioDuration || 4}s`
                                : `${lang === 'es' ? 'Nota de voz' : 'Voice memo'} • ${msg.audioDuration || '4'}s`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Plain text messages formatting */
                        <p className="break-words font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                      )}
                    </div>

                    {/* Metadata & read marks row */}
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-500 font-mono">
                      <span>{msg.timestamp}</span>
                      {isMe && !isBigEmoji && (
                        <CheckCheck
                          className={`w-3.5 h-3.5 transition-colors ${
                            msg.seen ? 'text-pink-400 font-extrabold stroke-[2]' : 'text-zinc-650'
                          }`}
                        />
                      )}
                      {msg.isPhoto && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="ml-2 bg-transparent text-zinc-550 hover:text-red-400 border-none cursor-pointer flex items-center gap-0.5 transition-colors"
                          title={lang === 'es' ? 'Borrar foto enviada' : 'Delete sent photo'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'es' ? 'Borrar' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </section>

          {/* ATTACHMENT PHOTO PANEL */}
          {photoInputB64 && (
            <div className="bg-black/90 p-4 border-t border-white/5 flex gap-4 items-center z-10">
              <img
                src={photoInputB64}
                className="w-18 h-18 rounded-xl object-cover border border-white/10"
                alt="Upload preview"
              />
              <div className="flex-1 text-left">
                <span className="text-[11px] font-extrabold text-[#ff4d6d] uppercase block">
                  {lang === 'es' ? 'Vista previa de Foto Seleccionada' : 'Selected Photo Preview'}
                </span>
                <p className="text-[9px] text-zinc-400 font-medium font-bold">
                  {lang === 'es'
                    ? '¿Enviar esta foto para compartir un momento especial en tiempo real?'
                    : 'Send this photo to share a special moment in real time?'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setPhotoInputB64(null)}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold border-none cursor-pointer transition-colors"
                >
                  {lang === 'es' ? 'Descartar' : 'Discard'}
                </button>
                <button
                  onClick={handleSendPhoto}
                  className="px-4.5 py-2 bg-[#ff4d6d] text-white rounded-xl text-[10px] font-black border-none cursor-pointer shadow-lg hover:bg-[#ff4d6d]/90 transition-colors"
                >
                  {lang === 'es' ? 'Enviar Foto 📷' : 'Send Photo 📷'}
                </button>
              </div>
            </div>
          )}

          {/* TELEPHONE KEYBOARD FOOTER ACTION SHEETS */}
          <footer className="bg-black/75 border-t border-white/5 p-4 space-y-4 shrink-0 text-left">
            {/* Quick emoji palette launcher */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-zinc-550 font-black uppercase tracking-widest">
                {lang === 'es' ? 'Reacciones rápidas:' : 'Quick reactions:'}
              </span>
              <div className="flex gap-4 overflow-x-auto py-0.5 scrollbar-none">
                {QUICK_EMOJIS.map((mo) => (
                  <button
                    key={mo}
                    onClick={() => handleSendEmoji(mo)}
                    className="text-lg hover:scale-135 transition-all filter drop-shadow cursor-pointer border-none bg-transparent"
                  >
                    {mo}
                  </button>
                ))}
              </div>
            </div>

            {/* Input keyboard layouts bar */}
            <div className="flex items-center gap-3">
              {/* Photo uploader clicker button */}
              <label
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-slate-350 hover:text-[#ff4d6d] flex items-center justify-center transition-all cursor-pointer border border-[#121216] shrink-0 animate-duration-150"
                title="Subir foto desde tus archivos"
                aria-label={
                  lang === 'es' ? 'Subir foto desde tus archivos' : 'Upload photo from files'
                }
              >
                <Camera className="w-5 h-5 text-[#ff4d6d]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Dynamic Mic audio session */}
              {isRecording ? (
                <div className="flex-1 h-12 flex justify-between items-center bg-red-950/30 border border-red-500/25 px-4 py-1 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2 text-red-500 text-[11px] font-mono font-black uppercase">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
                    <span>
                      {lang === 'es' ? 'GRABANDO NOTA' : 'RECORDING NOTE'} • {recordTime}s
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDiscardRecording}
                      type="button"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] text-zinc-400 uppercase font-bold border-none cursor-pointer"
                    >
                      {lang === 'es' ? 'Descartar' : 'Discard'}
                    </button>
                    <button
                      onClick={handleStopVoiceRecord}
                      className="px-4 py-1.5 bg-[#ff4d6d] text-white rounded-lg text-[9px] font-black uppercase border-none cursor-pointer"
                    >
                      {lang === 'es' ? 'Enviar Audio 🎙️' : 'Send Audio 🎙️'}
                    </button>
                  </div>
                </div>
              ) : (
                /* SPACIOUS AUTOGROWING MULTILINE TEXTAREA AREA!! */
                <div className="flex-1 flex gap-2 items-end bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 focus-within:border-[#ff4d6d]/45 focus-within:bg-[#0c0c0e]/80 transition-all">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!state.coupleId}
                    placeholder={
                      !state.coupleId
                        ? lang === 'es'
                          ? '⚠️ Chat Desconectado - Debes vincularte primero...'
                          : '⚠️ Chat disconnected - You must link first...'
                        : lang === 'es'
                          ? 'Escribe un mensaje, un poema o carta para tu pareja de forma espaciosa...'
                          : 'Write a message, a poem or a letter for your partner with plenty of room...'
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && state.coupleId) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-550 border-none px-0 py-1.5 max-h-[140px] resize-none overflow-y-auto disabled:cursor-not-allowed"
                    style={{ minHeight: '38px' }}
                  />

                  {/* Mic attachment button */}
                  <button
                    type="button"
                    onClick={handleStartVoiceRecord}
                    disabled={!state.coupleId}
                    className="p-2 hover:bg-[#ff4d6d]/10 text-slate-400 hover:text-[#ff4d6d] rounded-xl transition-colors border-none bg-transparent cursor-pointer shrink-0 mb-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={lang === 'es' ? 'Grabar nota de voz' : 'Record voice note'}
                    aria-label={lang === 'es' ? 'Grabar nota de voz' : 'Record voice note'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Sending paper airplane button */}
              {!isRecording && (
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || !state.coupleId}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-[#1e1e24] shrink-0 ${
                    inputText.trim() && state.coupleId
                      ? 'bg-gradient-to-r from-[#ff4d6d] to-purple-600 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-purple-600/10 animate-duration-150'
                      : 'bg-zinc-800 text-zinc-650 cursor-not-allowed text-zinc-500'
                  }`}
                >
                  <Send className="w-4 h-4 fill-current text-white" />
                </button>
              )}
            </div>
          </footer>
        </section>

        {/* 🔮 Expanded Photo Zoom Frame Overlay */}
        {zoomedPhoto && (
          <div
            className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setZoomedPhoto(null)}
          >
            <div className="max-w-[800px] w-full flex flex-col space-y-4">
              <img
                src={zoomedPhoto}
                className="w-full max-h-[85vh] object-contain rounded-2xl border border-white/15"
                alt="Zoomed attachment"
              />
              <p className="text-[11px] text-zinc-400 font-mono text-center">
                {lang === 'es'
                  ? 'Haz clic en cualquier parte para volver al chat'
                  : 'Click anywhere to return to the chat'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      {/* 🚀 Smartphone Bezel Framework Mockup Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[400px] h-[92vh] sm:h-[820px] bg-stone-950 border-[8px] border-zinc-850 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        style={{ borderColor: '#27272a' }}
      >
        {/* Notch overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-950 rounded-b-2xl z-[150] flex items-center justify-center">
          {/* Speaker capsule slit */}
          <div className="w-10 h-1 bg-zinc-800 rounded-full" />
        </div>

        {/* Dynamic Status Bar */}
        <div className="absolute top-1 inset-x-0 h-6 px-7 flex justify-between items-center text-white text-[10px] font-mono z-[140] pointer-events-none">
          <span>12:35</span>
          <div className="flex gap-1 items-center bg-transparent">
            <span>5G</span>
            <span className="text-pink-500">♥</span>
            <div className="w-5 h-2.5 bg-zinc-700/80 rounded px-0.5 py-0.25 flex items-center">
              <div className="h-1.5 bg-[#ff4d6d] rounded-xs" style={{ width: '80%' }} />
            </div>
          </div>
        </div>

        {/* Wallpaper background layer */}
        <div className={`absolute inset-0 z-0 ${selectedTheme.bg} opacity-95 pointer-events-none`}>
          <div className={`absolute inset-0 ${selectedTheme.style} mix-blend-overlay`} />

          {/* Subtle floating patterns */}
          <div className="absolute inset-0 opacity-15 text-[60px] flex items-center justify-center select-none font-serif">
            {selectedTheme.pattern}
          </div>
        </div>

        {/* PHONE MAIN SCREEN CONTAINER */}
        <div className="flex-1 flex flex-col relative z-10 pt-10">
          {/* Phone Header block */}
          <header className="bg-black/60 backdrop-blur-md border-b border-white/5 py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border-none cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <img
                src={
                  state.partnerAvatar ||
                  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80'
                }
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#ff4d6d]/40"
                alt="Partner"
              />

              <div className="text-left space-y-0.5">
                <h4 className="text-xs font-black text-white leading-none">
                  AmourPhone - {state.partnerName || (lang === 'es' ? 'Mi Amor' : 'My Love')}
                </h4>
                <p className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 leading-none uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                  ● {lang === 'es' ? 'En Línea' : 'Online'}
                </p>
              </div>
            </div>

            {/* Quick mini-theme selector wheels */}
            <div className="flex gap-1">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => handleThemeChange(th.id)}
                  title={th.name}
                  className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer border hover:scale-125 shrink-0 ${
                    currentThemeId === th.id
                      ? 'scale-115 border-white ring-1 ring-white/40'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: th.accent }}
                />
              ))}
            </div>
          </header>

          {/* CHAT CHRONICLE MESSAGES LOG AREA */}
          <section className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 flex flex-col custom-scrollbar">
            {!state.coupleId ? (
              <div className="my-auto flex flex-col items-center text-center space-y-3 p-5 select-none max-w-[290px] mx-auto bg-stone-900/90 border border-[#ff4d6d]/20 rounded-2xl shrink-0">
                <span className="text-4xl animate-bounce">🔒💝</span>
                <h3 className="font-sans font-black text-rose-450 text-xs uppercase tracking-wider">
                  {lang === 'es' ? 'Chat Desconectado' : 'Chat Disconnected'}
                </h3>
                <p className="text-[10px] text-zinc-300 leading-normal">
                  {lang === 'es'
                    ? 'Sincronízate con tu amor usando un código PIN o enlace de pareja en la pantalla previa para poder mensajearte en tiempo real.'
                    : 'Sync with your love using a PIN code or partner link on the previous screen to message in real time.'}
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-1.5 bg-[#ff4d6d] text-white hover:bg-[#ff4d6d]/90 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer border-none"
                >
                  {lang === 'es' ? 'Ir a Vincular 🔗' : 'Go to Linking 🔗'}
                </button>
              </div>
            ) : state.chatMessages.length === 0 ? (
              <div className="my-auto flex flex-col items-center text-center space-y-3.5 p-6 select-none max-w-[240px] mx-auto">
                <span className="text-4xl animate-pulse inline-block">📲❤️</span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {lang === 'es'
                    ? '¡Sincronizado! Tu teléfono de amor personalizado está activo. Envía emojis, fotos, y audios.'
                    : 'Synced successfully! Your custom romance hotline is active. Try audio, photos, and expressive stickers.'}
                </p>
              </div>
            ) : (
              state.chatMessages.map((msg) => {
                const isSystem = msg.sender === 'system';
                const isMe = msg.sender === 'me';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="w-full flex justify-center py-1.5 animate-fadeIn">
                      <div className="bg-purple-950/40 border border-purple-500/20 text-purple-200 text-[9px] font-bold px-3 py-1.5 rounded-full max-w-[85%] text-center">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                const isBigEmoji = msg.emoji && msg.text === msg.emoji;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] p-0.5 animate-fadeIn ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}`}
                  >
                    <div
                      className={`px-3 py-2.5 rounded-[18px] text-[12px] leading-tight-elegant transition-all ${
                        isBigEmoji
                          ? 'bg-transparent text-4xl shadow-none py-1 px-1'
                          : isMe
                            ? `${selectedTheme.bubbleMe} rounded-br-xs shadow-md shadow-black/15`
                            : `${selectedTheme.bubblePartner} rounded-bl-xs shadow-md shadow-black/15`
                      }`}
                    >
                      {/* Photo rendition */}
                      {msg.isPhoto && msg.photoUrl ? (
                        <div className="space-y-1.5">
                          <img
                            src={msg.photoUrl}
                            className="rounded-xl max-h-[140px] object-cover border border-white/10 hover:opacity-90 transition-opacity cursor-zoom-in"
                            onClick={() => setZoomedPhoto(msg.photoUrl || null)}
                            alt="Attachment"
                          />
                          <p className="text-[10px] break-all">{msg.text}</p>
                        </div>
                      ) : msg.isAudio ? (
                        /* Wave Audio element widget */
                        <div className="flex items-center gap-2 min-w-[150px] py-1 select-none">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleAudioPlayback(msg.id, msg.audioUrl, msg.audioDuration)
                            }
                            aria-label={
                              lang === 'es' ? 'Reproducir nota de voz' : 'Play voice note'
                            }
                            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all border-none ${
                              isMe
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-[#ff4d6d]/20 hover:bg-[#ff4d6d]/30 text-[#ff4d6d]'
                            }`}
                          >
                            {mediaActivePlayId === msg.id ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.25" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-end gap-0.5 h-4.5">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                                const isPlaying = mediaActivePlayId === msg.id;
                                const barPct = bar / 10;
                                const playPct = isPlaying
                                  ? audioPlayTime / (msg.audioDuration || 5)
                                  : 0;
                                const isActive = isPlaying && barPct <= playPct;
                                const rHeight = isPlaying
                                  ? [12, 18, 6, 14, 10, 16, 8, 12, 18, 10][bar % 10]
                                  : [4, 6, 4, 8, 6, 4, 6, 4, 8, 4][bar % 10];

                                return (
                                  <div
                                    key={bar}
                                    className="w-[2px] rounded-full transition-all duration-300"
                                    style={{
                                      height: `${rHeight}px`,
                                      backgroundColor: isActive
                                        ? '#ffffff'
                                        : isMe
                                          ? 'rgba(255,255,255,0.45)'
                                          : 'rgba(255,77,109,0.5)',
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[7.5px] font-mono tracking-tighter mt-1 opacity-75">
                              {mediaActivePlayId === msg.id
                                ? `${audioPlayTime}s / ${msg.audioDuration || 4}s`
                                : `${lang === 'es' ? 'Nota de voz' : 'Voice memo'} • ${msg.audioDuration || '4'}s`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Plain text messages formatting */
                        <p className="break-words font-medium leading-relaxed">{msg.text}</p>
                      )}
                    </div>

                    {/* Metadata & read marks row */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] text-zinc-500 font-mono">
                      <span>{msg.timestamp}</span>
                      {isMe && !isBigEmoji && (
                        <CheckCheck
                          className={`w-3.5 h-3.5 transition-colors ${
                            msg.seen ? 'text-pink-400 font-extrabold stroke-[2]' : 'text-zinc-650'
                          }`}
                        />
                      )}
                      {msg.isPhoto && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="ml-1.5 bg-transparent text-zinc-550 hover:text-red-400 border-none cursor-pointer flex items-center gap-0.5 transition-colors"
                          title={lang === 'es' ? 'Borrar foto' : 'Delete photo'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === 'es' ? 'Borrar' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </section>

          {/* ATTACHMENT PHOTO PANEL */}
          {photoInputB64 && (
            <div className="bg-black/90 p-3.5 border-t border-white/5 flex gap-3 items-center animate-slideUp">
              <img
                src={photoInputB64}
                className="w-16 h-16 rounded-xl object-cover border border-white/10"
                alt="Upload preview"
              />
              <div className="flex-1 text-left">
                <span className="text-[10px] font-extrabold text-[#ff4d6d] uppercase block">
                  {lang === 'es' ? 'Vista previa de Foto' : 'Photo Preview'}
                </span>
                <p className="text-[8px] text-zinc-400">
                  {lang === 'es'
                    ? '¿Enviar este retrato o sticker al álbum de recuerdos privado del chat?'
                    : "Send this portrait or sticker to the chat's private memory album?"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => setPhotoInputB64(null)}
                  className="px-2 py-1 bg-white/5 text-slate-300 rounded text-[9px] font-bold border-none cursor-pointer"
                >
                  {lang === 'es' ? 'Descartar' : 'Discard'}
                </button>
                <button
                  onClick={handleSendPhoto}
                  className="px-3 py-1 bg-[#ff4d6d] text-white rounded text-[9px] font-black border-none cursor-pointer shadow"
                >
                  {lang === 'es' ? 'Enviar 📷' : 'Send 📷'}
                </button>
              </div>
            </div>
          )}

          {/* TELEPHONE KEYBOARD FOOTER ACTION SHEETS */}
          <footer className="bg-black/85 border-t border-white/5 p-3.5 space-y-2.5">
            {/* Quick emoji palette launcher */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === 'es' ? 'Toques Rápidos' : 'Quick Express Emojis'}
              </span>
              <div className="flex gap-2.5 overflow-x-auto py-0.5 max-w-[80%] scrollbar-none">
                {QUICK_EMOJIS.map((mo) => (
                  <button
                    key={mo}
                    onClick={() => handleSendEmoji(mo)}
                    className="text-base hover:scale-130 transition-all filter drop-shadow cursor-pointer border-none bg-transparent"
                  >
                    {mo}
                  </button>
                ))}
              </div>
            </div>

            {/* Input keyboard layouts bar */}
            <div className="flex items-center gap-2">
              {/* Photo uploader clicker button */}
              <label
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-350 hover:text-[#ff4d6d] flex items-center justify-center transition-all cursor-pointer border border-white/5 shrink-0"
                title={lang === 'es' ? 'Enviar foto' : 'Upload photo'}
                aria-label={lang === 'es' ? 'Enviar foto' : 'Upload photo'}
              >
                <Camera className="w-4 h-4 text-[#ff4d6d]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Dynamic Mic audio session */}
              {isRecording ? (
                <div className="flex-1 flex justify-between items-center bg-red-950/30 border border-red-500/25 px-3 py-1 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-mono font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
                    <span>REC • {recordTime}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDiscardRecording}
                      type="button"
                      className="px-2 py-1 bg-white/5 rounded text-[8px] hover:bg-white/10 text-zinc-400 uppercase font-bold border-none cursor-pointer"
                    >
                      {lang === 'es' ? 'Descartar' : 'Discard'}
                    </button>
                    <button
                      onClick={handleStopVoiceRecord}
                      className="px-2.5 py-1 bg-[#ff4d6d] text-white rounded text-[8px] font-black uppercase border-none cursor-pointer"
                    >
                      {lang === 'es' ? 'Enviar 🎙️' : 'Send 🎙️'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex gap-1.5 items-center bg-white/5 border border-white/10 rounded-2xl px-2.5 py-1 focus-within:border-[#ff4d6d]/40">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!state.coupleId}
                    placeholder={
                      !state.coupleId
                        ? lang === 'es'
                          ? '⚠️ Chat Desconectado...'
                          : '⚠️ Chat disconnected...'
                        : lang === 'es'
                          ? 'Escribe tu carta de amor...'
                          : 'Write private romance whispers...'
                    }
                    onKeyDown={(e) => e.key === 'Enter' && state.coupleId && handleSendText()}
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-550 border-none px-0 py-1 disabled:cursor-not-allowed"
                  />

                  {/* Mic attachment button */}
                  <button
                    onClick={handleStartVoiceRecord}
                    disabled={!state.coupleId}
                    className="p-1 hover:bg-[#ff4d6d]/10 text-slate-400 hover:text-[#ff4d6d] rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={lang === 'es' ? 'Enviar nota de voz' : 'Send voice note'}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Sending paper airplane button */}
              {!isRecording && (
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || !state.coupleId}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-none shadow-md shrink-0 ${
                    inputText.trim() && state.coupleId
                      ? 'bg-gradient-to-r from-[#ff4d6d] to-purple-600 text-white cursor-pointer hover:scale-105'
                      : 'bg-zinc-800 text-zinc-550 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* 🔮 Expanded Photo Zoom Frame Overlay */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="max-w-[480px] w-full flex flex-col space-y-4">
            <img
              src={zoomedPhoto}
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10"
              alt="Zoomed attachment"
            />
            <p className="text-[10px] text-zinc-400 font-mono text-center">
              {lang === 'es'
                ? 'Toque cualquier lado para regresar al AmourPhone'
                : 'Tap anywhere to return to AmourPhone'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
