import React from 'react';
import { CoupleState, LanguageCode } from '../types';
import { Music, Heart } from 'lucide-react';

interface BentoSongChatProps {
  state: CoupleState;
  t: (key: string) => string;
  lang: LanguageCode;
  linkedSpotifyUrl: string | null;
  handleDisconnectSpotify: () => void;
  toggleSong: () => void;
  handleLinkSpotify: (e: React.FormEvent) => void;
  spotifyInput: string;
  setSpotifyInput: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab?: (tab: any) => void;
  setAmourPhoneOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addFloatingHearts: () => void;
}

/**
 * Bento grid with the couple's shared song (Spotify embed / player) tile
 * and the AmourPhone chat launcher tile.
 */
export default function BentoSongChat({
  state,
  t,
  lang,
  linkedSpotifyUrl,
  handleDisconnectSpotify,
  toggleSong,
  handleLinkSpotify,
  spotifyInput,
  setSpotifyInput,
  setActiveTab,
  setAmourPhoneOpen,
  addFloatingHearts,
}: BentoSongChatProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {/* Our Song Tile */}
      <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-lg">
        <div className="flex justify-between items-start">
          <span
            className={`p-2 rounded-xl text-white bg-white/5 border border-white/10 ${state.songPlaying ? 'animate-spin' : ''}`}
            style={{ animationDuration: '6s' }}
          >
            <Music className="w-5 h-5 text-[#ff4d6d]" />
          </span>
          {state.songPlaying && (
            <div className="flex gap-0.5 items-end h-5">
              <span className="w-0.5 h-3 bg-[#ff4d6d] animate-[pulse_1.2s_infinite_ease-in-out]" />
              <span className="w-0.5 h-5 bg-[#ff4d6d] animate-[pulse_0.8s_infinite_ease-in-out]" />
              <span className="w-0.5 h-2 bg-[#ff4d6d] animate-[pulse_1.5s_infinite_ease-in-out]" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[9px] font-extrabold text-[#ff4d6d] tracking-widest uppercase mb-1">
            {t('ourSongTitle')}
          </p>
          {linkedSpotifyUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="animate-ping w-1 h-1 bg-emerald-400 rounded-full inline-block" />
                Spotify Link Activo
              </p>
              <button
                onClick={handleDisconnectSpotify}
                className="text-[9px] font-bold text-rose-500 hover:underline hover:text-rose-400 leading-none"
              >
                Cambiar / Quitar ❌
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-white truncate">Perfect - Ed Sheeran</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                {state.songPlaying ? t('playingSong') : t('lastPlayedSong')}
              </p>
            </>
          )}
        </div>

        {linkedSpotifyUrl ? (
          <iframe
            src={linkedSpotifyUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl bg-black/25 mt-3 border border-white/5 shadow-inner min-h-[152px]"
          />
        ) : (
          <div className="space-y-2.5 mt-3.5">
            <button
              onClick={toggleSong}
              className={`w-full py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                state.songPlaying
                  ? 'bg-white/5 border-white/10 text-slate-200'
                  : 'bg-[#ff4d6d] border-transparent text-white shadow-[0_4px_12px_rgba(255,77,109,0.35)]'
              }`}
            >
              {state.songPlaying ? t('pausedSong') : 'Play 🎵'}
            </button>

            {/* Paste Spotify Link Input */}
            <form onSubmit={handleLinkSpotify} className="flex gap-1">
              <input
                type="text"
                placeholder={t('spotifyLinkPlaceholder')}
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] text-white outline-none placeholder:text-slate-600 focus:border-[#ff4d6d]"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide cursor-pointer uppercase"
              >
                {t('linkBtn')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Launcher Banner Card for AmourPhone Chat */}
      <div className="bg-gradient-to-br from-[#121216]/80 via-purple-950/20 to-[#121216]/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col shadow-xl relative overflow-hidden text-left">
        {/* Decorative floating hearts background */}
        <div className="absolute right-0 bottom-0 opacity-15 text-5xl pointer-events-none select-none translate-x-2 translate-y-2">
          💝📱
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 bg-[#ff4d6d]/10 rounded-lg text-[#ff4d6d] shrink-0">
            <Heart className="w-4 h-4 fill-[#ff4d6d]" />
          </span>
          <h4 className="text-xs font-black text-rose-450 tracking-wider uppercase">
            AmourPhone 📱💝
          </h4>
        </div>

        <p className="text-[11px] text-zinc-300 leading-relaxed mb-4">
          {lang === 'es'
            ? 'Conéctate de forma sintonizada con tu pareja en tu chat privado interactivo. Comparte hermosos stickers de amor, fotos de tus mejores momentos y notas de voz íntimas con sintonía en tiempo real.'
            : 'Connect instantly with your partner in your private relationship chat. Send stickers, photobooks, and voice memos synced in real-time.'}
        </p>

        <button
          type="button"
          onClick={() => {
            if (setActiveTab) {
              setActiveTab('chat');
            } else {
              setAmourPhoneOpen(true);
            }
            addFloatingHearts();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 text-white text-[11px] font-black uppercase rounded-xl tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_15px_rgba(255,77,109,0.35)] flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <span>
            {lang === 'es' ? 'Abrir AmourPhone Chat 📱💖' : 'Open AmourPhone Chat 📱💖'}
          </span>
        </button>
      </div>
    </section>
  );
}
