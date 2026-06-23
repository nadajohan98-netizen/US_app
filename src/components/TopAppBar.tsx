import React from 'react';
import { CoupleState, LanguageCode } from '../types';
import { Phone, Video, Flame } from 'lucide-react';

interface TopAppBarProps {
  state: CoupleState;
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  setEditingProfileTarget: React.Dispatch<React.SetStateAction<'me' | 'partner' | null>>;
  setProfileNameInput: React.Dispatch<React.SetStateAction<string>>;
  setProfileAvatarInput: React.Dispatch<React.SetStateAction<string>>;
  addFloatingHearts: () => void;
  handleStartCall: (type: 'voice' | 'video') => void;
}

/**
 * Fixed top app bar: profile shortcu app title, language switcher,
 * call shortcuts and the streak badge.
 */
export default function TopAppBar({
  state,
  lang,
  setLang,
  setEditingProfileTarget,
  setProfileNameInput,
  setProfileAvatarInput,
  addFloatingHearts,
  handleStartCall,
}: TopAppBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-white/5 px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-[600px] mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            onClick={() => {
              setEditingProfileTarget('me');
              setProfileNameInput(state.meName || '');
              setProfileAvatarInput(state.meAvatar || '');
              addFloatingHearts();
            }}
            className="w-10 h-10 rounded-full overflow-hidden border border-white/20 hover:border-[#ff4d6d] shadow-lg cursor-pointer bg-slate-900 flex items-center justify-center text-rose-500 text-xs transition-colors"
            title={lang === 'es' ? 'Ajustar Perfil' : 'Edit Profile'}
          >
            {state.meAvatar ? (
              <img
                alt="My profile"
                className="w-full h-full object-cover"
                src={state.meAvatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>👤</span>
            )}
          </div>
          <h1 className="font-serif text-[28px] font-bold text-[#ff4d6d] tracking-tight">Us</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full py-1 px-1.5 text-xs text-slate-300">
            <button
              className={`px-2 py-0.5 rounded-full transition-all text-xs font-bold cursor-pointer ${lang === 'es' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setLang('es')}
              title="Español"
            >
              ES
            </button>
            <button
              className={`px-2 py-0.5 rounded-full transition-all text-xs font-bold cursor-pointer ${lang === 'en' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setLang('en')}
              title="English"
            >
              EN
            </button>
            <button
              className={`px-2 py-0.5 rounded-full transition-all text-xs font-bold cursor-pointer ${lang === 'pt' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setLang('pt')}
              title="Português"
            >
              PT
            </button>
          </div>

          {/* Calling Shortcuts */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => handleStartCall('voice')}
              className="p-1 text-slate-300 hover:text-[#ff4d6d] transition-colors cursor-pointer"
              title="Voice Call"
              aria-label={lang === 'es' ? 'Llamada de voz' : 'Voice call'}
            >
              <Phone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              className="p-1 text-slate-300 hover:text-[#ff4d6d] transition-colors cursor-pointer"
              title="Video Call"
              aria-label={lang === 'es' ? 'Videollamada' : 'Video call'}
            >
              <Video className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 bg-[#ff4d6d] text-white px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,77,109,0.3)] animate-pulse">
            <Flame className="w-4 h-4 fill-white text-rose-250 animate-bounce" />
            <span className="font-extrabold text-xs tracking-wide">{state.streak}D</span>
          </div>
        </div>
      </div>
    </header>
  );
}
