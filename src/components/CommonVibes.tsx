import React, { useState } from 'react';
import { CoupleState, LanguageCode } from '../types';

interface CommonVibesProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  currentUserEmail: string | null;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;
}

export default function CommonVibes({
  state,
  setState,
  t,
  lang,
  currentUserEmail,
  addFloatingHearts,
  showTempAlert,
}: CommonVibesProps) {
  const [commonCategory, setCommonCategory] = useState<'food' | 'music' | 'outings' | 'hobbies'>(
    'food'
  );
  const [newCommonItem, setNewCommonItem] = useState('');
  const commonItems = state.commonItems || [];

  const handleAddCommonItem = (overrideText?: string) => {
    const textToSubmit = (typeof overrideText === 'string' ? overrideText : newCommonItem).trim();
    if (!textToSubmit) return;

    if (!currentUserEmail) {
      showTempAlert(
        lang === 'es'
          ? '¡Inicia sesión para guardar tus gustos! 💖'
          : 'Sign in to save your tastes! 💖'
      );
      return;
    }

    addFloatingHearts();

    fetch('/api/user/tastes/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUserEmail,
        category: commonCategory,
        text: textToSubmit,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.commonItems) {
            setState((prev) => ({
              ...prev,
              commonItems: data.commonItems,
            }));
          }
          if (typeof overrideText !== 'string') {
            setNewCommonItem('');
          }
          showTempAlert(
            lang === 'es' ? '¡Gusto guardado y sincronizado! 💖' : 'Vibe saved and synced! 💖'
          );
        } else {
          showTempAlert(lang === 'es' ? 'Error al guardar gusto.' : 'Failed to save taste.');
        }
      })
      .catch((err) => {
        console.error('Taste submission error');
        showTempAlert(lang === 'es' ? 'Error de red' : 'Network error');
      });
  };

  const handleRemoveCommonItem = (id: string) => {
    if (!currentUserEmail) return;

    fetch('/api/user/tastes/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUserEmail,
        id: id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.commonItems) {
          setState((prev) => ({
            ...prev,
            commonItems: data.commonItems,
          }));
          showTempAlert(lang === 'es' ? 'Gusto eliminado 💔' : 'Vibe removed 💔');
        }
      })
      .catch((err) => {
        console.error('Taste removal error');
      });
  };

  return (
    <section className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-lg space-y-4 animate-fadeIn">
      <div>
        <h3 className="font-sans text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
          <span>✨</span> {t('thingsInCommonTitle')}
        </h3>
        <p className="text-[10px] text-slate-450 mt-0.5">{t('thingsInCommonSubtitle')}</p>
      </div>

      {/* Interest Categories tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-center">
        <button
          onClick={() => {
            setCommonCategory('food');
            addFloatingHearts();
          }}
          className={`py-1.5 rounded-lg cursor-pointer transition-all border-none ${commonCategory === 'food' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          🍔 {t('foodLabel')}
        </button>
        <button
          onClick={() => {
            setCommonCategory('music');
            addFloatingHearts();
          }}
          className={`py-1.5 rounded-lg cursor-pointer transition-all border-none ${commonCategory === 'music' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          🎵 {t('musicLabel')}
        </button>
        <button
          onClick={() => {
            setCommonCategory('outings');
            addFloatingHearts();
          }}
          className={`py-1.5 rounded-lg cursor-pointer transition-all border-none ${commonCategory === 'outings' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          ✈️ {t('outingsLabel')}
        </button>
        <button
          onClick={() => {
            setCommonCategory('hobbies');
            addFloatingHearts();
          }}
          className={`py-1.5 rounded-lg cursor-pointer transition-all border-none ${commonCategory === 'hobbies' ? 'bg-[#ff4d6d] text-white shadow-xs' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          🎨 {t('hobbiesLabel')}
        </button>
      </div>

      {/* Dynamic Category items */}
      <div className="bg-black/20 rounded-2xl p-3 border border-white/5 space-y-2.5 max-h-[160px] overflow-y-auto no-scrollbar">
        {commonItems.filter((item) => item.category === commonCategory).length === 0 ? (
          <p className="text-[10px] text-center text-slate-500 py-3 italic">
            {lang === 'es'
              ? 'Vacío... ¡Escribe tus gustos! Si coinciden con tu pareja, se hará Match automáticamente. ❤️'
              : "Empty... Write your tastes! If they match your partner's, they'll match automatically. ❤️"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {commonItems
              .filter((item) => item.category === commonCategory)
              .map((item) => {
                const isMatch = item.matched;
                const isPartnerItem = item.addedBy === 'partner';

                let bgClass = 'bg-white/5 border-white/5 text-slate-200 hover:bg-white/10';
                if (isMatch) {
                  bgClass = 'bg-rose-500/10 border-[#ff4d6d]/40 text-rose-200 hover:bg-rose-500/20';
                } else if (isPartnerItem) {
                  bgClass =
                    'bg-purple-500/5 border-purple-500/20 text-purple-200 hover:bg-purple-500/10';
                }

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-xs transition-colors ${bgClass}`}
                  >
                    <span
                      className={
                        isMatch
                          ? 'text-[#ff4d6d] animate-pulse'
                          : isPartnerItem
                            ? 'text-purple-400'
                            : 'text-zinc-500'
                      }
                    >
                      {isMatch ? '💖' : isPartnerItem ? '🔮' : '🤍'}
                    </span>
                    <span>{item.text}</span>

                    {isMatch && (
                      <span className="text-[8px] bg-rose-500/20 border border-[#ff4d6d]/50 text-[#ff4d6d] px-1 py-0.5 rounded-sm font-extrabold uppercase tracking-widest leading-none">
                        Match!
                      </span>
                    )}

                    {isPartnerItem && (
                      <span className="text-[8px] bg-purple-500/20 border border-purple-400/40 text-purple-300 px-1 py-0.5 rounded-sm font-bold uppercase tracking-wider leading-none">
                        {lang === 'es' ? 'Su gusto' : 'Their taste'}
                      </span>
                    )}

                    {isPartnerItem ? (
                      <button
                        type="button"
                        onClick={() => handleAddCommonItem(item.text)}
                        title={
                          lang === 'es'
                            ? '¡A mí también me gusta! (Agregar)'
                            : 'I like this too! (Add)'
                        }
                        className="text-purple-400 hover:text-[#ff4d6d] cursor-pointer text-xs ml-1 transition-colors font-black border-none bg-transparent"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveCommonItem(item.id)}
                        title={lang === 'es' ? 'Eliminar de mis gustos' : 'Remove from my tastes'}
                        className="text-slate-550 hover:text-red-400 cursor-pointer text-xs ml-1 transition-colors font-bold border-none bg-transparent"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick add items */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCommonItem}
          onChange={(e) => setNewCommonItem(e.target.value)}
          placeholder={t('addInCommonPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCommonItem();
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-550 focus:border-[#ff4d6d]/50"
        />
        <button
          type="button"
          onClick={() => handleAddCommonItem()}
          className="bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:shadow-md cursor-pointer border-none"
        >
          {t('addBtn')}
        </button>
      </div>
    </section>
  );
}
