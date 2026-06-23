import React from 'react';
import { CoupleState } from '../types';

interface DailyMemoryWidgetProps {
  state: CoupleState;
  t: (key: string) => string;
}

/**
 * "Daily memory" polaroid collage showing the couple's avatars in a
 * decorative taped-photo frame.
 */
export default function DailyMemoryWidget({ state, t }: DailyMemoryWidgetProps) {
  return (
    <section className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-sans text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
          <span>✨</span> {t('dailyMemoryTitle')}
        </h3>
        <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 bg-[#ff4d6d]/25 text-[#ff4d6d] border border-[#ff4d6d]/30 rounded-full">
          {t('newBadge')}
        </span>
      </div>

      {/* Polaroid Memory Collage Frame */}
      <div className="relative p-5 bg-[#0e0e11]/90 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border border-white/5 group min-h-[220px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,109,0.06)_0%,transparent_80%)] pointer-events-none" />

        {/* Polaroid 1 (User / Left) & Polaroid 2 (Partner / Right) overlap stack */}
        <div className="flex gap-4 rotate-[-3deg] group-hover:rotate-0 transition-transform duration-500">
          {/* Me Polaroid */}
          <div className="bg-white p-2 pb-5 text-stone-950 w-24 shadow-2xl relative rounded-sm transform hover:scale-115 hover:rotate-[3deg] transition-all duration-300">
            {/* Scotch Tape Decor */}
            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white/40 shadow-xs border border-white/10 rotate-[15deg]" />
            <div className="aspect-square w-full rounded-xs overflow-hidden border border-stone-200 bg-black">
              {state.meAvatar ? (
                <img
                  src={state.meAvatar}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-zinc-800">
                  No foto
                </div>
              )}
            </div>
            <p className="text-[8px] font-sans font-black text-center mt-2 tracking-wide text-rose-600 truncate">
              {state.meName || 'Johan'}
            </p>
          </div>

          {/* Partner Polaroid */}
          <div className="bg-white p-2 pb-5 text-stone-950 w-24 shadow-2xl relative rounded-sm transform hover:scale-115 hover:rotate-[-3deg] transition-all duration-300 rotate-[8deg]">
            {/* Scotch Tape Decor */}
            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white/40 shadow-xs border border-white/10 rotate-[-15deg]" />
            <div className="aspect-square w-full rounded-xs overflow-hidden border border-stone-200 bg-black">
              {state.partnerAvatar ? (
                <img
                  src={state.partnerAvatar}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-zinc-800">
                  No foto
                </div>
              )}
            </div>
            <p className="text-[8px] font-sans font-black text-center mt-2 tracking-wide text-rose-600 truncate">
              {state.partnerName || 'Alex'}
            </p>
          </div>
        </div>

        {/* Captions and Date */}
        <div className="mt-3 text-center z-10 space-y-1">
          <p className="font-sans font-bold text-white text-xs tracking-wide flex items-center justify-center gap-1.5">
            <span>{t('sunsetWalk')}</span>
            <span className="text-[#ff4d6d] text-xs fill-[#ff4d6d] inline-block animate-pulse">
              ❤️
            </span>
          </p>
          <p className="text-[8px] font-mono text-slate-450 uppercase tracking-widest leading-none">
            {t('oct2023')}
          </p>
        </div>
      </div>
    </section>
  );
}
