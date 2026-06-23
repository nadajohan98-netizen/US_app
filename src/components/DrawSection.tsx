import React, { useState, useEffect, useRef } from 'react';
import { CoupleState, LanguageCode } from '../types';
import { Brush, Trash2, Send } from 'lucide-react';

interface DrawSectionProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  addFloatingHearts: () => void;
  onInteract?: (inc: number) => void;
}

export default function DrawSection({
  state,
  setState,
  t,
  lang,
  addFloatingHearts,
  onInteract,
}: DrawSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [painting, setPainting] = useState(false);
  const [brushColor, setBrushColor] = useState('#b60e3d');
  const [brushSize, setBrushSize] = useState(6);
  const [partnerActive, setPartnerActive] = useState(true);
  const [canvasFeedback, setCanvasFeedback] = useState<string | null>(null);
  const [lockscreenSnapshot, setLockscreenSnapshot] = useState<string | null>(null);
  const [showLockScreenMock, setShowLockScreenMock] = useState(false);

  const colors = [
    { code: '#b60e3d', name: 'Love Red' },
    { code: '#9b4052', name: 'Cozy Rose' },
    { code: '#fe90a2', name: 'Sweet Pink' },
    { code: '#63595c', name: 'Warm Gray' },
    { code: '#ffb2b8', name: 'Soft Coral' },
    { code: '#ffffff', name: 'Canvas White' },
  ];

  const stickers = ['❤️', '💋', '✨', '🌸', '🥰', '🐱', '💭'];

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Periodically flag the partner is interactive
    const partnerActiveInterval = setInterval(() => {
      setPartnerActive((prev) => !prev);
    }, 4500);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(partnerActiveInterval);
    };
  }, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get current design bounding rect to adapt sizes elegantly without stretching
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw background texture, a soft cozy watermark
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { y } = getCoordinates(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    setPainting(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!painting) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;

    const { y } = getCoordinates(e.nativeEvent);
    ctx.lineTo(y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setPainting(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasFeedback(null);
  };

  // Stamp sticker on random or center area of the drawing pad
  const stampSticker = (sticker: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    addFloatingHearts();

    // Place sticker in random centered area
    const x = canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4);
    const y = canvas.height / 2 + (Math.random() - 0.5) * (canvas.height * 0.4);

    ctx.font = '48px sans-serif';
    ctx.fillText(sticker, y);

    const alertMsg = t('sendStickerAlert').replace('{sticker}', sticker);
    setCanvasFeedback(alertMsg);

    const stickerIncrement = 0.5;
    setState((prev) => ({
      ...prev,
      warmth: Math.min(100, Number((prev.warmth + stickerIncrement).toFixed(1))),
    }));
    if (onInteract) onInteract(stickerIncrement);

    setTimeout(() => {
      setCanvasFeedback(null);
    }, 3000);
  };

  // Triggers sending drawing alerts
  const handleSendDrawing = () => {
    setCanvasFeedback(t('drawingSent'));
    addFloatingHearts();
    const drawingIncrement = 1.5;
    setState((prev) => ({
      ...prev,
      warmth: Math.min(100, Number((prev.warmth + drawingIncrement).toFixed(1))),
    }));
    if (onInteract) onInteract(drawingIncrement);
    setTimeout(() => {
      setCanvasFeedback(null);
      clearCanvas();
    }, 4000);
  };

  const handleSendToLockscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setLockscreenSnapshot(url);
    setShowLockScreenMock(true);
    addFloatingHearts();
    const alertText =
      lang === 'es'
        ? `¡Dibujo sincronizado en la pantalla de bloqueo de ${state.partnerName}! 📱🔒`
        : lang === 'en'
          ? `Drawing synced to ${state.partnerName}'s lockscreen! 📱🔒`
          : `Desenho enviado para a tela de bloqueio de ${state.partnerName}! 📱🔒`;
    setCanvasFeedback(alertText);
    const lockscreenIncrement = 1.5;
    setState((prev) => ({
      ...prev,
      warmth: Math.min(100, Number((prev.warmth + lockscreenIncrement).toFixed(1))),
    }));
    if (onInteract) onInteract(lockscreenIncrement);
    setTimeout(() => {
      setCanvasFeedback(null);
    }, 4000);
  };

  // Simulated partner drawing heartbeat
  const simulatePartnerDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Drawing a tiny heart path
    const startX = canvas.width * 0.35 + Math.random() * (canvas.width * 0.3);
    const startY = canvas.height * 0.3 + Math.random() * (canvas.height * 0.3);

    ctx.strokeStyle = '#9b4052';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    // Heart coordinates formulat,
    let t = 0;
    const drawHeartStep = () => {
      if (t > 2 * Math.PI) {
        ctx.closePath();
        addFloatingHearts();
        return;
      }

      const x = startX + 10 * (16 * Math.pow(Math.sin(t), 3));
      const y =
        startY -
        10 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      if (t === 0) {
        ctx.moveTo(y);
      } else {
        ctx.lineTo(y);
        ctx.stroke();
      }

      t += 0.15;
      setTimeout(drawHeartStep, 50);
    };

    drawHeartStep();
  };

  return (
    <div className="space-y-4 pb-12 flex flex-col h-[calc(100vh-160px)]">
      {/* Partner Sketching Overlay badge */}
      <div className="flex justify-between items-center bg-white/95 border border-rose-100 rounded-full px-4 py-2 mt-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-250 bg-black flex items-center justify-center">
            {state.partnerAvatar ? (
              <img
                src={state.partnerAvatar}
                alt="Partner"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-black text-[8px] text-zinc-500 font-bold flex items-center justify-center">
                N/A
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-rose-950 leading-tight">
              {t('alexIsSketching').replace('{partner}', state.partnerName)}
            </h4>
            <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">
              ● {t('activeNow')}
            </span>
          </div>
        </div>

        {partnerActive && (
          <button
            onClick={simulatePartnerDrawing}
            className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-3 py-1 rounded-full animate-pulse tracking-wide uppercase transition-all"
          >
            {lang === 'es'
              ? 'Ver trazos de pareja'
              : lang === 'en'
                ? 'See partner draw'
                : 'Ver desenhos'}
          </button>
        )}
      </div>

      {canvasFeedback && (
        <div className="bg-rose-900/90 text-white text-xs font-semibold py-2 px-4 rounded-xl text-center shadow-md animate-pulse">
          {canvasFeedback}
        </div>
      )}

      {/* Drawing Pad Area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[260px] bg-rose-50/20 backdrop-blur-md rounded-3xl border-2 border-dashed border-rose-200 relative overflow-hidden shadow-inner flex items-center justify-center cursor-crosshair"
      >
        {/* Watercolor cozy background sketch overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-10">
          <img
            className="w-full h-full object-cover filter grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0mN2-uY3mq3M3JBmUmoTwtv-Cbw8GEHu8FIIwbUDoCyUpVk8uFKI7bPTxhZcuXkAZPdCkAccopDZE5OcawqnzMsIhKu7hMx4ETfh4WBCEjr1y_e7xuf3f5cU4OXFk8ISACAhyTIq7GdMSxHHMzAhcliX7NVyzJxFSvZLllRRkoO4z-tY2jAltBkLzXRD5L6qSKV_rcdxVpWNT0-Bp3fwLrOULbOttPqzl3JI4_5fGJ4PfL2_36I09vPb2dHSI4mJ60XeK9lbrVaLX"
            alt="Heart watermark background"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Real drawing HTML5 canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="absolute inset-0 z-10 w-full h-full touch-none"
        />
      </div>

      {/* toolbar widgets */}
      <footer className="bg-white rounded-3xl py-3 px-4 border border-rose-100 shadow-sm shrink-0 space-y-3">
        {/* Colors swatches + Stickers slider drawer */}
        <div className="flex justify-between items-center gap-4 overflow-x-auto no-scrollbar">
          {/* Color Pallet */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-rose-100 shrink-0">
            {colors.map((color) => (
              <button
                key={color.code}
                onClick={() => setBrushColor(color.code)}
                className={`w-7 h-7 rounded-full transition-all border ${
                  brushColor === color.code ? 'scale-115 ring-2 ring-rose-500 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor: color.code,
                  borderColor: color.code === '#ffffff' ? '#e2bec0' : color.code,
                }}
                title={color.name}
              />
            ))}
          </div>

          {/* Sticker stamping panel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {stickers.map((stk) => (
              <button
                key={stk}
                onClick={() => stampSticker(stk)}
                className="w-9 h-9 rounded-xl bg-rose-50/50 flex items-center justify-center text-lg hover:scale-115 active:scale-95 transition-transform shrink-0 cursor-pointer"
              >
                {stk}
              </button>
            ))}
          </div>
        </div>

        {/* Actions slide and Send draw */}
        <div className="flex items-center gap-2.5 justify-between pt-1 overflow-x-auto no-scrollbar">
          {/* Delete canvas */}
          <button
            onClick={clearCanvas}
            className="p-2.5 rounded-full text-rose-500 hover:bg-rose-50 active:scale-90 transition-all shrink-0 border border-rose-100 cursor-pointer"
            title={t('clearBtn')}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Range Slider for thickness */}
          <div className="flex-1 min-w-[90px] max-w-[140px] flex items-center bg-rose-50/80 rounded-full px-2.5 py-1.5 gap-1.5 border border-rose-150">
            <Brush className="w-3.5 h-3.5 text-rose-600" />
            <input
              type="range"
              min="2"
              max="18"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1 bg-rose-200 accent-rose-600 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sync to Lockscreen */}
            <button
              onClick={handleSendToLockscreen}
              className="bg-neutral-900 hover:bg-neutral-800 text-slate-100 font-bold text-[10px] sm:text-xs py-2 px-4 rounded-full border border-white/10 hover:shadow-md transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
            >
              📱 {t('sendToLockscreen')}
            </button>

            {/* Sync / Send Drawings */}
            <button
              onClick={handleSendDrawing}
              className="bg-[#ff4d6d] hover:bg-rose-600 text-white font-bold text-[10px] sm:text-xs py-2 px-5 rounded-full hover:shadow-md transition-all flex items-center gap-1 uppercase tracking-wider scale-102 cursor-pointer outline-none"
            >
              {t('sendBtn')} <Send className="w-3 h-3 fill-white" />
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Smartphone Lock Screen Mockup */}
      {showLockScreenMock && (
        <section className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 animate-fade-in shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="font-sans text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <span>📱</span> {t('lockscreenWidget')}
            </h4>
            <button
              onClick={() => setShowLockScreenMock(false)}
              className="text-[10px] text-slate-400 hover:text-white font-extrabold cursor-pointer"
            >
              {lang === 'es' ? 'Cerrar' : 'Close'} ×
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            {/* Phone Chassis Mockup */}
            <div className="relative w-64 h-96 rounded-[40px] border-8 border-neutral-800 bg-[#0c0c0e] shadow-2xl overflow-hidden flex flex-col justify-between p-4 relative">
              {/* Ear Speaker Punch hole indicator */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-stone-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-900/40 ml-1.5" />
              </div>

              {/* Lockscreen Background theme */}
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#ff4d6d]/20 via-[#1b1022] to-neutral-950 pointer-events-none" />

              {/* Lockscreen Date / Clock */}
              <div className="text-center mt-6 z-10 space-y-0.5">
                <p className="text-[9px] text-rose-300 tracking-widest font-mono font-bold uppercase">
                  {lang === 'es' ? 'Domingo, 24 Oct' : 'Sunday, Oct 24'}
                </p>
                <h3 className="text-3xl font-serif font-black text-white drop-shadow-md leading-none">
                  22:14
                </h3>
                <p className="text-[8px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full inline-block">
                  🔒 {lang === 'es' ? 'Conexión Segura P2P' : 'Secure P2P Connection'}
                </p>
              </div>

              {/* Overlayed Transparent Canvas drawing snapshot */}
              <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                {lockscreenSnapshot ? (
                  <img
                    src={lockscreenSnapshot}
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,77,109,0.7)] mix-blend-screen animate-pulse-soft"
                    alt="Lockscreen drawing thumbnail"
                  />
                ) : (
                  <p className="text-[10px] text-slate-500 italic text-center">
                    {lang === 'es' ? 'Sin dibujos recientes' : 'No recent drawings'}
                  </p>
                )}
              </div>

              {/* iPhone unlock swipe line */}
              <div className="w-full flex flex-col items-center z-20 space-y-1 mt-auto">
                {/* Floating Love message banner */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10 w-full text-center">
                  <p className="text-[8px] text-slate-205 leading-tight font-sans">
                    <span className="text-[#ff4d6d] font-bold">♥</span>{' '}
                    {lang === 'es' ? 'Dibujo íntimo de' : 'Intimate drawing by'}{' '}
                    {state.meName || 'Johan'}
                  </p>
                </div>

                <div className="w-1/3 h-1 bg-white/70 rounded-full mt-2" />
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-3 italic max-w-sm">
              {lang === 'es' ? (
                <>
                  * El dibujo aparece de inmediato en la pantalla de bloqueo de{' '}
                  {state.partnerName || 'Alex'} resguardando la privacidad de ambos en todo momento.
                </>
              ) : (
                <>
                  * The drawing appears instantly on {state.partnerName || 'Alex'}&apos;s lock
                  screen while protecting both of your privacy at all times.
                </>
              )}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
