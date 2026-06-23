import React from 'react';
import { CoupleState, LanguageCode } from '../types';
import { Edit3, Plus, Heart, QrCode, Copy } from 'lucide-react';

interface ConnectionPanelProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => void;
  startGoogleLogin?: () => Promise<void>;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;

  strokeDasharray: string;
  strokeDashoffset: string;

  setShowGoogleModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBreakUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingProfileTarget: React.Dispatch<React.SetStateAction<'me' | 'partner' | null>>;
  setProfileNameInput: React.Dispatch<React.SetStateAction<string>>;
  setProfileAvatarInput: React.Dispatch<React.SetStateAction<string>>;

  pairingOpen: boolean;
  setPairingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pairingCode: string;

  partnerSearchCode: string;
  setPartnerSearchCode: React.Dispatch<React.SetStateAction<string>>;
  isLinking: boolean;
  setIsLinking: React.Dispatch<React.SetStateAction<boolean>>;
  partnerLinkError: string | null;
  setPartnerLinkError: React.Dispatch<React.SetStateAction<string | null>>;
  partnerLinkSuccess: string | null;
  setPartnerLinkSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  linkCopiedAlert: boolean;
  setLinkCopiedAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Main connection row: Google session notice, break-up zone, the couple's
 * avatars + warmth gauge, and the QR / link pairing vault.
 */
export default function ConnectionPanel({
  state,
  setState,
  t,
  lang,
  currentUserEmail,
  setCurrentUserEmail,
  startGoogleLogin,
  addFloatingHearts,
  showTempAlert,
  strokeDasharray,
  strokeDashoffset,
  setShowGoogleModal,
  setShowBreakUpModal,
  setEditingProfileTarget,
  setProfileNameInput,
  setProfileAvatarInput,
  pairingOpen,
  setPairingOpen,
  pairingCode,
  partnerSearchCode,
  setPartnerSearchCode,
  isLinking,
  setIsLinking,
  partnerLinkError,
  setPartnerLinkError,
  partnerLinkSuccess,
  setPartnerLinkSuccess,
  linkCopiedAlert,
  setLinkCopiedAlert
}: ConnectionPanelProps) {
  return (
    <section className="pt-20 space-y-4">
      {/* GOOGLE SECURITY SESSIONS NOTICES */}
      {/* "y que toda la informacion del usuario solo se guarde con agragar su correo de lo contrario se le borrara toda la información" */}
      {!currentUserEmail ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 shadow-md text-left flex flex-col gap-2 relative overflow-hidden">
          <div className="flex gap-2.5 items-start">
            <span className="text-lg">⚠️</span>
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                {lang === 'es'
                  ? 'Aviso de Sesión Temporal (Sin Guardar)'
                  : 'Temporary Session Notice (Not Saved)'}
              </h4>
              <p className="text-[10px] text-zinc-300 leading-tight">
                {lang === 'es' ? (
                  <>
                    Toda tu información, nombres e imágenes{' '}
                    <strong>se borrarán al cerrar o actualizar la app</strong> (saldrán vacíos al
                    inicio). Vincula tu cuenta de Google para guardar tus recuerdos para siempre.
                  </>
                ) : (
                  <>
                    All your information, names and images{' '}
                    <strong>will be erased when you close or refresh the app</strong> (everything
                    starts empty). Link your Google account to keep your memories forever.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowGoogleModal(true);
              addFloatingHearts();
            }}
            className="py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:scale-[1.02] text-white text-[10px] font-black uppercase rounded-lg transition-all border-none cursor-pointer"
          >
            {lang === 'es' ? 'Vincular con Google 🚀' : 'Link with Google 🚀'}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 shadow-md flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-500/50" />
            <div>
              <p className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest">
                {lang === 'es' ? 'Google Sincronizado' : 'Google Synced'}
              </p>
              <p className="text-[10px] text-slate-100 font-bold truncate max-w-[200px]">
                {currentUserEmail}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (
                confirm(
                  lang === 'es'
                    ? '¿Cerrar sesión de Google? Esto provocará que los datos se borren al recargar.'
                    : 'Sign out of Google? This will cause your data to be erased on reload.'
                )
              ) {
                localStorage.removeItem('couple_app_email');
                localStorage.removeItem('couple_app_token');
                setCurrentUserEmail(null);
                showTempAlert(
                  lang === 'es' ? 'Sesión de Google desconectada' : 'Google session disconnected'
                );
              }
            }}
            className="px-2.5 py-1 bg-white/5 hover:bg-rose-950/40 text-[9px] hover:text-red-400 text-slate-400 font-bold rounded-md transition-all border-none cursor-pointer"
          >
            {lang === 'es' ? 'Desconectar' : 'Disconnect'}
          </button>
        </div>
      )}

      {state.partnerName && (
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-3.5 shadow-md flex items-center justify-between text-left animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-xl animate-pulse">💔</span>
            <div>
              <p className="text-[8px] font-extrabold text-[#ff4d6d] uppercase tracking-widest leading-none mb-1">
                {lang === 'es' ? 'Zona de Ruptura' : 'Relationship Status'}
              </p>
              <p className="text-[10px] text-zinc-350 leading-tight">
                {lang === 'es'
                  ? `¿Las cosas no funcionaron con ${state.partnerName}? Puedes romper el vínculo y borrar todos los datos compartidos.`
                  : `Things didn't work out with ${state.partnerName}? You can dissolve the link & clear all data.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowBreakUpModal(true);
              addFloatingHearts();
            }}
            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-350 hover:text-rose-100 text-[9px] font-black uppercase rounded-lg transition-all border border-rose-500/20 cursor-pointer whitespace-nowrap"
          >
            {lang === 'es' ? 'Romper 💔' : 'Break Up 💔'}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center relative py-4 px-2">
        {/* Connection Visual Line */}
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gradient-to-r from-[#ff4d6d]/10 via-[#ff4d6d]/50 to-[#ff4d6d]/10 -translate-y-1/2 -z-10 rounded-full" />

        {/* Left Avatar (Me) - Clickable to edit */}
        <div
          onClick={() => {
            setEditingProfileTarget('me');
            setProfileNameInput(state.meName || '');
            setProfileAvatarInput(state.meAvatar || '');
            addFloatingHearts();
          }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="relative w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-[#ff4d6d] to-purple-500 shadow-[0_0_15px_rgba(255,77,109,0.3)] group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full rounded-full overflow-hidden border border-[#0a0a0b] bg-slate-900 flex items-center justify-center relative">
              {state.meAvatar ? (
                <img
                  className="w-full h-full object-cover select-none"
                  src={state.meAvatar}
                  alt={state.meName || (lang === 'es' ? 'Tú' : 'You')}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center font-bold text-rose-500 text-xs">
                  <Plus className="w-5 h-5 mx-auto opacity-70" />
                  <span className="text-[9px] block uppercase">
                    {lang === 'es' ? 'Foto' : 'Photo'}
                  </span>
                </div>
              )}
              {/* Pencil indicator overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <Edit3 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#ff4d6d] text-white text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full border border-white/10 shadow-md">
              {t('me')}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-300 font-sans tracking-wide truncate max-w-[90px]">
            {state.meName || (
              <span className="text-slate-500 italic">
                {lang === 'es' ? 'No nombre ✏️' : 'No name ✏️'}
              </span>
            )}
          </span>
        </div>

        {/* Core gauge warmth meter */}
        <div className="relative flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center p-1 shadow-xl border border-white/10 hover:scale-105 transition-transform duration-300">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
              />
              {/* Animated progress ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#ff4d6d"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Heart className="w-5 h-5 text-[#ff4d6d] fill-[#ff4d6d] animate-heartbeat" />
              <span className="text-2xl font-black text-white mt-[-2px]">{state.warmth}%</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#ff4d6d]">
                {state.warmth >= 70 ? t('warmLabel') : t('coldLabel')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Avatar (Partner) - Read-only for other partner */}
        <div
          onClick={() => {
            showTempAlert(
              lang === 'es'
                ? 'El perfil de tu pareja solo puede ser modificado desde su propia cuenta. 🔒💖'
                : "Your partner's profile can only be modified from their own account. 🔒💖"
            );
            addFloatingHearts();
          }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="relative w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-[#ff4d6d] shadow-[0_0_15px_rgba(255,77,109,0.3)] group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full rounded-full overflow-hidden border border-[#0a0a0b] bg-slate-900 flex items-center justify-center relative">
              {state.partnerAvatar ? (
                <img
                  className="w-full h-full object-cover select-none"
                  src={state.partnerAvatar}
                  alt={state.partnerName || (lang === 'es' ? 'Pareja' : 'Partner')}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center font-bold text-rose-500 text-xs">
                  <Plus className="w-5 h-5 mx-auto opacity-70 animate-pulse" />
                  <span className="text-[8px] block uppercase tracking-tighter">
                    {lang === 'es' ? 'Vincular' : 'Link'}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full border border-white/10 shadow-md">
              {t('partner')}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-300 font-sans tracking-wide truncate max-w-[90px]">
            {state.partnerName || (lang === 'es' ? 'Sin Conectar 💤' : 'Offline 💤')}
          </span>
        </div>
      </div>

      {/* Dynamic connection evaluation subtitle */}
      <p className="text-center text-xs font-medium text-slate-400 mt-1 italic">
        {state.warmth >= 75 ? t('connectionHot') : t('connectionCold')}
      </p>

      {/* ADORABLE PASTE PARTNER SYNC PANEL */}
      {/* "y que para vincular a tu pareja tiene que ser o por un qr o compartiendo el enlace de tu pareja y el lo abre" */}
      <div className="bg-[#121217]/85 border border-[#ff4d6d]/20 rounded-2xl p-3.5 shadow-md text-left flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-black text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-[#ff4d6d]" />
            {lang === 'es' ? 'Bóveda de Sincronización de Pareja' : 'Couple Sync Vault'}
          </h4>
          <button
            onClick={() => {
              setPairingOpen(!pairingOpen);
              addFloatingHearts();
            }}
            className="px-2.5 py-1 bg-rose-500/10 text-[#ff4d6d] hover:bg-[#ff4d6d]/20 rounded-lg text-[9px] font-bold transition-all border-none cursor-pointer"
          >
            {pairingOpen
              ? lang === 'es'
                ? 'Ocultar'
                : 'Hide'
              : lang === 'es'
                ? 'Ver QR / Enlace 📲'
                : 'View QR / Link 📲'}
          </button>
        </div>

        {pairingOpen && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {!currentUserEmail ? (
              <div className="p-5 bg-stone-900/40 border border-[#ff4d6d]/25 rounded-2xl space-y-3.5 text-center">
                <span className="text-4xl animate-bounce inline-block">🔒💝</span>
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-[#ff4d6d] uppercase tracking-widest">
                    {lang === 'es' ? 'Inicio de Sesión Requerido' : 'Login Required'}
                  </h5>
                  <p className="text-[10px] text-zinc-300 leading-relaxed max-w-[290px] mx-auto font-sans">
                    {lang === 'es'
                      ? 'Para emparejarte en tiempo real de forma exclusiva, debes autenticarte oficialmente mediante tu Google. Esto previene que otras personas usen tu correo.'
                      : 'To pair in real-time exclusively, you must officially authenticate with your Google account. This prevents other people from using your email.'}
                  </p>
                </div>
                <div className="space-y-2 max-w-[280px] mx-auto pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (startGoogleLogin) {
                        await startGoogleLogin();
                      } else {
                        showTempAlert(
                          lang === 'es'
                            ? 'El sistema de inicio de sesión de Google no está disponible.'
                            : 'The Google login system is not available.'
                        );
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-red-550 to-pink-500 hover:scale-[1.01] active:scale-[0.99] text-white font-sans font-black text-[11px] uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19A5.852 5.852 0 0 1 8.13 11.74a5.857 5.857 0 0 1 5.861-5.851c1.478 0 2.825.55 3.862 1.455l2.428-2.428C18.66 3.4 16.481 2.3 13.991 2.3c-5.352 0-9.691 4.34-9.691 9.69s4.339 9.691 9.691 9.691c5.586 0 9.29-3.924 9.29-9.454 0-.6-.057-1.1-.152-1.542H12.24z" />
                    </svg>
                    {lang === 'es' ? 'Iniciar con Google 🔑' : 'Sign in with Google 🔑'}
                  </button>

                  <p className="text-[9px] text-pink-300/85 italic leading-tight pt-1 font-sans">
                    {lang === 'es'
                      ? '⚠️ Una vez que inicies sesión, podrás generar tu PIN o ingresar el correo de tu pareja para vincularse de inmediato.'
                      : "⚠️ Once you log in, you can generate your PIN or enter your partner's email to link instantly."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Side A: QR Code Visual display */}
                <div className="p-3 bg-stone-900/60 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 mb-2 uppercase">
                    {lang === 'es' ? 'Código QR Sincrónico' : 'Sync QR Code'}
                  </p>

                  {/* Highly styled abstract SVG QR code representation */}
                  <div className="bg-white p-2.5 rounded-xl border border-pink-500/30 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative">
                    <svg
                      className="w-24 h-24 text-stone-950"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      {/* Standard QR squares corners */}
                      <rect x="0" y="0" width="25" height="25" />
                      <rect x="4" y="4" width="17" height="17" fill="white" />
                      <rect x="8" y="8" width="9" height="9" />

                      <rect x="75" y="0" width="25" height="25" />
                      <rect x="79" y="4" width="17" height="17" fill="white" />
                      <rect x="83" y="8" width="9" height="9" />

                      <rect x="0" y="75" width="25" height="25" />
                      <rect x="4" y="79" width="17" height="17" fill="white" />
                      <rect x="8" y="83" width="9" height="9" />

                      {/* Random pixel matrices patterns */}
                      <rect x="35" y="5" width="8" height="8" />
                      <rect x="48" y="12" width="6" height="15" />
                      <rect x="60" y="2" width="10" height="7" />
                      <rect x="30" y="30" width="15" height="4" />
                      <rect x="52" y="38" width="9" height="9" />
                      <rect x="10" y="40" width="12" height="6" />
                      <rect x="2" y="55" width="20" height="5" />

                      <rect x="70" y="45" width="25" height="8" />
                      <rect x="85" y="60" width="8" height="12" />
                      <rect x="40" y="55" width="15" height="20" />
                      <rect x="65" y="75" width="18" height="18" />
                      <polygon points="45,85 55,95 38,98" />

                      {/* Adorable pink heart in the middle of QR */}
                      <path
                        d="M50 42 c-1 -1 -3 -1 -4 0 c-2 2 0 6 4 9 c4 -3 6 -7 4 -9 c-1 -1 -3 -1 -4 0 Z"
                        fill="#ff4d6d"
                      />
                    </svg>
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-2 font-mono uppercase">
                    {lang === 'es'
                      ? 'Escanea con tu pareja para unirse'
                      : 'Scan with your partner to join'}
                  </span>
                </div>

                {/* Side B: Link generator and invite copy button */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      {lang === 'es' ? 'Comparte tu enlace' : 'Share your link'}
                    </span>
                    <p className="text-[10px] text-zinc-300 leading-tight">
                      {lang === 'es'
                        ? 'Envía este enlace o escribe el código PIN para sincronizar su información de forma automática.'
                        : 'Send this link or type the PIN code to sync their information automatically.'}
                    </p>
                    {pairingCode && (
                      <div className="bg-pink-950/30 border border-[#ff4d6d]/20 px-2 py-1 rounded-lg text-center mt-1.5">
                        <span className="text-[8px] uppercase tracking-wider text-[#ff4d6d] font-bold">
                          {lang === 'es' ? 'Código PIN:' : 'PIN Code:'}
                        </span>
                        <p className="text-sm font-black text-white tracking-widest">
                          {pairingCode}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        const code =
                          pairingCode ||
                          'LOVE-' +
                            (currentUserEmail
                              ? currentUserEmail.split('@')[0].toUpperCase()
                              : 'GUEST');
                        const url = `${window.location.origin}${window.location.pathname}?joinCode=${code}&joinName=${encodeURIComponent(state.meName || 'Johan')}&joinAvatar=${encodeURIComponent(state.meAvatar || '')}`;
                        navigator.clipboard.writeText(url);
                        setLinkCopiedAlert(true);
                        addFloatingHearts();
                        setTimeout(() => setLinkCopiedAlert(false), 2500);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.01] text-white font-sans text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {linkCopiedAlert
                        ? lang === 'es'
                          ? '¡Enlace Copiado! 💘'
                          : 'Link Copied! 💘'
                        : lang === 'es'
                          ? 'Copiar Enlace de Pareja 🔗'
                          : 'Copy Partner Link 🔗'}
                    </button>

                    <span className="text-[8px] font-mono text-zinc-500 leading-none block text-center truncate">
                      {window.location.origin}/?joinCode={pairingCode || '...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Enter partner invitation code input */}
            <div className="border-t border-white/5 pt-3.5 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                {lang === 'es'
                  ? '¿Tienes el enlace o código de tu pareja?'
                  : "Have your partner's link or code?"}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerSearchCode}
                  onChange={(e) => setPartnerSearchCode(e.target.value)}
                  placeholder={
                    lang === 'es'
                      ? 'Pega el enlace completo o digita su código PIN de 6 dígitos...'
                      : 'Paste the full link or type their 6-digit PIN code...'
                  }
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff4d6d]/50"
                />
                <button
                  disabled={isLinking}
                  onClick={async () => {
                    const input = partnerSearchCode.trim();
                    if (!input) return;
                    setPartnerLinkError(null);
                    setPartnerLinkSuccess(null);
                    setIsLinking(true);

                    let codeValue = input;
                    // Extract joinCode query parameter from URL if pasted as full link
                    if (input.includes('joinCode=')) {
                      try {
                        const parsed = new URLSearchParams(
                          input.substring(input.indexOf('?'))
                        );
                        codeValue = parsed.get('joinCode') || input;
                      } catch (ex) {
                        /* no-op */
                      }
                    }

                    if (!currentUserEmail) {
                      setShowGoogleModal(true);
                      setPartnerLinkError(
                        lang === 'es'
                          ? '¡Vincúlate primero! Luego ingresa el código.'
                          : 'Link your account first! Then enter the code.'
                      );
                      showTempAlert(
                        lang === 'es'
                          ? '¡Vincúlate primero! Luego ingresa el código.'
                          : 'Link your account first! Then enter the code.'
                      );
                      setIsLinking(false);
                      return;
                    }

                    try {
                      const res = await fetch('/api/couple/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: currentUserEmail,
                          code: codeValue,
                        }),
                      });

                      if (res.ok) {
                        const data = await res.json();
                        setState((prev) => ({
                          ...prev,
                          partnerName: data.partner.name || data.partner.email.split('@')[0],
                          partnerAvatar:
                            data.partner.avatar ||
                            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80',
                          coupleId: data.couple.id,
                        }));
                        setPartnerSearchCode('');
                        setPartnerLinkSuccess(
                          lang === 'es'
                            ? '¡Cuentas emparejadas con éxito! Ambos dispositivos ahora se sincronizan en tiempo real. 💖'
                            : 'Successfully connected! Both devices are now syncing in real-time. 💖'
                        );
                        showTempAlert(
                          lang === 'es'
                            ? `¡Sincronizado de forma automática! 💘`
                            : `Synced automatically! 💘`
                        );
                        for (let i = 0; i < 6; i++) setTimeout(addFloatingHearts, i * 150);
                      } else {
                        const err = await res.json();
                        setPartnerLinkError(
                          err.error ||
                            (lang === 'es'
                              ? 'Código o Enlace no encontrado en la bobeada.'
                              : 'Code or link not found.')
                        );
                      }
                    } catch (e) {
                      console.error(e);
                      setPartnerLinkError(
                        lang === 'es'
                          ? 'Error al conectar con la bóveda de emparejamiento.'
                          : 'Error connecting to the pairing vault.'
                      );
                    } finally {
                      setIsLinking(false);
                    }
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-[#ff4d6d] font-bold text-xs rounded-xl transition-all border-none cursor-pointer flex items-center justify-center min-w-[80px]"
                >
                  {isLinking ? (
                    <span className="animate-pulse">
                      {lang === 'es' ? 'Cargando...' : 'Loading...'}
                    </span>
                  ) : lang === 'es' ? (
                    'Vincular'
                  ) : (
                    'Link'
                  )}
                </button>
              </div>

              {partnerLinkError && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-red-950/45 border border-red-500/25 text-[11px] leading-relaxed text-red-300">
                  <span className="font-bold text-red-400 block mb-1">
                    {lang === 'es' ? '⚠️ Error de Sincronización' : '⚠️ Sync Error'}
                  </span>
                  <p className="mb-2 text-white/90">{partnerLinkError}</p>

                  <div className="text-[10px] text-zinc-400 font-normal leading-normal pt-2 border-t border-red-500/15 space-y-2">
                    <p className="text-[#fda4af] font-medium">
                      💡{' '}
                      <strong>
                        {lang === 'es'
                          ? '¿Por qué falló y cómo solucionarlo?'
                          : 'Why did it fail and how to fix it?'}
                      </strong>
                    </p>
                    <p>
                      {lang === 'es' ? (
                        <>
                          Si estás haciendo pruebas tú mismo usando{' '}
                          <strong>dos navegadores distintos</strong>, asegúrate de que ambos estén
                          usando el <strong>mismo entorno (misma URL principal)</strong>:
                        </>
                      ) : (
                        <>
                          If you are testing by yourself using{' '}
                          <strong>two different browsers</strong>, make sure both are using the{' '}
                          <strong>same environment (same main URL)</strong>:
                        </>
                      )}
                    </p>
                    <ul className="list-disc pl-3.5 space-y-1">
                      <li>
                        <strong>
                          {lang === 'es'
                            ? 'Ambos en la URL de Desarrollo:'
                            : 'Both on the Development URL:'}
                        </strong>{' '}
                        {lang === 'es' ? (
                          <>
                            Revisa si los dos navegadores dicen <code>ais-dev-...</code> al inicio
                            de su dirección de internet.
                          </>
                        ) : (
                          <>
                            Check if both browsers show <code>ais-dev-...</code> at the start of
                            their web address.
                          </>
                        )}
                      </li>
                      <li>
                        <strong>
                          {lang === 'es'
                            ? 'Ambos en la URL de Vista Previa Compartida:'
                            : 'Both on the Shared Preview URL:'}
                        </strong>{' '}
                        {lang === 'es' ? (
                          <>
                            O si ambos navegadores dicen <code>ais-pre-...</code>.
                          </>
                        ) : (
                          <>
                            Or if both browsers show <code>ais-pre-...</code>.
                          </>
                        )}
                      </li>
                    </ul>
                    <p className="bg-black/30 p-2 rounded-lg text-zinc-400 border border-white/5">
                      ⚙️ <em>{lang === 'es' ? 'Razón técnica:' : 'Technical reason:'}</em>{' '}
                      {lang === 'es' ? (
                        <>
                          Los enlaces con <code>ais-dev</code> y <code>ais-pre</code> se ejecutan en
                          servidores y computadoras diferentes de la nube. Por lo tanto, un PIN
                          generado en la versión compartida no existirá en la versión de desarrollo
                          y viceversa.
                        </>
                      ) : (
                        <>
                          Links with <code>ais-dev</code> and <code>ais-pre</code> run on different
                          cloud servers and machines. So a PIN generated in the shared version won&apos;t
                          exist in the development version and vice versa.
                        </>
                      )}
                    </p>
                    <p className="text-[#fda4af] font-medium">
                      🔑{' '}
                      <strong>
                        {lang === 'es'
                          ? 'Cómo simular otra cuenta en tu PC correctamente:'
                          : 'How to correctly simulate another account on your PC:'}
                      </strong>
                    </p>
                    <ol className="list-decimal pl-3.5 space-y-1">
                      <li>
                        {lang === 'es'
                          ? 'Copia el enlace completo de la barra de direcciones de tu navegador actual (por ejemplo, el de desarrollo o el de vista previa).'
                          : 'Copy the full link from the address bar of your current browser (for example, the development or preview one).'}
                      </li>
                      <li>
                        {lang === 'es' ? (
                          <>
                            Abre una ventana en <strong>Modo Incógnito</strong> en tu otro
                            navegador y pega exactamente ese enlace.
                          </>
                        ) : (
                          <>
                            Open an <strong>Incognito Window</strong> in your other browser and
                            paste that exact link.
                          </>
                        )}
                      </li>
                      <li>
                        {lang === 'es' ? (
                          <>
                            Dale click en &quot;Vincular con Google&quot; en el inciso{' '}
                            <strong>&quot;O ACCEDE CON OTRO CORREO&quot;</strong> para autenticar
                            un correo
                            secundario (ej. <code>pareja@gmail.com</code>).
                          </>
                        ) : (
                          <>
                            Click &quot;Link with Google&quot; under the{' '}
                            <strong>&quot;OR SIGN IN WITH ANOTHER EMAIL&quot;</strong> section to authenticate
                            a secondary email (e.g. <code>partner@gmail.com</code>).
                          </>
                        )}
                      </li>
                      <li>
                        {lang === 'es'
                          ? '¡Y listo! Copia el nuevo PIN generado allí e ingresalo en tu ventana principal.'
                          : 'And done! Copy the new PIN generated there and enter it in your main window.'}
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {partnerLinkSuccess && (
                <div className="mt-2.5 p-3 rounded-xl bg-green-950/45 border border-green-500/25 text-[11px] leading-relaxed text-green-300">
                  <span className="font-bold text-green-400 block mb-0.5">
                    {lang === 'es' ? '✨ ¡Conexión Exitosa!' : '✨ Connection Successful!'}
                  </span>
                  {partnerLinkSuccess}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
