import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CoupleState, LanguageCode } from '../types';
import { uploadDataUrl } from '../storage';

interface LoveMailboxProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  currentUserEmail: string | null;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;
  onInteract?: (inc: number) => void;
}

export default function LoveMailbox({
  state,
  setState,
  t,
  lang,
  currentUserEmail,
  addFloatingHearts,
  showTempAlert,
  onInteract
}: LoveMailboxProps) {
  // Letters & Gifts State
  const [giftTab, setGiftTab] = useState<'letters' | 'gifts'>('letters');
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [letterPaper, setLetterPaper] = useState('parchment');

  const [giftTitle, setGiftTitle] = useState('');
  const [giftDesc, setGiftDesc] = useState('');
  const [giftImage, setGiftImage] = useState('');
  const [giftBox, setGiftBox] = useState('red');

  const handleSendLetter = () => {
    if (!letterTitle.trim() || !letterContent.trim()) {
      showTempAlert(t('mbLetterValidation'));
      return;
    }
    const newLetter = {
      id: String(Date.now()),
      sender: 'me' as const,
      title: letterTitle.trim(),
      content: letterContent.trim(),
      paperStyle: letterPaper,
      timestamp: new Date().toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const incrementLetter = 3.0;
    setState((prev) => ({
      ...prev,
      letters: [...(prev.letters || []), newLetter],
      warmth: Math.min(100, Number(((prev.warmth || 50) + incrementLetter).toFixed(1))),
    }));
    if (onInteract) onInteract(incrementLetter);
    setLetterTitle('');
    setLetterContent('');
    showTempAlert(t('mbLetterSaved'));
    addFloatingHearts();
  };

  const handleSendGift = async () => {
    if (!giftTitle.trim() || !giftDesc.trim()) {
      showTempAlert(t('mbGiftValidation'));
      return;
    }
    // Upload inline base64 images to Storage so only a URL is kept in state/localStorage.
    let image = giftImage;
    if (image.startsWith('data:')) {
      image = await uploadDataUrl( 'gifts');
    }
    const newGift = {
      id: String(Date.now()),
      sender: 'me' as const,
      title: giftTitle.trim(),
      desc: giftDesc.trim(), // Storage URL (or external URL)
      boxStyle: giftBox,
      timestamp: new Date().toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      unwrapped: false,
    };
    const incrementGift = 4.0;
    setState((prev) => ({
      ...prev,
      gifts: [...(prev.gifts || []), newGift],
      warmth: Math.min(100, Number(((prev.warmth || 50) + incrementGift).toFixed(1))),
    }));
    if (onInteract) onInteract(incrementGift);
    setGiftTitle('');
    setGiftDesc('');
    setGiftImage('');
    showTempAlert(t('mbGiftSent'));
    for (let i = 0; i < 5; i++) {
      setTimeout(addFloatingHearts, i * 150);
    }
  };

  const handleUnwrapGift = (giftId: string) => {
    setState((prev) => ({
      ...prev,
      gifts: (prev.gifts || []).map((g) => (g.id === giftId ? { ...g, unwrapped: true } : g)),
    }));
    showTempAlert(t('mbGiftOpened'));
    for (let i = 0; i < 6; i++) {
      setTimeout(addFloatingHearts, i * 150);
    }
  };

  return (
    <section className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-lg space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sans text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
            <span>💌</span> {t('mbTitle')}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">{t('mbSubtitle')}</p>
        </div>
        <span className="text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-1 bg-pink-500/10 text-[#ff4d6d] border border-[#ff4d6d]/20 rounded-full">
          {t('mbInteractive')}
        </span>
      </div>

      {/* Inner subtabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5 text-[11px] font-bold text-center">
        <button
          type="button"
          onClick={() => setGiftTab('letters')}
          className={`py-2 rounded-lg cursor-pointer transition-all border-none ${giftTab === 'letters' ? 'bg-[#ff4d6d] text-white shadow-xs font-black' : 'text-zinc-400 hover:text-white bg-transparent'}`}
        >
          ✍️ {t('mbTabLetters').replace('✍️ ', '')}
        </button>
        <button
          type="button"
          onClick={() => setGiftTab('gifts')}
          className={`py-2 rounded-lg cursor-pointer transition-all border-none ${giftTab === 'gifts' ? 'bg-[#ff4d6d] text-white shadow-xs font-black' : 'text-zinc-400 hover:text-white bg-transparent'}`}
        >
          🎁 {t('mbTabGifts').replace('🎁 ', '')}
        </button>
      </div>

      {/* SUBTAB 1: LETTERS */}
      {giftTab === 'letters' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* List of letters */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {!state.letters || state.letters.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl bg-black/20">
                <span className="text-2xl text-zinc-600 block">📭</span>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">{t('mbEmptyLetters')}</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">{t('mbEmptyLettersHint')}</p>
              </div>
            ) : (
              state.letters.map((letter) => {
                const isMe = letter.sender === 'me';
                const paperStyles: Record<string, string> = {
                  parchment: 'bg-amber-50 text-amber-950 border-amber-200 font-serif',
                  midnight: 'bg-slate-950 text-slate-100 border-indigo-950 font-mono',
                  rose: 'bg-rose-50 text-rose-950 border-rose-200 font-sans',
                  minimal: 'bg-stone-900 text-zinc-100 border-zinc-800 font-sans',
                };
                return (
                  <div
                    key={letter.id}
                    className={`p-3.5 rounded-2xl border shadow-md relative ${paperStyles[letter.paperStyle] || paperStyles.minimal}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 className="text-xs font-black tracking-wide">{letter.title}</h4>
                        <p className="text-[8px] opacity-60 leading-none mt-0.5">
                          {isMe
                            ? t('mbFromYou')
                            : t('mbWrittenBy').replace(
                                '{partner}',
                                state.partnerName || t('partner')
                              )}{' '}
                          • {letter.timestamp}
                        </p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 border border-black/10 font-bold">
                        {letter.paperStyle}
                      </span>
                    </div>
                    <p className="text-[11px] whitespace-pre-wrap leading-relaxed opacity-90 italic">
                      {letter.content}
                    </p>
                    {/* Signature stamp */}
                    <div className="text-right mt-2 text-[9px] font-bold tracking-tight text-rose-500 inline-block px-1 rounded-sm float-right">
                      💝 {t('mbSignedBy')}{' '}
                      {isMe ? state.meName || t('me') : state.partnerName || t('partner')}
                    </div>
                    <div className="clear-both" />
                  </div>
                );
              })
            )}
          </div>

          {/* Compose letter form */}
          <div className="border-t border-white/5 pt-3 space-y-3 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff4d6d]">
              {t('mbWriteNew')}
            </h4>

            <div className="space-y-2">
              <input
                type="text"
                placeholder={t('mbLetterTitlePlaceholder')}
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-[#ff4d6d]"
              />

              <textarea
                placeholder={t('mbLetterContentPlaceholder')}
                rows={3}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-[#ff4d6d] resize-none"
              />

              {/* Style Selector */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  {t('mbPaperStyle')}
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-black">
                  {[
                    { code: 'parchment', name: t('mbPaperParchment') },
                    { code: 'midnight', name: t('mbPaperMidnight') },
                    { code: 'rose', name: t('mbPaperRose') },
                    { code: 'minimal', name: t('mbPaperSlate') },
                  ].map((st) => (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => setLetterPaper(st.code)}
                      className={`py-1 rounded border cursor-pointer transition-all ${letterPaper === st.code ? 'border-pink-500 bg-pink-500/15 text-white' : 'border-zinc-800 text-zinc-550 bg-black/20 hover:text-zinc-350 bg-transparent'}`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendLetter}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-500/90 hover:to-rose-600/90 text-white font-sans text-xs font-black rounded-xl transition-all shadow-md active:scale-98 cursor-pointer uppercase tracking-widest border-none"
              >
                {t('mbConfirmLetter')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GIFTS */}
      {giftTab === 'gifts' && (
        <div className="space-y-4 animate-fadeIn">
          {/* List of gifts */}
          <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {!state.gifts || state.gifts.length === 0 ? (
              <div className="col-span-2 text-center py-6 border border-dashed border-zinc-800 rounded-2xl bg-black/20">
                <span className="text-2xl block">🎁</span>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">{t('mbEmptyGifts')}</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">{t('mbEmptyGiftsHint')}</p>
              </div>
            ) : (
              state.gifts.map((gift) => {
                const isMe = gift.sender === 'me';
                const boxStyles: Record<string, string> = {
                  gold: 'from-amber-400 to-yellow-600 border-yellow-400 shadow-yellow-500/10',
                  red: 'from-red-500 to-rose-700 border-red-500 shadow-rose-500/10',
                  galaxy:
                    'from-indigo-600 via-purple-600 to-pink-500 border-purple-500 shadow-purple-500/10',
                };
                return (
                  <div
                    key={gift.id}
                    className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-2.5 flex flex-col justify-between shadow-lg relative overflow-hidden text-left"
                  >
                    {!gift.unwrapped ? (
                      /* WRAPPED GIFT BOX */
                      <div className="flex flex-col items-center justify-center py-4 space-y-2 text-center">
                        <button
                          type="button"
                          className={`w-12 h-12 bg-gradient-to-br ${boxStyles[gift.boxStyle] || boxStyles.red} rounded-xl border flex items-center justify-center animate-bounce shadow-lg cursor-pointer hover:scale-[1.05] transition-all border-none`}
                          style={{ animationDuration: '3s' }}
                          onClick={() => handleUnwrapGift(gift.id)}
                        >
                          <span className="text-xl">🎁</span>
                        </button>
                        <div>
                          <p className="text-[10px] font-black text-zinc-200 tracking-wide truncate max-w-[124px]">
                            {gift.title}
                          </p>
                          <p className="text-[7px] text-zinc-500 leading-none mt-0.5">
                            {t('mbFromShort')}{' '}
                            {isMe ? t('mbYou') : state.partnerName || t('partner')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnwrapGift(gift.id)}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-md px-2.5 py-0.5 text-[8px] font-extrabold uppercase transition-all tracking-wider cursor-pointer"
                        >
                          {t('mbOpenGift')}
                        </button>
                      </div>
                    ) : (
                      /* UNWRAPPED SURPRISE CONTENT */
                      <div className="space-y-1.5 animate-fadeIn flex flex-col h-full justify-between">
                        <div className="space-y-1">
                          {gift.image && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden border border-zinc-900 bg-black relative">
                              <img
                                src={gift.image}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1 right-1 text-[7px] uppercase font-extrabold tracking-widest bg-emerald-500 text-white px-1 rounded">
                                {t('mbRevealed')}
                              </span>
                            </div>
                          )}
                          <div>
                            <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-wide leading-none">
                              {gift.title}
                            </h5>
                            <p className="text-[9px] text-zinc-350 italic font-medium leading-tight mt-1">
                              &quot;{gift.desc}&quot;
                            </p>
                          </div>
                        </div>
                        <p className="text-[7px] text-zinc-650 pt-1 border-t border-white/5 text-right font-mono mt-1 w-full">
                          {gift.timestamp}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Send gift form */}
          <div className="border-t border-white/5 pt-3 space-y-3 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff4d6d]">
              {t('mbCreateGift')}
            </h4>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder={t('mbGiftTitlePlaceholder')}
                value={giftTitle}
                onChange={(e) => setGiftTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-[#ff4d6d]"
              />

              <input
                type="text"
                placeholder={t('mbGiftDescPlaceholder')}
                value={giftDesc}
                onChange={(e) => setGiftDesc(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-[#ff4d6d]"
              />

              {/* UPLOAD PHOTO FILE */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  {t('mbGiftPhotoLabel')}
                </span>
                <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-zinc-805 hover:border-[#ff4d6d]/50 bg-[#0e0e11] rounded-xl cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center py-1">
                    <Plus className="w-4 h-4 text-zinc-550 group-hover:text-pink-500 mb-0.5" />
                    <p className="text-[8px] text-zinc-400 font-bold">{t('mbGiftPhotoSelect')}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setGiftImage(event.target.result as string);
                            showTempAlert(t('mbGiftImageAttached'));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {giftImage && (
                  <div className="flex items-center gap-1.5 bg-pink-500/10 border border-[#ff4d6d]/20 px-2.5 py-1 rounded-xl">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                    <span className="text-[8px] text-slate-300 font-serif truncate flex-1 leading-none">
                      {t('mbGiftImageSelected')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGiftImage('')}
                      className="text-[8px] text-red-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                    >
                      {t('mbRemove')}
                    </button>
                  </div>
                )}
              </div>

              {/* Box selection */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  {t('mbBoxStyle')}
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black">
                  {[
                    { code: 'red', name: t('mbBoxRed') },
                    { code: 'gold', name: t('mbBoxGold') },
                    { code: 'galaxy', name: t('mbBoxGalaxy') },
                  ].map((box) => (
                    <button
                      key={box.code}
                      type="button"
                      onClick={() => setGiftBox(box.code)}
                      className={`py-1.5 rounded transition-all cursor-pointer border bg-transparent ${giftBox === box.code ? 'border-yellow-400 bg-yellow-400/10 text-white' : 'border-zinc-850 text-zinc-550 hover:text-zinc-250'}`}
                    >
                      {box.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendGift}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-[#ff4d6d] text-white font-sans text-xs font-black rounded-xl transition-all shadow-md active:scale-98 cursor-pointer uppercase tracking-widest border-none"
              >
                {t('mbConfirmGift')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

