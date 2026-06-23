import React from 'react';
import { LanguageCode } from '../types';

interface PermissionsAssistantModalProps {
  lang: LanguageCode;
  onGrant: () => void;
  onSimulate: () => void;
  onSkip: () => void;
}

/**
 * High-priority overlay that asks the user to grant (or simulate) GPS and
 * call permissions. Rendered by HomeSection only while consent is pending.
 */
export default function PermissionsAssistantModal({
  lang,
  onGrant,
  onSimulate,
  onSkip,
}: PermissionsAssistantModalProps) {
  return (
    <div className="fixed inset-0 bg-[#07070a]/95 backdrop-blur-xl z-[999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="max-w-md w-full bg-[#121217] border-2 border-[#ff4d6d]/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_10px_50px_rgba(255,77,109,0.25)] relative text-center animate-fade-in">
        {/* Visual Header Badge / Icon */}
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff4d6d] to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <span className="text-3xl animate-pulse">🔒</span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-black items-center justify-center text-white">
              !
            </span>
          </span>
        </div>

        {/* Title / Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-serif font-black text-white uppercase tracking-wider">
            {lang === 'es' ? 'Asistente de Permisos Seguros' : 'Secure Permissions Assistant'}
          </h3>
          <p className="text-[12px] text-rose-400 font-sans font-black tracking-widest uppercase">
            {lang === 'es'
              ? '📍 UBICACIÓN EN SINCRO Y AUDIO/VIDEO 📞'
              : '📍 SYNC LOCATION & CALL AUDIO/VIDEO 📞'}
          </p>
          <p className="text-[11px] text-zinc-350 leading-relaxed max-w-sm mx-auto font-medium">
            {lang === 'es'
              ? 'Para habilitar las citas virtuales, ver la distancia mutua real y usar el AmourPhone para videollamadas, el navegador solicitará acceso a tu ubicación y recursos de llamada.'
              : 'To enable romantic date mapping, real-time mutual distance tracking, and AmourPhone private video/audio calls, please grant the essential safe permissions.'}
          </p>
        </div>

        {/* List of features */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] space-y-3 text-left">
          <div className="flex gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-extrabold text-[#ff4d6d] uppercase tracking-wide">
                {lang === 'es'
                  ? 'Ubicación Mutua en Tiempo Real'
                  : 'Real-Time Mutual GPS Location'}
              </p>
              <p className="text-slate-400 leading-snug">
                {lang === 'es'
                  ? 'Dibuja la ruta, calcula el tiempo de encuentro y el radar en vivo de la pareja.'
                  : 'Calculates the space between you both, gives travel times, and plots positions.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2.5 border-t border-white/5">
            <span className="text-xl">🎙️</span>
            <div>
              <p className="font-extrabold text-purple-400 uppercase tracking-wide">
                {lang === 'es' ? 'Llamadas de Voz y Videofilm' : 'AmourPhone Voice & Video Calls'}
              </p>
              <p className="text-slate-400 leading-snug">
                {lang === 'es'
                  ? 'Permite usar el micrófono y cámara en conexiones privadas de watchparties.'
                  : 'Streams private camera/microphone signals securely during cozy stream watching.'}
              </p>
            </div>
          </div>
        </div>

        {/* Warning regarding errors / iframes */}
        <div className="bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/20 text-[9px] text-slate-350 leading-relaxed text-left space-y-1.5">
          <p className="font-black text-rose-400">
            💡{' '}
            {lang === 'es' ? '¿Viendo un error de Ubicación?' : 'Experiencing a Location Error?'}
          </p>
          <p>
            {lang === 'es'
              ? 'A veces, los navegadores bloquean el GPS nativo si la página está incrustada. Si esto ocurre, presiona el botón "Simular" abajo para omitir el GPS físico y jugar con coordenadas simuladas instantáneamente.'
              : 'Browsers sometimes block GPS permissions on preview frames. If that happens, click the "Simulate" option below to bypass and start interacting instantly!'}
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onGrant}
            className="w-full py-3 bg-[#ff4d6d] hover:bg-[#ff4d6d]/95 hover:scale-[1.02] active:scale-95 text-white font-sans text-xs font-black uppercase rounded-2xl tracking-widest transition-all cursor-pointer border-none shadow-[0_5px_20px_rgba(255,77,109,0.4)]"
          >
            🚀 {lang === 'es' ? 'CONCEDER PERMISOS DISPOSITIVO' : 'GRANT DEVICE PERMISSIONS'}
          </button>

          <button
            type="button"
            onClick={onSimulate}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-rose-400 hover:text-rose-300 font-sans text-[10px] font-bold uppercase rounded-xl border border-white/10 hover:border-[#ff4d6d]/40 transition-all cursor-pointer"
          >
            🧬{' '}
            {lang === 'es'
              ? '🧬 ACTIVAR MODO SIMULACIÓN (RECOMENDADO)'
              : '🧬 ACTIVATE SIMULATED DEMO MODE'}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="text-[9px] text-slate-500 hover:text-slate-400 underline transition-colors cursor-pointer bg-transparent border-none mt-1"
          >
            {lang === 'es'
              ? 'Continuar de todos modos sin permisos'
              : 'Skip permissions setup for now'}
          </button>
        </div>
      </div>
    </div>
  );
}
