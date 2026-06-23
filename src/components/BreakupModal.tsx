import React from 'react';
import { CoupleState, LanguageCode } from '../types';

interface BreakupModalProps {
  state: CoupleState;
  lang: LanguageCode;
  handleCompleteBreakup: (downloadMemories: boolean) => void;
  setShowBreakUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  showTempAlert: (msg: string) => void;
}

/**
 * Break-up confirmation modal with three choices:
 * download the memories archive and erase, erase directly, or cancel.
 */
export default function BreakupModal({
  state,
  lang,
  handleCompleteBreakup,
  setShowBreakUpModal,
  showTempAlert,
}: BreakupModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn text-left">
      <div className="bg-[#120a0d] border border-red-500/40 rounded-3xl p-6 max-w-[420px] w-full space-y-5 shadow-2xl relative">
        <div className="text-center space-y-2">
          <span className="text-5xl block animate-[pulse_1.5s_infinite]">💔</span>
          <h3 className="text-lg font-black text-red-400 capitalize">
            {lang === 'es'
              ? `Confirmar Ruptura con ${state.partnerName}`
              : `Confirm Break Up with ${state.partnerName}`}
          </h3>
          <p className="text-[11px] text-zinc-350 leading-relaxed">
            {lang === 'es'
              ? 'Esta acción es definitiva y borrará de manera irreversible todas las cartas enviadas, regalos del buzón, registros de cha puntos de la tabla, canciones y fotos de tu galería compartida.'
              : 'This action is final and will irreversibly erase all sent letters, love gifts, private chat logs, leaderboard scores, linked songs, and gallery pictures.'}
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-[10px] text-red-200 mt-2">
            {lang === 'es'
              ? `¡No te preocupes! Antes de borrar todo, puedes descargar automáticamente una bitácora con los poemas, regalos y estadísticas como "album y recuerdos con ${state.partnerName}". También puedes optar por ignorarla y borrar todo directamente.`
              : `Don't worry! Before removing everything, you can download a text archive named "album y recuerdos con ${state.partnerName}" containing all letters, stats, and gifts. Or just ignore and wipe right away.`}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          {/* Option A: Download + Erase */}
          <button
            type="button"
            onClick={() => handleCompleteBreakup(true)}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            📥 {lang === 'es' ? 'Descargar Recuerdos y Borrar' : 'Download Memories & Erase'}
          </button>

          {/* Option B: Just Erase (Ignore download) */}
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  lang === 'es'
                    ? '¿Estás absolutamente seguro de que quieres borrarlo TODO sin descargar el álbum primero?'
                    : 'Are you absolutely sure you want to delete EVERYTHING without downloading the album first?'
                )
              ) {
                handleCompleteBreakup(false);
              }
            }}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl transition-all border border-white/5 cursor-pointer text-center font-sans"
          >
            🚫{' '}
            {lang === 'es'
              ? 'Ignorar descarga y Borrar Directamente'
              : 'Ignore download & Delete directly'}
          </button>

          {/* Option C: Keep Love (Cancel) */}
          <button
            type="button"
            onClick={() => {
              setShowBreakUpModal(false);
              showTempAlert(
                lang === 'es'
                  ? '¡El amor ha ganado! Vínculo protegido 💖'
                  : 'Love wins! Relationship preserved 💖'
              );
            }}
            className="w-full py-2 bg-pink-500/10 hover:bg-pink-500/20 text-[#ff4d6d] text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-[#ff4d6d]/20 cursor-pointer text-center"
          >
            💗 {lang === 'es' ? 'No, Cancelar / Volver al Amor' : 'No, Cancel / Keep the Love'}
          </button>
        </div>
      </div>
    </div>
  );
}
