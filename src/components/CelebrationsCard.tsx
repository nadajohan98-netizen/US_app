import React, { useState } from 'react';
import { CoupleState } from '../types';
import { Calendar, Trash2, Sparkles, Plus } from 'lucide-react';

interface CelebrationsCardProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: string;
  addFloatingHearts: () => void;
  currentUserEmail: string | null;
}

export default function CelebrationsCard({
  state,
  setState,
  t,
  lang,
  addFloatingHearts,
  currentUserEmail,
}: CelebrationsCardProps) {
  const [bdayInput, setBdayInput] = useState(state.meBirthday || '');
  const [customTitle, setCustomTitle] = useState('');
  const [customDate, setCustomDate] = useState(''); // MM-DD
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [savingBday, setSavingBday] = useState(false);

  // Helper to calculate days until a "MM-DD" date
  const getDaysUntil = (dateStr: string) => {
    try {
      const today = new Date();
      // Set to midnight for clean integer calculation
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();
      const parts = dateStr.split('-');
      if (parts.length !== 2) return 0;
      const [month, day] = parts.map(Number);

      let targetDate = new Date(currentYear, month - 1, day);
      if (targetDate.getTime() < today.getTime()) {
        targetDate = new Date(currentYear + 1, month - 1, day);
      }

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 0
        ? lang === 'es'
          ? '¡Hoy! 🥳'
          : 'Today! 🥳'
        : lang === 'es'
          ? `${diffDays} día${diffDays > 1 ? 's' : ''}`
          : `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Save birthday to server database
  const handleSaveBirthday = async () => {
    if (!currentUserEmail || !bdayInput) return;
    setSavingBday(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          birthday: bdayInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          meBirthday: data.user.birthday,
        }));
        addFloatingHearts();
      }
    } catch (err) {
      console.error('Failed to save birthday:');
    } finally {
      setSavingBday(false);
    }
  };

  // Add custom celebration date
  const handleAddCustomDate = async () => {
    if (!customTitle.trim() || !customDate) return;
    const parts = customDate.split('-'); // YYYY-MM-DD from standard HTML date input
    if (parts.length !== 3) return;

    const formattedDate = `${parts[1]}-${parts[2]}`; // convert to MM-DD
    const newCelebration = {
      id: 'custom_' + Date.now(),
      title: customTitle.trim(),
      date: formattedDate,
      type: 'custom' as const,
    };

    const updatedCelebrations = [...(state.celebrations || []), newCelebration];

    if (state.coupleId) {
      try {
        await fetch('/api/couple/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: state.coupleId,
            celebrations: updatedCelebrations,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    setState((prev) => ({
      ...prev,
      celebrations: updatedCelebrations,
    }));

    setCustomTitle('');
    setCustomDate('');
    setIsAddingCustom(false);
    addFloatingHearts();
  };

  // Delete a celebration date
  const handleDeleteCelebration = async (id: string) => {
    const updatedCelebrations = (state.celebrations || []).filter((c) => c.id !== id);
    if (state.coupleId) {
      try {
        await fetch('/api/couple/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: state.coupleId,
            celebrations: updatedCelebrations,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setState((prev) => ({
      ...prev,
      celebrations: updatedCelebrations,
    }));
  };

  // Preset core celebrations
  const defaultCelebrations = [
    {
      id: 'valentines',
      title: lang === 'es' ? 'Día de San Valentín 💖' : "Valentine's Day 💖",
      date: '02-14',
      type: 'holiday',
    },
    {
      id: 'christmas',
      title: lang === 'es' ? 'Navidad con mi Amor 🎄' : 'Christmas with my Love 🎄',
      date: '12-25',
      type: 'holiday',
    },
  ];

  const activeCelebrations = state.celebrations || defaultCelebrations;

  return (
    <div className="bg-[#121217]/90 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-[#ff4d6d]">
          <Calendar className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white tracking-wide">
            {lang === 'es' ? 'Efemérides y Fechas Especiales' : 'Celebrations & Special Dates'}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            {lang === 'es'
              ? 'Control de cumpleaños y aniversarios'
              : 'Track birthdays and shared anniversaries'}
          </p>
        </div>
      </div>

      {/* Birthday settings section */}
      {currentUserEmail && (
        <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-3 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {lang === 'es' ? '📅 Tu Cumpleaños' : '📅 Your Birthday'}
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={bdayInput}
              onChange={(e) => setBdayInput(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-rose-500"
            />
            <button
              onClick={handleSaveBirthday}
              disabled={savingBday}
              className="px-4 py-1.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 text-white rounded-xl text-xs font-black hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-sans border-none shrink-0"
            >
              {savingBday ? '...' : lang === 'es' ? 'Guardar' : 'Save'}
            </button>
          </div>
          {state.meBirthday && (
            <p className="text-[9px] text-[#ff4d6d] font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              {lang === 'es'
                ? `Cumpleaños registrado: ${state.meBirthday}`
                : `Birthday registered: ${state.meBirthday}`}
            </p>
          )}
        </div>
      )}

      {/* Celebrations Grid List */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            {lang === 'es' ? 'Cuenta Regresiva' : 'Countdowns'}
          </span>
          <button
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="text-[9px] font-bold text-[#ff4d6d] hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            {lang === 'es' ? 'Agregar fecha' : 'Add custom date'}
          </button>
        </div>

        {isAddingCustom && (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block">
                {lang === 'es' ? 'Nombre del Evento' : 'Event Name'}
              </span>
              <input
                type="text"
                placeholder={
                  lang === 'es'
                    ? 'Nuestra primera cita, aniversario, etc.'
                    : 'First date, wedding, etc.'
                }
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block">
                {lang === 'es' ? 'Fecha' : 'Date'}
              </span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1.5">
              <button
                onClick={() => setIsAddingCustom(false)}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold rounded-xl border-none cursor-pointer"
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleAddCustomDate}
                disabled={!customTitle.trim() || !customDate}
                className="flex-1 py-1.5 bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white text-xs font-black rounded-xl border-none cursor-pointer"
              >
                {lang === 'es' ? 'Crear' : 'Create'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {activeCelebrations.map((cel) => {
            const daysRemaining = getDaysUntil(cel.date);
            const isToday = daysRemaining === (lang === 'es' ? '¡Hoy! 🥳' : 'Today! 🥳');
            return (
              <div
                key={cel.id}
                className={`p-3 rounded-2xl border flex flex-col justify-between transition-all relative group ${
                  isToday
                    ? 'bg-gradient-to-br from-pink-900/30 to-rose-900/20 border-[#ff4d6d]/40 shadow-md'
                    : 'bg-stone-900/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="space-y-1 text-left">
                  <div className="flex gap-1 items-start justify-between">
                    <p
                      className={`text-[10px] font-bold line-clamp-2 leading-tight ${isToday ? 'text-[#ff4d6d]' : 'text-slate-100'}`}
                    >
                      {cel.title}
                    </p>
                    {cel.type === 'custom' && (
                      <button
                        onClick={() => handleDeleteCelebration(cel.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/5 rounded text-zinc-500 hover:text-red-500 border-none bg-transparent cursor-pointer shrink-0"
                        title={lang === 'es' ? 'Eliminar fecha' : 'Delete date'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[8px] font-mono text-zinc-400 tracking-wider">
                    {cel.date.split('-').reverse().join('/')}
                  </p>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[8px] uppercase tracking-widest text-[#ff4d6d] font-serif font-black">
                    {lang === 'es' ? 'Faltan' : 'In'}
                  </span>
                  <p
                    className={`text-[13px] font-black tracking-tight ${isToday ? 'text-pink-400 animate-bounce' : 'text-white'}`}
                  >
                    {daysRemaining}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
