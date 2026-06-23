import React, { useState, useEffect, useMemo } from 'react';
import { CoupleState, DateIdea, SharedMemory, LanguageCode } from '../types';
import { uploadDataUrl } from '../storage';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Video,
  Volume2,
  Plus,
  X,
  Heart,
  Trash2,
} from 'lucide-react';

interface MagicSectionProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  addFloatingHearts: () => void;
  onInteract?: (inc: number) => void;
}

export default function MagicSection({
  state,
  setState,
  t,
  lang,
  addFloatingHearts,
  onInteract
}: MagicSectionProps) {
  const dateIdeas: DateIdea[] = useMemo(
    () => [
      {
        id: 'museum',
        titleKey: 'virtualMuseum',
        titleDefault: 'Virtual Museum Date',
        icon: '🏛️',
        descKey: 'museumDesc',
        descDefault: 'Explore interactive 3D galleries hand in hand',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMUsbcTGZX7uouIcvbzBCzm9JAAAV-OWhZBYJJWuqARBNtjn-y8dxTkoHwXtZya6N-v3vxpqCR5DGoLe3wwGhiqJpApk8W3e__ePz0y3wqMwQWPkWUlUgy7ZzSqR-TB5QXJ72grrljjdnvgbL0kYBblnSAmFneFFLmfoGVUwZkqgP13x3x68FhIM5y0H3XQlpffxuxGhUhoyEGVOaXUsjayXqmcvkkQwhU7uGDmGgXAf68s9mcFbM43jW69Ohjhrrck07KpThNwhIh',
        titleEs: 'Cita en Museo Virtual 🏛️',
        titleEn: 'Virtual Museum Tour 🏛️',
        descEs: 'Exploren galerías 3D interactivas de todo el mundo tomados de la mano.',
        descEn: 'Explore beautiful interactive 3D galleries around the world hand in hand.',
      },
      {
        id: 'stars',
        titleKey: 'stargazing',
        titleDefault: 'Stargazing Night',
        icon: '🌌',
        descKey: 'stargazingDesc',
        descDefault: 'Sync location telescope feeds under the cosmic sky',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcVmx1KaMdkXsDuvY-sYOyhMvylEY6QfzHEgaGqsoUOMEtmJSwC1ifm96OFnMdUEIUnCrt4CshPQMu6Nqfz0YK6DFopMBOSB6RH-QlJoZtX1LN-nNhE0RvN3dYJa3rL5AvirTFeIAqmOJBKgYNUbNY2Oy1nyX2m6vIE5zCRWMmiE0546kBhkNU2A__9uTpz43v46BWHfWYcCuKZL3wvsmrCbtSkEcXc3Z9kMwn1x02_T6vRxQo6ubgEx-LONfDZD3pA5ueQlx6rpK6',
        titleEs: 'Noche bajo las estrellas 🌌',
        titleEn: 'Stargazing Picnic 🌌',
        descEs: 'Sincronicen mapas estelares de sus ubicaciones bajo el cielo cósmico.',
        descEn: 'Sync actual live star maps of your coordinates under the romantic cosmic sky.',
      },
      {
        id: 'dinner',
        titleKey: 'dinnerDate',
        titleDefault: 'Candlelight Dinner',
        icon: '🍝',
        descKey: 'dinnerDateDesc',
        descDefault: 'Cook the exact same recipe while exchanging stories on stream',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByA3lTWaRtJ1DmYSURksjPARp3IDN19cnE3BORIWtYgBT01CcUizEfQQhHxx-LMW02oITCuMONM76xOUjYm5TLaRr5xd7NyYTpPb_ZJ9y32ERRSucCTaF0tzHhQsYZAr5gGh0quR2GyQ4_N7eVj3-ahiwtl6pAh9t7vWe50XDH4tb-nDFtpodAVdmP5SJtDs9gSjQomEhGyZTzqJ02xczMpDHnFYChrIcAQm0pDC-aUz1zFKEugaGzcaSHDQui6Ko_PUG2qUSprGQ1',
        titleEs: 'Cena a la luz de las velas 🍝',
        titleEn: 'Candlelight Cooking 🍝',
        descEs: 'Cocinen exactamente la misma receta mientras comparten anécdotas en vivo.',
        descEn:
          'Cook the exact same recipe step-by-step while sharing candlelit stories on stream.',
      },
      {
        id: 'arcade',
        titleKey: 'retroArcade',
        titleDefault: 'Retro Arcade Contest',
        icon: '👾',
        descKey: 'retroArcadeDesc',
        descDefault: 'Face off in quick mini-games to see who gets to choose the next movie',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Torneo Retro Arcade 👾',
        titleEn: 'Retro Arcade Contest 👾',
        descEs:
          'Duelo épico en minijuegos online para decidir quién elige la siguiente película de maratón.',
        descEn:
          'Face off in sweet retro browser mini-games to see who gets to pick the next movie cozy night.',
      },
      {
        id: 'painting',
        titleKey: 'lofiArtSession',
        titleDefault: 'Lofi Canvas Session',
        icon: '🎨',
        descKey: 'lofiArtSessionDesc',
        descDefault: 'Put on a shared playlist and paint the same landscape, then reveal',
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Lienzos & Ritmos Lofi 🎨',
        titleEn: 'Lofi & Canvas Lounge 🎨',
        descEs:
          'Sintonicen una playlist lofi relajante, pinten un mismo paisaje y revelen su obra maestra.',
        descEn:
          'Put on a matching ambient lofi canvas, paint your shared memories, and do a cute screen reveal.',
      },
      {
        id: 'snack_swap',
        titleKey: 'gourmetSnackSwap',
        titleDefault: 'Snack Review Showdown',
        icon: '🍿',
        descKey: 'snackSwapDesc',
        descDefault: 'Send each other mysterious convenience store snacks & unbox them live',
        image: 'https://images.unsplash.com/photo-1599490659213-e2b9c642e374?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Duelo de Snacks Misteriosos 🍿',
        titleEn: 'Mystery Snack Tasting 🍿',
        descEs:
          'Envíense por correo golosinas locas de tiendas locales y califíquenlas como chefs gourmet.',
        descEn:
          'Mail each other a small box of local exotic snacks, then unbox and review them like absolute chefs.',
      },
      {
        id: 'fort_build',
        titleKey: 'blanketFortCozy',
        titleDefault: 'Cozy Fort Fortress',
        icon: '🏕️',
        descKey: 'blanketFortDesc',
        descDefault: 'Build the ultimate pillow fort in your bedroom and stream from inside',
        image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Fuerte de Almohadas 🏕️',
        titleEn: 'Blanket Fort Fortress 🏕️',
        descEs:
          'Construyan una tienda de mantas en sus habitaciones y hagan videollamada desde el refugio.',
        descEn:
          'Build the ultimate blanket-and-pillow fort in your room, turn on ambient lights, and stream inside.',
      },
      {
        id: 'gps_hunt',
        titleKey: 'treasureHuntGps',
        titleDefault: 'City GPS Treasure Hunt',
        icon: '🗺️',
        descKey: 'gpsHuntDesc',
        descDefault: 'Leave hints in local shops for each other to discover at the same time',
        image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Búsqueda del Tesoro GPS 🗺️',
        titleEn: 'GPS Adventure Hunt 🗺️',
        descEs:
          'Dejen pistas secretas en cafeterías de su ciudad para que su pareja las descubra en su recorrido.',
        descEn:
          'Hide cute notes or claim orders in local coffee shops for your partner to scan and claim.',
      },
      {
        id: 'soundtrack_walk',
        titleKey: 'soundtrackWalk',
        titleDefault: 'Soundtrack Synchronized Walk',
        icon: '🎧',
        descKey: 'soundtrackWalkDesc',
        descDefault: 'Walk together apart while playing the exact same custom playlist',
        image: 'https://images.unsplash.com/photo-1484755560695-a4c740285a15?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Paseo con Banda Sonora 🎧',
        titleEn: 'Soundtrack Synced Walk 🎧',
        descEs:
          'Caminen por sus vecindarios escuchando la misma lista de Spotify sincronizada al mismo tiempo.',
        descEn:
          'Walk under the same sky in your respective towns while playing your synchronized couple soundtrack.',
      },
      {
        id: 'book_club',
        titleKey: 'loveBookClub',
        titleDefault: 'Private Couples Book Club',
        icon: '📖',
        descKey: 'bookClubDesc',
        descDefault: 'Read the same romantic short story and debate over cozy mugs of cocoa',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
        titleEs: 'Club de Lectura Íntimo 📖',
        titleEn: 'Whisper Book Club 📖',
        descEs:
          'Lean un cuento corto o poema romántico y debátanlo acompañados de tazas calientes.',
        descEn:
          'Read a sweet short story or classic poem together and critique it over morning hot tea.',
      },
    ],
    []
  );

  const initialMemories: SharedMemory[] = useMemo(
    () => [
      {
        id: 'mem1',
        titleKey: 'summerDream',
        titleDefault: 'Summer Dream Picnic',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNvc5FjcYnDAy3RWsiyBVAZEP9IbUH18ncH3ypWtOuuTIqT04hZ9QBhN70vPbXkHlNYGVnmutDGqAEUs81z1NHetzVG4Aq639g8fK7CfxYMhWdm0Hz64K2C5Vcaspn0CTnAieZIEDbbTwgu7cKNkyQRFVqbReRpZcfcZPCZCujbvyBbMFjQGN8WOYV4qFUVSzfwoDd21sW4rnS40HHDW14AdBjSuOH8DvoxkWk18Mjfb52PIdt98PJGBfBPxsY-XCjyNEICPhhtmq5',
        style: 'Paris Vacation',
        date: 'Aug 14, 2025',
      },
      {
        id: 'mem2',
        titleKey: 'artNightOut',
        titleDefault: 'Art Night Out',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJI6UxUrDgCAbKrvzuSG4Zj35q3msekx6sHfPIJXLJEx2KZCo9OQ7SOm5gO4CQ7fqRz80wOgs-qstbjGo0BZAu17ftBmnQPNhlX03AG8X7RX_1HkSbb45b9uUth5deaAI4oQKLOa0Lcj34l_DRW1lSqPxWuLKwAWnWKPTI6oLil5QelUn6cZX1fCOHICHqxX0Poc14k3dcx0hMdKlAUPM1noEcRRgDnyKGf_7bZJYRs3hyoFAfOIvxumPbA2mm-F8lNVplCr-ylhO7',
        style: 'Watercolor art',
        date: 'Sep 29, 2025',
      },
    ],
    []
  );

  const memories = state.memories || [];
  const setMemories = (
    newMemories: SharedMemory[] | ((prev: SharedMemory[]) => SharedMemory[])
  ) => {
    setState((prev) => {
      const nextMemories =
        typeof newMemories === 'function' ? newMemories(prev.memories || []) : newMemories;
      if (prev.coupleId) {
        fetch('/api/couple/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: prev.coupleId,
            memories: nextMemories,
          }),
        }).catch((err) => console.error('Error persisting memories:'));
      }
      return {
        ...prev,
        memories: nextMemories,
      };
    });
  };
  const [upcomingTitle, setUpcomingTitle] = useState('Movie Night Friday');
  const [upcomingTime, setUpcomingTime] = useState('8:30 PM');
  const [upcomingDesc, setUpcomingDesc] = useState('Living Room TV');
  const [callConnected, setCallConnected] = useState(false);
  const [dateAlert, setDateAlert] = useState<string | null>(null);
  const [showAllDateIdeas, setShowAllDateIdeas] = useState(false);

  // Love Album state variables
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<SharedMemory | null>(
    null
  );
  const [photoLikes, setPhotoLikes] = useState<Record<string, number>>({
    mem1: 8,
    mem2: 12,
    mem_selfie1: 15,
    mem_selfie2: 21,
  });
  const [customPhotoTitle, setCustomPhotoTitle] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [customPhotoDesc, setCustomPhotoDesc] = useState('');
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  // Local heart burst shown INSIDE the lightbox modal (the global floating hearts
  // render behind the modal backdrop, so they aren't visible while it's open).
  const [loveHearts, setLoveHearts] = useState<{ id: number; left: number; delay: number }[]>([]);

  const spawnLoveBurst = () => {
    const burst = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      left: 15 + Math.random() * 70,
      delay: i * 80,
    }));
    setLoveHearts((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setLoveHearts((prev) => prev.filter((h) => !burst.some((b) => b.id === h.id)));
    }, 1700);
  };

  const scheduleDate = (idea: DateIdea) => {
    addFloatingHearts();
    setUpcomingTitle(t(idea.titleKey));
    setUpcomingTime('9:00 PM');
    setUpcomingDesc(t('livingRoomTV'));

    const scheduledMsg = t('dateScheduled').replace('{title}', t(idea.titleKey));
    setDateAlert(scheduledMsg);

    const scheduleDateInc = 1.5;
    setState((prev) => ({
      ...prev,
      warmth: Math.min(100, Number((prev.warmth + scheduleDateInc).toFixed(1))),
    }));
    if (onInteract) onInteract(scheduleDateInc);

    setTimeout(() => {
      setDateAlert(null);
    }, 4000);
  };

  const triggerCallSimulation = () => {
    setCallConnected(true);
    for (let i = 0; i < 4; i++) {
      setTimeout(addFloatingHearts, i * 400);
    }
  };

  // Persist a new album memory. Uploads inline base64 photos to Storage first so
  // only a lightweight URL is stored in app state and the backend DB.
  const saveMemory = async (style: string, fallbackTitle: string) => {
    let image = customPhotoUrl;
    if (image.startsWith('data:')) {
      image = await uploadDataUrl(image, 'memories');
    }
    const newMem: SharedMemory = {
      id: 'mem_' + Date.now(),
      titleKey: '',
      titleDefault: customPhotoTitle || fallbackTitle,
      image,
      style,
      date: new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isUpload: true,
      desc:
        customPhotoDesc ||
        (lang === 'es'
          ? '¡Un lindo momento capturado e inmortalizado!'
          : 'A gorgeous instant in time we shared!'),
    };
    setMemories((prev) => [newMem, ...prev]);
    setCustomPhotoTitle('');
    setCustomPhotoUrl('');
    setCustomPhotoDesc('');
    setShowAddPhotoDialog(false);
    setDateAlert(
      lang === 'es' ? '¡Recuerdo añadido con éxito! 📸' : 'Memory saved beautifully! 📸'
    );
    setTimeout(() => setDateAlert(null), 3500);
    for (let j = 0; j < 5; j++) {
      setTimeout(addFloatingHearts, j * 120);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Alert Banner */}
      {dateAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[450px] bg-rose-950/95 text-white py-3 px-5 rounded-2xl shadow-xl border border-rose-400 text-center text-sm font-semibold transition-all">
          {dateAlert}
        </div>
      )}

      {/* 1. Header Intro */}
      <section className="text-center space-y-1">
        <h2 className="text-2xl font-black text-rose-950 tracking-tight">
          {lang === 'es' ? 'Álbum del Amor' : 'Love Album & Planner'}
        </h2>
        <p className="text-xs font-semibold text-rose-700/80">
          {lang === 'es'
            ? 'Vuestros momentos reales guardados para siempre'
            : 'Your special memories and real photos locked safely'}
        </p>
      </section>

      {/* On-Page Photo Upload Card */}
      <section className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4">
        <h3 className="font-sans text-sm font-black text-rose-950 flex items-center gap-1.5 px-0.5">
          <span>📸</span> {lang === 'es' ? 'Publicar un Nuevo Recuerdo' : 'Publish a New Memory'}
        </h3>

        {/* Step 1: File Uploader */}
        <div className="space-y-2">
          <label className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-rose-200 hover:border-[#ff4d6d]/60 rounded-2xl p-4 bg-rose-50/10 cursor-pointer hover:bg-rose-50/20 transition-all text-center relative overflow-hidden group">
            {customPhotoUrl ? (
              <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center">
                <img
                  src={customPhotoUrl}
                  alt="uploaded preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white text-[10px] font-black">
                  <span>{lang === 'es' ? 'Cambiar Imagen' : 'Change Image'}</span>
                  <span className="text-[8px] text-rose-350">
                    ({lang === 'es' ? 'Hacer Clic aquí' : 'Click here'})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-rose-450 mb-1.5 animate-pulse" />
                <span className="text-xs font-bold text-rose-900">
                  {lang === 'es' ? 'Sube una foto de ti o de ambos' : 'Upload memory photo'}
                </span>
                <span className="text-[9px] text-rose-600/70 mt-1 max-w-[220px] leading-tight font-medium">
                  {lang === 'es'
                    ? 'Toca para seleccionar un archivo local'
                    : 'Tap to select local graphic file'}
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    setCustomPhotoUrl(reader.result);
                    if (!customPhotoTitle) {
                      setCustomPhotoTitle(file.name.split('.')[0] || 'Un Recuerdo Especial');
                    }
                    addFloatingHearts();
                  }
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-black uppercase text-rose-800 tracking-wider mb-1">
              {lang === 'es' ? 'Título del Recuerdo' : 'Memory Title'}
            </label>
            <input
              type="text"
              placeholder={
                lang === 'es'
                  ? 'Ej: Tarde de café, Nuestro aniversario...'
                  : 'Coffee date, anniversary...'
              }
              value={customPhotoTitle}
              onChange={(e) => setCustomPhotoTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-rose-50/20 border border-rose-100 rounded-xl font-medium text-rose-950 focus:border-[#ff4d6d]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase text-rose-800 tracking-wider mb-1">
              {lang === 'es' ? 'Comentario o Detalle' : 'Detail or comment'}
            </label>
            <input
              type="text"
              placeholder={
                lang === 'es' ? 'Ej: Te amo miamor, inolvidable...' : 'Sensational day together...'
              }
              value={customPhotoDesc}
              onChange={(e) => setCustomPhotoDesc(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-rose-50/20 border border-rose-100 rounded-xl font-medium text-rose-950 focus:border-[#ff4d6d]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit action */}
        <button
          type="button"
          onClick={() => {
            if (!customPhotoUrl) {
              alert(
                lang === 'es'
                  ? 'Por favor sube una foto primero para poder guardarla'
                  : 'Please upload a photo first!'
              );
              return;
            }
            saveMemory(
              lang === 'es' ? 'Foto Real' : 'Real Photo',
              lang === 'es' ? 'Foto de Amor' : 'Lovely Memory'
            );
          }}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-none shadow-sm hover:shadow flex items-center justify-center gap-1.5"
        >
          <span>💖</span> {lang === 'es' ? 'Publicar en el Álbum' : 'Publish in Album'}
        </button>
      </section>

      {/* 5. Date Planner Dashboard */}
      <section className="bg-white/85 rounded-3xl p-4 border border-rose-100 shadow-sm space-y-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
              {t('comingUpNext')}
            </span>
            <h3 className="text-lg font-black text-rose-950 mt-0.5">{upcomingTitle}</h3>
          </div>
          <div className="bg-rose-50 p-2 rounded-2xl border border-rose-100">
            <Calendar className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-rose-800">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-rose-500" /> {upcomingTime}
          </span>
          <span className="flex items-center gap-1">
            <span>📍</span> {upcomingDesc}
          </span>
        </div>

        {/* Start Date triggers simulated responsive video stream date overlay */}
        <button
          onClick={triggerCallSimulation}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-serif text-sm font-bold rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <Video className="w-4 h-4 fill-white" />
          {t('startDateBtn')}
        </button>
      </section>

      {/* Video Call Simulation Portal */}
      {callConnected && (
        <div className="fixed inset-0 z-50 bg-rose-950 flex flex-col justify-between p-5 text-white animate-fade-in animate-duration-300">
          {/* Header */}
          <div className="flex justify-between items-center bg-black/30 backdrop-blur-md rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-rose-300 bg-black flex items-center justify-center">
                {state.partnerAvatar ? (
                  <img
                    src={state.partnerAvatar}
                    alt="Partner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black" />
                )}
              </div>
              <div>
                <p className="text-xs font-black">{state.partnerName}</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                  ● Connected LIVE
                </p>
              </div>
            </div>
            <p className="text-xs font-bold font-mono">02:14</p>
          </div>

          {/* Core Interactive Visual screen feeds */}
          <div className="flex-1 relative my-4 rounded-3xl overflow-hidden bg-rose-900 shadow-xl border border-rose-800/40 flex items-center justify-center">
            {state.partnerAvatar ? (
              <img
                src={state.partnerAvatar}
                className="w-full h-full object-cover filter brightness-95"
                alt="Partner video call feed"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-center p-4">
                <span className="text-2xl animate-pulse">📷</span>
                <p className="text-xs text-zinc-400 font-black mt-2 uppercase tracking-wide">
                  {state.partnerName || t('partner')}{' '}
                  {lang === 'es' ? 'no tiene foto' : 'has no photo'}
                </p>
                <p className="text-[9px] text-zinc-650">
                  {lang === 'es' ? 'Cámara remota activa' : 'Remote camera active'}
                </p>
              </div>
            )}

            {/* Self floating corner stream */}
            <div className="absolute bottom-3 right-3 w-28 aspect-[3/4] bg-rose-950 rounded-2xl overflow-hidden border-2 border-white shadow-xl flex items-center justify-center">
              {state.meAvatar ? (
                <img
                  src={state.meAvatar}
                  className="w-full h-full object-cover"
                  alt="Self video feed"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-sm font-mono text-zinc-500 font-bold">{t('me')}</span>
                  <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-tight">
                    {lang === 'es' ? 'Cámara ON' : 'Camera ON'}
                  </span>
                </div>
              )}
            </div>

            {/* Video overlay floating messages */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 max-w-[150px]">
              <p className="text-[10px] leading-tight font-medium">
                😘 &quot;Te extraño hermoso/a, feliz noche de cita&quot;
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-around items-center bg-black/40 backdrop-blur-md rounded-3xl py-3 px-6">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <Volume2 className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={() => setCallConnected(false)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wide tracking-wider cursor-pointer"
            >
              Hang Up 📞
            </button>

            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <span>🎤</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Date Ideas Catalog */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-sans text-sm font-black text-rose-950 flex items-center gap-1.5">
            <span>💡</span> {t('dateIdeasTitle')}
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowAllDateIdeas(!showAllDateIdeas);
              addFloatingHearts();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors uppercase tracking-wider"
          >
            {showAllDateIdeas ? (lang === 'es' ? 'Ver Menos 👆' : 'Show Less 👆') : t('viewAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(showAllDateIdeas ? dateIdeas : dateIdeas.slice(0, 3)).map((idea) => (
            <div
              key={idea.id}
              onClick={() => scheduleDate(idea)}
              className="p-3 bg-white/80 hover:bg-rose-50/50 rounded-2xl border border-rose-100 flex gap-3 shadow-xs active:scale-98 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src={idea.image}
                  alt={idea.titleDefault}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h4 className="text-xs font-black text-rose-950 truncate flex items-center gap-1.5">
                  <span>{idea.icon}</span> {t(idea.titleKey)}
                </h4>
                <p className="text-[10px] text-rose-700/85 mt-0.5 line-clamp-2">
                  {lang === 'es'
                    ? 'Presiona para activar y agendar como próxima cita'
                    : 'Click to activate and schedule as the upcoming date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Beautiful Interactive Love Album / Álbum del Amor */}
      <section className="space-y-4 pb-12 border-t border-rose-100/50 pt-6">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex justify-between items-center">
            <h3 className="font-sans text-base font-black text-rose-950 flex items-center gap-1.5 uppercase tracking-wide">
              <span>📸</span> {t('loveAlbumTitle')}
            </h3>
            <button
              onClick={() => {
                setShowAddPhotoDialog(true);
                addFloatingHearts();
              }}
              className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1.5 cursor-pointer transition-all uppercase shadow-xs whitespace-nowrap border-none"
            >
              <Plus className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('addCustomPhoto')}</span>
            </button>
          </div>
          <p className="text-[10px] text-rose-700/80 font-medium">
            {lang === 'es'
              ? 'Tu rincón privado para guardar fotos reales, polaroids y momentos hermosos de vuestra relación.'
              : 'Your private corner to store real photos, polaroids and beautiful moments of your relationship.'}
          </p>
        </div>

        {/* Memories Grid Layout */}
        {(() => {
          if (memories.length === 0) {
            return (
              <div className="bg-rose-50/30 border border-dashed border-rose-200 rounded-3xl p-6 text-center space-y-2">
                <p className="text-2xl">📸</p>
                <p className="text-[11px] text-rose-950 font-black">
                  {lang === 'es'
                    ? 'Aun no hay fotos en vuestro álbum'
                    : 'No photos in your album yet'}
                </p>
                <p className="text-[9px] text-rose-550 max-w-[200px] mx-auto">
                  {lang === 'es'
                    ? '¡Sube una foto usando el módulo de arriba o haz clic en el botón de añadir!'
                    : 'Upload your beautiful photos using the panel above or click Add Photo!'}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-2 gap-3">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  onClick={() => {
                    setSelectedPhotoForLightbox(mem);
                    addFloatingHearts();
                  }}
                  className="bg-white p-2 rounded-2xl shadow-xs border border-rose-100 flex flex-col hover:scale-[1.02] transition-transform group cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden shadow-inner relative">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={mem.image}
                      alt={mem.titleDefault}
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-rose-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 animate-pulse">
                      ❤️ {photoLikes[mem.id] || 0}
                    </span>
                  </div>
                  <div className="px-1 pt-2">
                    <h4 className="text-[11px] font-black text-rose-950 truncate">
                      {t(mem.titleKey) || mem.titleDefault}
                    </h4>
                    <div className="flex justify-between items-center text-[8px] text-rose-500/80 font-bold mt-1 uppercase tracking-tighter">
                      <span>{mem.style}</span>
                      <span>{mem.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* MODAL 1: LIGHTBOX AND PHOTO DETAILED REVIEW DIALOG */}
      {selectedPhotoForLightbox && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xs flex flex-col justify-center items-center p-4 animate-fade-in">
          {/* Main Polaroid Card Container */}
          <div className="bg-white p-3 pb-6 rounded-xs shadow-2xl max-w-[340px] w-full text-slate-900 border border-stone-200 transform rotate-[-1deg] relative">
            {/* Love burst hearts (visible above the photo when "Give Love" is tapped) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
              {loveHearts.map((h) => (
                <span
                  key={h.id}
                  className="absolute bottom-14 text-3xl animate-love-float"
                  style={{ left: `${h.left}%`, animationDelay: `${h.delay}ms` }}
                >
                  💖
                </span>
              ))}
            </div>

            {/* Close Button on Top Corner of Polaroid */}
            <button
              onClick={() => setSelectedPhotoForLightbox(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/10 hover:bg-black/20 text-slate-800 rounded-full cursor-pointer z-25 transition-colors border-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Polaroid Frame Picture */}
            <div className="aspect-square w-full rounded-xs overflow-hidden border border-stone-200 bg-stone-100 relative">
              <img
                src={selectedPhotoForLightbox.image}
                className="w-full h-full object-cover"
                alt="Selected memory"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-2 left-2 bg-rose-650 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-sm shadow-md">
                🤳 {lang === 'es' ? 'FOTO DE RECUERDO' : 'RECOLLECTION PHOTO'}
              </span>
            </div>

            {/* Captions / Story Block */}
            <div className="px-1 pt-4 text-center space-y-2">
              <span className="text-[8px] font-serif font-black tracking-widest text-slate-500 uppercase">
                {selectedPhotoForLightbox.style} • {selectedPhotoForLightbox.date}
              </span>
              <h4 className="text-sm font-serif font-black text-rose-950 tracking-tight leading-none">
                {t(selectedPhotoForLightbox.titleKey) || selectedPhotoForLightbox.titleDefault}
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-650 italic select-none py-1.5 px-2 bg-stone-50 rounded-lg border border-stone-100">
                {selectedPhotoForLightbox.desc ||
                  (lang === 'es'
                    ? 'Johan: Este momento se quedó guardado para siempre en nuestro corazón. ¡Qué lindo es estar a tu lado!'
                    : 'Johan: This moment will be saved in our hearts forever. How beautiful it is to be by your side!')}
              </p>
            </div>

            {/* Interactive Love Overlay Dashboard inside Polaroid spacer */}
            <div className="mt-4 flex gap-2 items-center justify-between border-t border-stone-100 pt-3 px-1 text-xs">
              <button
                onClick={() => {
                  setPhotoLikes((prev) => ({
                    ...prev,
                    [selectedPhotoForLightbox.id]: (prev[selectedPhotoForLightbox.id] || 0) + 1,
                  }));
                  spawnLoveBurst();
                  for (let index = 0; index < 4; index++) {
                    setTimeout(addFloatingHearts, index * 120);
                  }
                }}
                className="flex-1 py-2 bg-[#ff4d6d]/10 hover:bg-[#ff4d6d]/20 text-[#ff4d6d] font-black rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
              >
                <Heart className="w-3.5 h-3.5 fill-[#ff4d6d]" />
                {lang === 'es' ? 'Darle Amor' : 'Give Love'} (
                {photoLikes[selectedPhotoForLightbox.id] || 0})
              </button>

              <button
                onClick={() => {
                  setMemories((prev) => prev.filter((m) => m.id !== selectedPhotoForLightbox.id));
                  setSelectedPhotoForLightbox(null);
                  setDateAlert(
                    lang === 'es' ? 'Recuerdo removido con éxito' : 'Memory removed successfully'
                  );
                  setTimeout(() => setDateAlert(null), 3000);
                  addFloatingHearts();
                }}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-red-650 rounded-lg transition-colors cursor-pointer border-none animate-pulse"
                title="Delete memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL ADDPIC FORM POPUP */}
      {showAddPhotoDialog && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xs flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-5 w-full max-w-[340px] space-y-4 text-white relative">
            <button
              onClick={() => setShowAddPhotoDialog(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white border-none cursor-pointer bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <p className="text-[10px] font-black uppercase text-[#ff4d6d] tracking-widest leading-none">
                {lang === 'es' ? 'CÁMARA DEL AMOR' : 'LOVE CAMERA'}
              </p>
              <h3 className="text-base font-black text-white mt-1">
                {lang === 'es' ? 'Añadir Fotos al Álbum' : 'Upload Love Memory'}
              </h3>
            </div>

            {/* Step 1 (Primary): Direct Local File Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#ff4d6d] tracking-wider block">
                {lang === 'es'
                  ? '1. Selecciona o Arrastra tu Foto 📸'
                  : '1. Drag or Select Your Photo 📸'}
              </label>

              <div className="space-y-2">
                <label className="w-full h-28 flex flex-col items-center justify-center border-2 border-dashed border-[#ff4d6d]/30 hover:border-[#ff4d6d]/70 rounded-2xl p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-all text-center relative overflow-hidden group">
                  {customPhotoUrl ? (
                    <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center">
                      <img
                        src={customPhotoUrl}
                        alt="uploaded preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white text-[10px] font-black">
                        <span>{lang === 'es' ? 'Cambiar Imagen' : 'Change Image'}</span>
                        <span className="text-[8px] text-rose-400">
                          ({lang === 'es' ? 'Click aquí' : 'Click here'})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Camera className="w-8 h-8 text-[#ff4d6d] mb-1.5 animate-bounce" />
                      <span className="text-xs font-bold text-slate-200">
                        {lang === 'es' ? 'Sube una foto de tu galería' : 'Upload image from files'}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 max-w-[200px] leading-tight">
                        {lang === 'es'
                          ? 'Acepta archivos JPG, PNG y WEBP'
                          : 'Supports JPG, PNG, and WEBP'}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="album-file-input"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        alert(
                          lang === 'es'
                            ? 'Archivo muy grande (max 8MB)'
                            : 'File too large (max 8MB)'
                        );
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setCustomPhotoUrl(reader.result);
                          if (!customPhotoTitle) {
                            setCustomPhotoTitle(file.name.split('.')[0] || 'Un Recuerdo Especial');
                          }
                          addFloatingHearts();
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>

                {customPhotoUrl && (
                  <div className="flex justify-between items-center bg-rose-500/10 border border-[#ff4d6d]/20 py-1.5 px-3 rounded-xl text-[10px] text-rose-200">
                    <span className="font-semibold truncate max-w-[180px]">
                      ✨ {lang === 'es' ? 'Imagen cargada con éxito' : 'Image ready!'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomPhotoUrl('')}
                      className="text-[#ff4d6d] hover:text-red-400 transition-colors font-bold border-none bg-transparent cursor-pointer"
                    >
                      {lang === 'es' ? 'Quitar / Borrar' : 'Clear'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Title Card */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                {lang === 'es' ? 'Título del Recuerdo' : 'Memory Title'}
              </label>
              <input
                type="text"
                placeholder={
                  lang === 'es'
                    ? 'Ej: Nuestro aniversario, Tarde de café...'
                    : 'Our special evening...'
                }
                value={customPhotoTitle}
                onChange={(e) => setCustomPhotoTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#ff4d6d]/50"
              />
            </div>

            {/* Custom description input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                {lang === 'es' ? 'Comentario / Su Historia' : 'Comment / Behind this day'}
              </label>
              <textarea
                placeholder={
                  lang === 'es'
                    ? 'Escribe aquí lo inolvidable de este momento especial...'
                    : 'Write what made this day spectacular...'
                }
                value={customPhotoDesc}
                onChange={(e) => setCustomPhotoDesc(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#ff4d6d]/50 resize-none font-sans"
              />
            </div>

            {/* Secondary Option: Collapsible Presets or URL helper */}
            <details className="text-[10px] text-zinc-500 select-none group border-t border-white/5 pt-2">
              <summary className="cursor-pointer hover:text-slate-300 font-bold focus:outline-none flex justify-between items-center">
                <span>
                  🔗{' '}
                  {lang === 'es'
                    ? 'Opciones avanzadas (Presets o Pegar enlace)'
                    : 'Advanced options (Presets or Paste URL)'}
                </span>
                <span className="text-[8px] transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-2 space-y-3 pt-1 animate-fade-in text-white">
                {/* Copied Preset buttons */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'es' ? 'Presets rápidos' : 'Quick Presets'}
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl(
                          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&auto=format&fit=crop&q=60'
                        );
                        if (!customPhotoTitle)
                          setCustomPhotoTitle(
                            lang === 'es' ? 'Nuestra Cita Elegante 🥂' : 'Our Elegant Date 🥂'
                          );
                        addFloatingHearts();
                      }}
                      className={`p-1 bg-white/5 border text-[9px] rounded-lg transition-all text-center leading-tight truncate hover:border-[#ff4d6d]/50 ${customPhotoUrl.includes('511285560929') ? 'border-[#ff4d6d] bg-[#ff4d6d]/10' : 'border-white/5'}`}
                    >
                      🥂 Date Night
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl(
                          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60'
                        );
                        if (!customPhotoTitle)
                          setCustomPhotoTitle(
                            lang === 'es' ? '¡Concierto del Siglo! 🎸' : 'Live concert! 🎸'
                          );
                        addFloatingHearts();
                      }}
                      className={`p-1 bg-white/5 border text-[9px] rounded-lg transition-all text-center leading-tight truncate hover:border-[#ff4d6d]/50 ${customPhotoUrl.includes('492684223066') ? 'border-[#ff4d6d] bg-[#ff4d6d]/10' : 'border-white/5'}`}
                    >
                      🎸 Festival
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl(
                          'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=500&auto=format&fit=crop&q=60'
                        );
                        if (!customPhotoTitle)
                          setCustomPhotoTitle(
                            lang === 'es' ? 'Abrazados en el parque 🌸' : 'Park hugs 🌸'
                          );
                        addFloatingHearts();
                      }}
                      className={`p-1 bg-white/5 border text-[9px] rounded-lg transition-all text-center leading-tight truncate hover:border-[#ff4d6d]/50 ${customPhotoUrl.includes('543807535') ? 'border-[#ff4d6d] bg-[#ff4d6d]/10' : 'border-white/5'}`}
                    >
                      🌸 Summer Park
                    </button>
                  </div>
                </div>

                {/* Paste URL field */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'es' ? 'Pega el enlace de una foto' : 'Paste internet image URL'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    value={customPhotoUrl.startsWith('data:') ? '' : customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#ff4d6d]/50"
                  />
                </div>
              </div>
            </details>

            {/* Save memory button */}
            <button
              type="button"
              onClick={() => {
                if (!customPhotoUrl) {
                  alert(
                    lang === 'es'
                      ? 'Por favor selecciona un archivo o escoge un preset para tu foto'
                      : 'Please upload your file first!'
                  );
                  return;
                }
                saveMemory(
                  lang === 'es' ? 'Fotos Reales' : 'Real Photos',
                  lang === 'es' ? 'Recuerdo Lindo' : 'Sweet Memory'
                );
              }}
              className="w-full py-3 bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-none shadow-md"
            >
              🔒{' '}
              {lang === 'es' ? 'Asegurar en la Bóveda del Amor 💖' : 'Lock in our love folder 💖'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

