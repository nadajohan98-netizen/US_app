import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CoupleState, QuizQuestion, TruthDareCard, LanguageCode } from '../types';
import { Trophy, Swords, Users, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface GamesSectionProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  currentUserEmail: string | null;
  addFloatingHearts: () => void;
  onInteract?: (inc: number) => void;
}

export default function GamesSection({
  state,
  setState,
  t,
  lang,
  currentUserEmail,
  addFloatingHearts,
  onInteract,
}: GamesSectionProps) {
  // Game selectors matching our new additions
  const [activeGame, setActiveGame] = useState<
    'hub' | 'quiz' | 'truth-dare' | 'board' | 'picantes' | 'raspa' | 'linea-tiempo'
  >('hub');

  // Interactive Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // New games: Card Draw "Preguntas Picantes" list state
  const [picanteIdx, setPicanteIdx] = useState(() => Math.floor(Math.random() * 10));

  // Extended pool of emoji-free scratch coupons
  const COUPONS_POOL = useMemo(
    () => [
      {
        title: lang === 'es' ? 'Cena a domicilio' : 'Surprise Dinner',
        desc:
          lang === 'es'
            ? 'Tu pareja elige lo que quiere cenar de cualquier lugar y tú lo pides de sorpresa.'
            : 'Order free delivery mystery meal for your partner!',
      },
      {
        title: lang === 'es' ? 'Masaje relajante' : 'Relaxing Massage',
        desc:
          lang === 'es'
            ? 'Media hora entera de mimos ininterrumpidos de forma física o virtual.'
            : 'A cozy 30-minute massage coupon.',
      },
      {
        title: lang === 'es' ? 'Poder de veto absoluto' : 'Absolute veto power',
        desc:
          lang === 'es'
            ? 'Eliges qué película o serie ver hoy y tu pareja no puede emitir ninguna queja.'
            : 'Choose the movie tonight with zero objections.',
      },
      {
        title: lang === 'es' ? 'Nota de voz secreta' : 'Secret voice note',
        desc:
          lang === 'es'
            ? 'Una nota de voz cariñosa de dos minutos explicando por qué te amo tanto.'
            : 'A 2-minute heartwarming audio confession.',
      },
      {
        title: lang === 'es' ? 'Desayuno de reyes' : 'Breakfast in bed',
        desc:
          lang === 'es'
            ? 'Te encargarás de enviarle el desayuno listo para consumir directo a su puerta de sorpresa.'
            : 'Surprise breakfast delivered to your partner.',
      },
      {
        title: lang === 'es' ? 'Dedicatoria de playlist' : 'Custom Playlist',
        desc:
          lang === 'es'
            ? 'Te armaré una lista de reproducción personalizada explicando nuestra maravillosa historia.'
            : 'A customized multi-song dedication.',
      },
      {
        title: lang === 'es' ? 'Tarde de videojuegos' : 'Video game session',
        desc:
          lang === 'es'
            ? 'Tú eliges a qué jugamos hoy y prometo esforzarme en dejarme ganar.'
            : 'Partner chooses the game tonight.',
      },
      {
        title: lang === 'es' ? 'Carta manuscrita hermosa' : 'Handwritten letter',
        desc:
          lang === 'es'
            ? 'Una hermosa carta escrita de mi puño y letra expresando mis sentimientos más profundos.'
            : 'A physically mailed or photographed genuine handwritten letter.',
      },
      {
        title: lang === 'es' ? 'Café de la tarde sorpresa' : 'Coffee & dessert',
        desc:
          lang === 'es'
            ? 'Un café caliente y su postre favorito enviados directo a su ubicación.'
            : 'Surprise afternoon coffee and sweet treat.',
      },
      {
        title: lang === 'es' ? 'Diez halagos escritos' : 'Ten sweet compliments',
        desc:
          lang === 'es'
            ? 'Una lista escrita de diez cosas maravillosas que me fascinan de tu mente.'
            : 'A written list of 10 reasons your partner’s mind is awesome.',
      },
      {
        title: lang === 'es' ? 'Abrazo extendido' : 'Infinite hugs',
        desc:
          lang === 'es'
            ? 'Canjeable por una sesión extendida de abrazos románticos y caricias constantes.'
            : 'Redeemable for unlimited physical/virtual cozy hugs.',
      },
      {
        title: lang === 'es' ? 'Pase libre de tareas' : 'Chore voucher',
        desc:
          lang === 'es'
            ? 'Me encargaré de hacer un pendiente tuyo u organizarte la agenda hoy.'
            : 'I will do your chores or tasks today.',
      },
      {
        title: lang === 'es' ? 'Llamada hasta tarde' : 'Midnight deep chat',
        desc:
          lang === 'es'
            ? 'Una conversación telefónica nocturna para platicar de la vida sin interrupciones.'
            : 'No-interruption late night chat session.',
      },
      {
        title: lang === 'es' ? 'Selector de outfit' : 'Outfit chooser',
        desc:
          lang === 'es'
            ? 'Tú decides exactamente qué ropa me pondré para nuestra próxima videollamada.'
            : 'Choose what your partner wears on your next date.',
      },
      {
        title: lang === 'es' ? 'El deseo secreto' : 'Secret love wish',
        desc:
          lang === 'es'
            ? 'Un vale de amor canjeable por cualquier favor inocente que me pidas ahora.'
            : 'One harmless request fulfilled instantly.',
      },
      {
        title: lang === 'es' ? 'Día de darte la razón' : 'Agree-on-everything day',
        desc:
          lang === 'es'
            ? 'Prometo darte la razón en absolutamente todo lo que digas durante todo el día.'
            : 'I will politely agree with everything you say today.',
      },
    ],
    [lang]
  );

  const [activeCoupons, setActiveCoupons] = useState<{ title: string; desc: string }[]>(() => {
    return [...COUPONS_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
  });
  const [scratchedCoupons, setScratchedCoupons] = useState<Record<string, boolean>>({
    c1: false,
    c2: false,
    c3: false,
    c4: false,
  });

  // Extended pool of emoji-free relationship milestones
  const MILESTONES_POOL = useMemo(
    () => [
      {
        text:
          lang === 'es'
            ? 'El momento exacto en que nos hablamos por primera vez compartiendo timidez y risas.'
            : 'The exact second we first spoke to each other.',
        rank: 1,
      },
      {
        text:
          lang === 'es'
            ? 'Nuestra primera llamada de voz nocturna interminable que duró hasta el amanecer.'
            : 'Our first endless late-night phone call.',
        rank: 2,
      },
      {
        text:
          lang === 'es'
            ? 'Cuando decidimos darnos nuestra primera oportunidad romántica oficial.'
            : 'When we officially took our first romantic leap.',
        rank: 3,
      },
      {
        text:
          lang === 'es'
            ? 'Aquella canción inolvidable que nos dedicamos mutuamente con nerviosismo.'
            : 'That special song we dedicated with trembling hearts.',
        rank: 4,
      },
      {
        text:
          lang === 'es'
            ? 'La primera foto juntos que cargamos al álbum de recuerdos con cariño.'
            : 'The very first photo we saved together in our vault.',
        rank: 5,
      },
      {
        text:
          lang === 'es'
            ? 'La primera discusión pequeña que logramos superar hablando con paciencia.'
            : 'Our first minor arguments settled with deep patience.',
        rank: 6,
      },
      {
        text:
          lang === 'es'
            ? 'El instante en que por fin admitimos que queríamos pasar la vida entera juntos.'
            : 'The instant we realized we wanted to be with each other forever.',
        rank: 7,
      },
      {
        text:
          lang === 'es'
            ? 'La promesa sincera de cuidarnos incondicionalmente a pesar de la distancia física.'
            : 'Our sincere promise to protect each other despite physical miles.',
        rank: 8,
      },
      {
        text:
          lang === 'es'
            ? 'Cuando planeamos los primeros detalles ilusionantes de nuestro primer viaje formal.'
            : 'Planning key milestones for our first joint vacation trip.',
        rank: 9,
      },
      {
        text:
          lang === 'es'
            ? 'Cuando soñamos despiertos por primera vez con la decoración de nuestro futuro hogar.'
            : 'Dreaming about building and arranging our future home.',
        rank: 10,
      },
      {
        text:
          lang === 'es'
            ? 'La celebración de nuestra primera fecha importante como pareja oficial.'
            : 'Celebrating our very first romantic anniversary milestone.',
        rank: 11,
      },
      {
        text:
          lang === 'es'
            ? 'Aquel postre o cena sorpresa que nos regalamos de manera digital en un día gris.'
            : 'A surprise digital food delivery gift when one felt down.',
        rank: 12,
      },
    ],
    [lang]
  );

  const rollRandomMilestones = () => {
    const selected = [...MILESTONES_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
    const sorted = [...selected].sort((a, b) => a.rank - b.rank);
    return selected.map((item) => {
      const correctIdx = sorted.findIndex((s) => s.text === item.text);
      return {
        id: String(item.rank),
        text: item.text,
        correctOrderIndex: correctIdx,
      };
    });
  };

  // New games: Milestone timelines ordering puzzles
  const [milestonesOrder, setMilestonesOrder] = useState<
    { id: string; text: string; correctOrderIndex: number }[]
  >(() => {
    return rollRandomMilestones();
  });
  const [timelineDone, setTimelineDone] = useState(false);
  const [timelineCorrect, setTimelineCorrect] = useState<boolean | null>(null);

  const quizQuestionsLocal: Record<LanguageCode, QuizQuestion[]> = {
    es: [
      {
        id: 1,
        question: '¿Dónde fue nuestra primera cita?',
        options: ['Café / Restaurante', 'Parque / Aire libre', 'Cine / Teatro', 'Llamada virtual'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: '¿Quién es más probable que se quede dormido durante una película?',
        options: ['Yo', 'Mi Pareja', 'Ambos', 'Ninguno'],
        correctIndex: 1,
      },
      {
        id: 3,
        question: '¿Cuál es nuestro viaje de vacaciones soñado?',
        options: [
          'París (Romántico)',
          'Tokio (Aventura)',
          'El Caribe (Playa)',
          'Cabaña acogedora en los Alpes',
        ],
        correctIndex: 0,
      },
      {
        id: 4,
        question: '¿Cuál es nuestra comida reconfortante favorita por excelencia?',
        options: ['Pizza', 'Sushi', 'Hamburguesas', 'Postres dulces'],
        correctIndex: 0,
      },
      {
        id: 5,
        question: '¿Qué superpoder elegiríamos juntos?',
        options: [
          'Teletransportación (para vernos al instante)',
          'Leer la mente',
          'Viajar en el tiempo',
          'Volar',
        ],
        correctIndex: 0,
      },
    ],
    pt: [
      {
        id: 1,
        question: 'Onde foi o nosso primeiro encontro?',
        options: [
          'Café / Restaurante',
          'Parque / Ao ar livre',
          'Cinema / Teatro',
          'Chamada de vídeo',
        ],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'Quem tem mais probabilidade de dormir durante um filme?',
        options: ['Eu', 'Meu parceiro', 'Ambos', 'Nenhum'],
        correctIndex: 1,
      },
      {
        id: 3,
        question: 'Qual é a viagem de férias dos nossos sonhos?',
        options: [
          'Paris (Romântico)',
          'Tóquio (Aventura)',
          'Caribe (Praia)',
          'Cabana aconchegante nos Alpes',
        ],
        correctIndex: 0,
      },
      {
        id: 4,
        question: 'Qual é a nossa comida reconfortante favorita?',
        options: ['Pizza', 'Sushi', 'Hambúrguer', 'Sobremesas doces'],
        correctIndex: 0,
      },
      {
        id: 5,
        question: 'Que superpoder escolheríamos juntos?',
        options: [
          'Teletransporte (para nos vermos instantaneamente)',
          'Ler mentes',
          'Viagem no tempo',
          'Voar',
        ],
        correctIndex: 0,
      },
    ],
    en: [
      {
        id: 1,
        question: 'Where was our first date?',
        options: ['Cafe / Restaurant', 'Park / Outdoors', 'Cinema / Theatre', 'Virtual call'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'Who is more likely to fall asleep during a movie?',
        options: ['Me', 'My Partner', 'Both', 'Neither'],
        correctIndex: 1,
      },
      {
        id: 3,
        question: 'What is our dream joint vacation?',
        options: [
          'Paris / Romantic',
          'Tokyo / Adventure',
          'Caribbean / Beach Resort',
          'Cozy cabin in the Alps',
        ],
        correctIndex: 0,
      },
      {
        id: 4,
        question: 'What is our ultimate comfort food?',
        options: ['Pizza', 'Sushi', 'Burgers', 'Sweet desserts'],
        correctIndex: 0,
      },
      {
        id: 5,
        question: 'What superpower would we choose together?',
        options: [
          'Teleportation (to see each other instantly!)',
          'Mind reading',
          'Time travel',
          'Flight',
        ],
        correctIndex: 0,
      },
    ],
  };

  const quizQuestions = quizQuestionsLocal[lang] || quizQuestionsLocal['en'];

  // Truth or Dare localized questions
  const truthDareCardsLocal: Record<LanguageCode, TruthDareCard[]> = {
    es: [
      {
        id: '1',
        type: 'truth',
        text: '¿Cuál fue tu primera impresión real cuando me viste o conociste?',
      },
      {
        id: '2',
        type: 'truth',
        text: '¿Qué canción te recuerda más a nuestra relación y por qué?',
      },
      { id: '3', type: 'truth', text: '¿Qué pequeño hábito mío siempre te hace sonreír?' },
      {
        id: '4',
        type: 'truth',
        text: '¿Qué es lo que más extrañas de mí cuando no estamos juntos?',
      },
      {
        id: '5',
        type: 'dare',
        text: 'Envía una nota de voz divertida de 10 segundos diciendo tres razones raras por las que me amas.',
      },
      {
        id: '6',
        type: 'dare',
        text: 'Tómate una foto graciosa (selfie) justo ahora y envíasela a tu pareja.',
      },
      { id: '7', type: 'dare', text: 'Besa la pantalla tres veces pensando en mí.' },
      {
        id: '8',
        type: 'dare',
        text: "Escribe 'Te Amo' en un papel, tómale una foto y compártela aquí o por chat.",
      },
    ],
    en: [
      { id: '1', type: 'truth', text: 'What was your very first impression when you saw/met me?' },
      { id: '2', type: 'truth', text: 'What song reminds you of our relationship the most?' },
      { id: '3', type: 'truth', text: 'What tiny habit of mine always makes you smile?' },
      { id: '4', type: 'truth', text: 'What do you miss most about me when we are apart?' },
      {
        id: '5',
        type: 'dare',
        text: 'Send a 10-second funny voice note stating three weird reasons you love me.',
      },
      { id: '6', type: 'dare', text: 'Take a silly selfie right now and send it to your partner.' },
      { id: '7', type: 'dare', text: 'Kiss the screen three times while thinking of me.' },
      { id: '8', type: 'dare', text: "Write 'I Love You' on a paper, take a photo and share it." },
    ],
    pt: [
      {
        id: '1',
        type: 'truth',
        text: 'Qual foi a sua primeira impressão real quando me viu ou conheceu?',
      },
      {
        id: '2',
        type: 'truth',
        text: 'Qual música mais te lembra o nosso relacionamento e por quê?',
      },
      { id: '3', type: 'truth', text: 'Qual pequeno hábito meu sempre te faz sorrir?' },
      {
        id: '4',
        type: 'truth',
        text: 'O que você mais sente falta em mim quando estamos separados?',
      },
      {
        id: '5',
        type: 'dare',
        text: 'Envie uma nota de voz engraçada de 10 segundos dizendo três motivos estranhos pelos quais você me ama.',
      },
      {
        id: '6',
        type: 'dare',
        text: 'Tire uma selfie engraçada agora mesmo e mande para seu parceiro.',
      },
      { id: '7', type: 'dare', text: 'Beije a tela três vezes pensando em mim.' },
      {
        id: '8',
        type: 'dare',
        text: "Escreva 'Te Amo' em um papel, tire uma foto e compartilhe no chat.",
      },
    ],
  };

  const [currentCardId, setCurrentCardId] = useState<string>('1');
  const [currentCardType, setCurrentCardType] = useState<'truth' | 'dare'>('truth');

  const currentCardList = truthDareCardsLocal[lang] || truthDareCardsLocal['en'];
  const currentCardText =
    currentCardList.find((c) => c.id === currentCardId && c.type === currentCardType)?.text ||
    currentCardList[0]?.text ||
    'Question';

  // Tic-Tac-Love Board Game State (real-time 2-player via the backend)
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turnEmail, setTurnEmail] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<string | null>(null); // '❤️' | '✨' | 'draw' | null
  const [boardRound, setBoardRound] = useState(0);
  const [ticXEmail, setTicXEmail] = useState<string>(''); // who plays ❤️ (from server)
  const awardedRoundRef = useRef<number>(-1);

  const myEmail = (currentUserEmail || '').toLowerCase().trim();
  const ticPartnerEmail = (state.partnerEmail || '').toLowerCase().trim();
  const ticIsCoupled = !!state.coupleId && !!myEmail && !!ticPartnerEmail;
  const mySymbol = myEmail && myEmail === ticXEmail ? '❤️' : '✨';
  const isPlayerTurn = ticIsCoupled && turnEmail === myEmail && !winnerSide;
  const gameWinner: string | null = winnerSide
    ? winnerSide === 'draw'
      ? 'draw'
      : winnerSide === mySymbol
        ? 'me'
        : 'partner'
    : null;
  const boardFeedback = !ticIsCoupled
    ? lang === 'es'
      ? 'Vincúlate con tu pareja y que ambos abran el juego para jugar 💞'
      : 'Link with your partner and both open the game to play 💞'
    : winnerSide
      ? winnerSide === 'draw'
        ? t('drawState')
        : winnerSide === mySymbol
          ? t('winnerMe')
          : t('winnerPartner')
      : isPlayerTurn
        ? lang === 'es'
          ? '¡Es tu turno! 💖'
          : 'Your turn! 💖'
        : lang === 'es'
          ? `Esperando a ${state.partnerName || 'tu pareja'}... ✨`
          : `Waiting for ${state.partnerName || 'your partner'}... ✨`;

  const applyTicGame = (g: any) => {
    if (!g) return;
    setBoard(Array.isArray(g.board) ? g.board : Array(9).fill(null));
    setTurnEmail(g.turnEmail || null);
    setWinnerSide(g.winner || null);
    setBoardRound(typeof g.round === 'number' ? g.round : 0);
    if (g.xEmail) setTicXEmail(String(g.xEmail).toLowerCase().trim());
  };

  const startQuiz = () => {
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setQuizScore(null);
    setActiveGame('quiz');
  };

  const handleQuizAnswer = (optionIndex: number) => {
    const isMatch = optionIndex === quizQuestions[currentQuestionIndex].correctIndex;
    if (isMatch) addFloatingHearts();

    const answers = [...quizAnswers, optionIndex];
    setQuizAnswers(answers);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let matchingCount = 0;
      answers.forEach((ans, idx) => {
        if (ans === quizQuestions[idx].correctIndex) {
          matchingCount++;
        }
      });
      const finalPercentage = (matchingCount / quizQuestions.length) * 100;
      setQuizScore(finalPercentage);

      // Award points and add game logs
      const pointsToAward = Math.max(5, Math.round(finalPercentage / 5));
      const quizIncrement = 2.5;
      setState((prev) => ({
        ...prev,
        warmth: Math.min(100, Number((prev.warmth + quizIncrement).toFixed(1))),
        streak: prev.streak + 1,
        mePoints: (prev.mePoints || 0) + pointsToAward,
        partnerPoints: (prev.partnerPoints || 0) + pointsToAward,
      }));
      if (onInteract) onInteract(quizIncrement);
    }
  };

  const drawNewCard = (type?: 'truth' | 'dare') => {
    addFloatingHearts();
    const currentList = truthDareCardsLocal[lang] || truthDareCardsLocal['en'];
    const filtered = type ? currentList.filter((c) => c.type === type) : currentList;
    const randomCard = filtered[Math.floor(Math.random() * filtered.length)];
    if (randomCard) {
      setCurrentCardId(randomCard.id);
      setCurrentCardType(randomCard.type as 'truth' | 'dare');
    }
  };

  // Tic Tac Love logic — synced through the backend (poll while the board is open).
  useEffect(() => {
    if (activeGame !== 'board' || !ticIsCoupled) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/couple/tictactoe/state?email=${encodeURIComponent(myEmail)}`);
        if (!res.ok || cancelled) return;
        const { game } = await res.json();
        applyTicGame(game);
      } catch (err) {
        if (!cancelled) console.warn('TicTac poll failed:');
      }
    };
    poll();
    const timer = setInterval(poll, 1800);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame, ticIsCoupled, myEmail]);

  // Award points/warmth once per round, only on the winner's own device.
  useEffect(() => {
    if (!winnerSide || winnerSide === 'draw') return;
    if (awardedRoundRef.current === boardRound) return;
    awardedRoundRef.current = boardRound;
    if (winnerSide === mySymbol) {
      for (let i = 0; i < 5; i++) setTimeout(() => addFloatingHearts(), i * 120);
      const gameWinIncrement = 2.0;
      setState((prev) => ({
        ...prev,
        warmth: Math.min(100, Number((prev.warmth + gameWinIncrement).toFixed(1))),
        mePoints: (prev.mePoints || 0) + 10,
      }));
      if (onInteract) onInteract(gameWinIncrement);
    }
  }, [winnerSide, boardRound, mySymbol]);

  const handleCellClick = async (index: number) => {
    if (!ticIsCoupled || !isPlayerTurn || board[index] || winnerSide) return;
    // Optimistic local update for snappiness; the server is authoritative.
    const updated = [...board];
    updated[index] = mySymbol;
    setBoard(updated);
    addFloatingHearts();
    try {
      const res = await fetch('/api/couple/tictactoe/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      if (res.ok) {
        const { game } = await res.json();
        applyTicGame(game);
      }
    } catch (err) {
      console.warn('TicTac move failed:');
    }
  };

  const resetTicTac = async () => {
    if (!ticIsCoupled) return;
    awardedRoundRef.current = -1;
    try {
      const res = await fetch('/api/couple/tictactoe/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (res.ok) {
        const { game } = await res.json();
        applyTicGame(game);
      }
    } catch (err) {
      console.warn('TicTac reset failed:');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HUD Bar */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 mt-2">
        <span className="font-serif font-black text-[#ff4d6d] text-sm">Us Games Hub</span>
        <div className="text-xs bg-[#ff4d6d]/20 text-[#ff4d6d] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#ff4d6d]/30">
          <Trophy className="w-3.5 h-3.5" /> Leaderboard Active
        </div>
      </div>

      {activeGame === 'hub' && (
        <>
          {/* Welcome Intro */}
          <section className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{t('gamesHubTitle')}</h2>
            <p className="text-xs font-semibold text-slate-400">{t('gamesHubSubtitle')}</p>
          </section>

          {/* Primary Couple Quiz Card */}
          <section className="bg-white/5 rounded-3xl p-5 shadow-lg border border-white/10 relative overflow-hidden flex flex-col group">
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <span className="bg-[#ff4d6d]/20 text-[#ff4d6d] border border-[#ff4d6d]/30 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'es' ? 'MÁS POPULAR' : 'MOST POPULAR'}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">{t('coupleQuizTitle')}</h3>
              </div>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/10">
                <Users className="w-3.5 h-3.5 text-[#ff4d6d]" />{' '}
                {lang === 'es' ? 'Jugadores: 2' : 'Players: 2'}
              </span>
            </div>

            <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 relative z-10 bg-slate-900 border border-white/5">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3Oi9gKkwHX92sSnzFiUZHIXulo82sFoTrq0Sj7bQtlDH9XcQg5yYJLI27FjFhYwGLMi91WcZIB05NntIg3vHEDY786HMzIV1G0sknm17SsGUKcjdktLzDTeBVtJ-y32hJowhlzVS4i0DApJwRA3Prap0oYXV5cAnibr69iwhfbN9HoX2smn5TUtZj9Itd0zEl8RiNcugMMZ9na-EsGBKoU5cYKImj9ORkgvMSHIFST2igXtHsy490vovvPNSpO365Zj0OGwJ72qtG"
                alt="Couple quiz"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-xs font-semibold text-slate-300 mb-4 z-10">{t('coupleQuizDesc')}</p>

            <button
              onClick={startQuiz}
              className="mt-auto w-full py-2.5 bg-[#ff4d6d] text-white rounded-full font-bold text-xs tracking-wider uppercase hover:bg-[#ff4d6d]/95 shadow-[0_4px_15px_rgba(255,77,109,0.3)] transition-all cursor-pointer"
            >
              {t('playNow')}
            </button>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#ff4d6d]/10 rounded-full blur-2xl" />
          </section>

          {/* Grid: Truth or Dare & Tic Tac Love Miniatures */}
          <section className="grid grid-cols-2 gap-4">
            {/* Truth or Dare */}
            <div className="bg-white/5 rounded-3xl p-4 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-lg">
              <div>
                <span className="flex items-center gap-1 bg-[#ff4d6d]/20 border border-[#ff4d6d]/25 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#ff4d6d] w-max mb-2">
                  🔥 {lang === 'es' ? 'Divertido' : 'Fun'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                  <span className="text-xl">🎭</span>
                </div>
                <h3 className="text-sm font-black text-white mb-1 leading-tight">
                  {t('truthOrDareTitle')}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mb-3">
                  {t('truthOrDareDesc')}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('truth-dare');
                  drawNewCard();
                }}
                className="w-full py-2 text-xs font-bold border border-[#ff4d6d] text-[#ff4d6d] rounded-full hover:bg-[#ff4d6d]/10 transition-colors cursor-pointer"
              >
                {t('startBtn')}
              </button>
            </div>

            {/* Tic Tac Love Board Game */}
            <div className="bg-white/5 rounded-3xl p-4 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-lg">
              <div>
                <span className="flex items-center gap-1 bg-[#ff4d6d]/20 border border-[#ff4d6d]/25 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#ff4d6d] w-max mb-2">
                  🎮 {lang === 'es' ? 'Estrategia' : 'Strategy'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                  <Swords className="w-5 h-5 text-[#ff4d6d]" />
                </div>
                <h3 className="text-sm font-black text-white mb-1 leading-tight">
                  {t('miniBoardTitle')}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mb-3">{t('miniBoardDesc')}</p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('board');
                }}
                className="w-full py-2 text-xs font-bold border border-[#ff4d6d] text-[#ff4d6d] rounded-full hover:bg-[#ff4d6d]/10 transition-colors cursor-pointer"
              >
                {t('playNow')}
              </button>
            </div>
          </section>

          {/* New Games Category: Conexión Especial de Pareja */}
          <section className="space-y-3">
            <h4 className="text-xs font-black uppercase text-[#ff4d6d] tracking-widest px-1">
              {lang === 'es'
                ? '💖 CONEXIÓN ÍNTIMA Y RETROCEDER EN EL TIEMPO'
                : '💖 INTIMATE CONNECTION & RETRO GAMES'}
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {/* 1. Preguntas Picantes */}
              <div className="bg-gradient-to-tr from-[#3b0b14]/50 to-stone-900/60 p-4 rounded-3xl border border-[#ff4d6d]/15 flex items-center justify-between gap-3 shadow-lg hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-950/80 flex items-center justify-center border border-[#ff4d6d]/25 text-2xl animate-heartbeat shrink-0">
                    🌶️
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">
                      {lang === 'es'
                        ? 'Preguntas Calientes & Picantes 😈'
                        : 'Spicy & Hot Cards 😈'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'es'
                        ? 'Saca cartas ardientes con confesiones íntimas y seducción.'
                        : 'Draw intimate conversation cards to kindle the digital flame.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGame('picantes');
                    setPicanteIdx(Math.floor(Math.random() * 5));
                    addFloatingHearts();
                  }}
                  className="px-4 py-2 bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors border-none shrink-0"
                >
                  {t('startBtn')}
                </button>
              </div>

              {/* 2. Raspa y Gana de Deseos */}
              <div className="bg-gradient-to-tr from-[#1b1c30]/50 to-stone-900/60 p-4 rounded-3xl border border-indigo-500/15 flex items-center justify-between gap-3 shadow-lg hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 flex items-center justify-center border border-indigo-500/25 text-2xl shrink-0">
                    🎫
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">
                      {lang === 'es'
                        ? 'Raspa y Gana de Deseos 🎁'
                        : 'Romantic Scratch Coupons 🎁'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'es'
                        ? 'Raspa el boleto digital y reclama sorpresas románticas cariñosas.'
                        : 'Scratch virtual vouchers and promise romantic favors to Alex.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGame('raspa');
                    addFloatingHearts();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors border-none shrink-0"
                >
                  {lang === 'es' ? 'Raspar' : 'Scratch'}
                </button>
              </div>

              {/* 3. Línea del tiempo */}
              <div className="bg-gradient-to-tr from-[#162725]/50 to-stone-900/60 p-4 rounded-3xl border border-teal-500/15 flex items-center justify-between gap-3 shadow-lg hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-950/80 flex items-center justify-center border border-teal-500/25 text-2xl shrink-0">
                    ⏳
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">
                      {lang === 'es'
                        ? 'Nuestra Línea del Tiempo 📅'
                        : 'Our Timeline Milestones 📅'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'es'
                        ? '¿Qué paso primero? Ordena los hitos de su historia de amor.'
                        : 'Which happened first? Sort your historical milestones.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGame('linea-tiempo');
                    setTimelineDone(false);
                    setTimelineCorrect(null);
                    addFloatingHearts();
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors border-none shrink-0"
                >
                  {lang === 'es' ? 'Ordenar' : 'Sort'}
                </button>
              </div>
            </div>
          </section>

          {/* Podiums / Leaderboard block */}
          <section className="bg-white/5 rounded-3xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-500 fill-amber-300" /> {t('leaderboardTitle')}
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {t('thisMonth')}
              </span>
            </div>

            {!state.partnerName ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl bg-black/20">
                <span className="text-2xl block animate-pulse">🔒</span>
                <p className="text-[10px] text-zinc-400 font-extrabold mt-2 uppercase tracking-wider">
                  {lang === 'es'
                    ? 'Sincroniza con tu pareja primero 💗'
                    : 'Connect with your partner first 💗'}
                </p>
                <p className="text-[9px] text-zinc-500 mt-1 px-4 leading-tight">
                  {lang === 'es'
                    ? 'La tabla de posiciones se activará automáticamente cuando vincules a tu pareja para ver el acumulado de puntos.'
                    : 'The leaderboard will activate once you link your partner to track scores.'}
                </p>
              </div>
            ) : (
              <div className="flex items-end justify-around py-3 px-2">
                {/* Me */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[#ff4d6d] overflow-hidden bg-black shadow-xs mb-1">
                    {state.meAvatar ? (
                      <img
                        src={state.meAvatar}
                        className="w-full h-full object-cover"
                        alt="Me"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {lang === 'es' ? 'Yo' : 'Me'}
                      </div>
                    )}
                  </div>
                  <div
                    className="h-16 w-11 bg-gradient-to-t from-rose-600 to-[#ff4d6d] rounded-t-xl flex flex-col items-center justify-end pb-1 shadow-md animate-bounce"
                    style={{ animationDuration: '3s' }}
                  >
                    <span className="font-black text-white text-[9px] uppercase">Me</span>
                  </div>
                  <span className="text-xs font-black text-white mt-1">
                    {state.mePoints || 0} pts
                  </span>
                </div>

                {/* Winner Cup in middle */}
                <div className="flex flex-col items-center justify-end h-24 pb-2">
                  <span className="text-2xl animate-heartbeat">🏆</span>
                  <span className="text-[9px] font-extrabold tracking-widest text-[#ff4d6d] uppercase">
                    Top 1
                  </span>
                </div>

                {/* Partner */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-600 overflow-hidden bg-black shadow-xs mb-1">
                    {state.partnerAvatar ? (
                      <img
                        src={state.partnerAvatar}
                        className="w-full h-full object-cover"
                        alt="Partner"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-[10px] font-bold text-zinc-550">
                        {lang === 'es' ? 'Tu' : 'You'}
                      </div>
                    )}
                  </div>
                  <div className="h-12 w-11 bg-purple-600 rounded-t-xl flex flex-col items-center justify-end pb-1 shadow-xs border-t border-white/5">
                    <span className="font-bold text-white text-[8px] truncate max-w-[38px] block uppercase">
                      {state.partnerName}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-300 mt-1">
                    {state.partnerPoints || 0} pts
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Activity Logs */}
          <section className="space-y-2">
            <h3 className="text-xs font-black text-slate-450 tracking-wider uppercase px-1">
              {t('recentGamesTitle')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span>📝</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t('coupleQuizTitle')}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {t('yesterday')} • {t('youWon')}
                    </p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.8)] animate-pulse" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span>⚔️</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t('miniBoardTitle')}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {t('daysAgo')} • {t('partnerWon')}
                    </p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              </div>
            </div>
          </section>
        </>
      )}

      {/* 1. Couple Quiz Interactive View */}
      {activeGame === 'quiz' && (
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-xs font-black text-slate-250">
              Quiz: {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
          </div>

          {quizScore === null ? (
            <>
              {/* Question card */}
              <div className="bg-white/5 rounded-2xl p-5 text-center space-y-2 border border-white/10 animate-pulse-soft">
                <div className="w-10 h-10 bg-[#ff4d6d]/20 text-[#ff4d6d] border border-[#ff4d6d]/20 rounded-full flex items-center justify-center text-lg mx-auto font-black mb-1">
                  ?
                </div>
                <h3 className="text-base font-black text-white px-2 leading-snug">
                  {quizQuestions[currentQuestionIndex].question}
                </h3>
              </div>

              <p className="text-[11px] font-extrabold text-[#ff4d6d] uppercase tracking-widest text-center">
                {t('selectAnswer')}
              </p>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    className="w-full text-left p-3.5 bg-white/5 hover:bg-[#ff4d6d]/20 border border-white/10 hover:border-[#ff4d6d]/60 rounded-2xl text-xs font-bold text-slate-200 hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <span className="text-4xl">🎉</span>
              <h3 className="text-lg font-black text-white">{t('quizCompleted')}</h3>

              <div className="max-w-[180px] mx-auto bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {t('compatibilityScore')}
                </p>
                <p className="text-3xl font-black text-[#ff4d6d] animate-bounce">{quizScore}%</p>
              </div>

              <p className="text-xs font-bold text-slate-300 px-5">
                {quizScore === 100
                  ? lang === 'es'
                    ? '¡Son almas gemelas perfectas! ❤️'
                    : "You're perfect soulmates! ❤️"
                  : lang === 'es'
                    ? '¡Excelente sintonía! Sigan conociéndose cada día más.'
                    : 'Great chemistry! Keep getting to know each other every day.'}
              </p>

              <button
                onClick={() => {
                  setActiveGame('hub');
                }}
                className="mt-4 px-6 py-2.5 bg-[#ff4d6d] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d6d]/90 shadow-lg cursor-pointer animate-pulse-soft"
              >
                {lang === 'es' ? 'Volver al Hub' : 'Back to Hub'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Truth or Dare Card View */}
      {activeGame === 'truth-dare' && (
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={() => drawNewCard('truth')}
                className="text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-3 py-1 rounded-md cursor-pointer"
              >
                {t('truthTitle')}
              </button>
              <button
                onClick={() => drawNewCard('dare')}
                className="text-[10px] uppercase font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30 px-3 py-1 rounded-md cursor-pointer"
              >
                {t('dareTitle')}
              </button>
            </div>
          </div>

          {/* Large draw card */}
          <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-3xl shadow-2xl flex flex-col justify-between p-5 border-[#ff4d6d]/20 border bg-[#ff4d6d]/5 text-center select-none overflow-hidden group">
            <div className="absolute top-3 left-3 text-[9px] font-extrabold text-[#ff4d6d] tracking-widest uppercase">
              {currentCardType === 'truth' ? '🕊️ ' + t('truthTitle') : '⚡ ' + t('dareTitle')}
            </div>

            <div className="my-auto space-y-3 px-1">
              <span className="text-3xl inline-block transition-transform duration-300 group-hover:rotate-12">
                {currentCardType === 'truth' ? '🕊️' : '⚡'}
              </span>
              <p className="text-sm font-black text-slate-200 mt-2 leading-relaxed">
                &quot;{currentCardText}&quot;
              </p>
            </div>

            <button
              onClick={() => drawNewCard()}
              className="w-full py-2.5 bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white rounded-xl text-xs font-bold transition-all text-center uppercase tracking-wide shadow-md mt-3 cursor-pointer"
            >
              {t('drawCard')}
            </button>
          </div>
        </div>
      )}

      {/* 3. Tic-Tac-Love Board Game View */}
      {activeGame === 'board' && (
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-xl space-y-4 text-center">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={resetTicTac}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-md text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#ff4d6d]" /> Reset
            </button>
          </div>

          <div className="bg-[#ff4d6d]/15 max-w-[220px] mx-auto py-1 px-3 rounded-full text-[10px] font-black text-[#ff4d6d] border border-[#ff4d6d]/20 uppercase tracking-widest truncate">
            {boardFeedback}
          </div>

          {/* Tic Tac Toe Grid */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto py-3">
            {board.map((cell, idx) => (
              <button
                key={idx}
                disabled={cell !== null || !isPlayerTurn || !!gameWinner}
                onClick={() => handleCellClick(idx)}
                className={`aspect-square w-full rounded-2xl shadow-sm border flex items-center justify-center text-3xl font-bold cursor-pointer transition-all ${
                  cell
                    ? 'bg-white/10 border-[#ff4d6d]/40'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span
                  className={
                    cell === mySymbol ? 'animate-heartbeat text-rose-550' : 'text-amber-400'
                  }
                >
                  {cell}
                </span>
              </button>
            ))}
          </div>

          {/* Turns descriptors indicator */}
          <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <span className="text-[#ff4d6d]">❤️</span> Me
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400">✨</span> {state.partnerName}
            </div>
          </div>
        </div>
      )}

      {/* 4. PREGUNTAS PICANTES & CALIENTES OVERLAY */}
      {activeGame === 'picantes' && (
        <div className="bg-gradient-to-tr from-stone-950 to-[#22050b] rounded-3xl p-5 border border-[#ff4d6d]/20 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <button
              type="button"
              onClick={() => {
                setActiveGame('hub');
                addFloatingHearts();
              }}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-[10px] font-mono font-black text-[#ff4d6d] uppercase tracking-wider bg-red-950/40 px-2 py-0.5 rounded-md border border-[#ff4d6d]/20 animate-pulse">
              🔥 {lang === 'es' ? 'MODO PICANTE ACTIVADO' : 'SPICY MODE ACTIVATED'}
            </span>
          </div>

          {/* Core Card Feed */}
          {(() => {
            const picanteCards = [
              {
                text:
                  lang === 'es'
                    ? '¿Cuál es tu lugar favorito para tener un encuentro apasionado e imprevisto sin que nadie nos descubra?'
                    : 'What is your favorite place to have an unplanned passionate rendezvous without getting caught?',
                cat: lang === 'es' ? 'Intimidad' : 'Intimacy',
              },
              {
                text:
                  lang === 'es'
                    ? 'Si tuvieras que describir mi actitud en la intimidad con una palabra sugerente o misteriosa, ¿cuál elegirías y por qué?'
                    : 'If you had to describe my attitude in intimacy with one word, which would you choose and why?',
                cat: lang === 'es' ? 'Sensaciones' : 'Sensations',
              },
              {
                text:
                  lang === 'es'
                    ? '¿Qué prenda de ropa o perfume mío te provoca pensamientos atrevidos al instante?'
                    : 'Which piece of my clothing or perfume triggers bold thoughts in you instantly?',
                cat: lang === 'es' ? 'Fantasías' : 'Fantasies',
              },
              {
                text:
                  lang === 'es'
                    ? 'Dime un deseo secreto que te mueras por intentar conmigo pero aún no te has atrevido a confesar por timidez.'
                    : 'Tell me a secret desire that you are dying to try with me but have been too shy to confess.',
                cat: lang === 'es' ? 'Reto' : 'Challenge',
              },
              {
                text:
                  lang === 'es'
                    ? '¿Cuál ha sido el pensamiento más atrevido o subido de tono que has tenido sobre mí durante el día de hoy?'
                    : 'What has been the most daring or spicy thought you had about me today?',
                cat: lang === 'es' ? 'Fantasías' : 'Fantasies',
              },
              {
                text:
                  lang === 'es'
                    ? 'Si tuvieras la oportunidad de dominar la situación por completo durante toda una noche, ¿qué sería lo primero que me harías hacer?'
                    : 'If you had the chance to lead the situation completely for a whole nigh what is the first thing you would make me do?',
                cat: lang === 'es' ? 'Intimidad' : 'Intimacy',
              },
              {
                text:
                  lang === 'es'
                    ? '¿Prefieres la sutileza de carorias lentas y suaves o la espontaneidad de un juego intenso y salvaje?'
                    : 'Do you prefer the subtlety of slow and soft touches, or the intensity of a wild, spontaneous game?',
                cat: lang === 'es' ? 'Sensaciones' : 'Sensations',
              },
              {
                text:
                  lang === 'es'
                    ? '¿Qué zona exacta de mi cuerpo consideras que es mi punto débil absoluto cuando estamos a solas?'
                    : 'What exact piece of my body do you consider is my absolute sweet spot when we are alone?',
                cat: lang === 'es' ? 'Fantasías' : 'Fantasies',
              },
              {
                text:
                  lang === 'es'
                    ? 'Si tuvieras prohibido tocarme y solo pudieras dictar órdenes al oído para verme disfrutar, ¿cuál sería tu primera instrucción?'
                    : 'If you were forbidden to touch me and could only whisper commands, what would be your first instruction?',
                cat: lang === 'es' ? 'Reto' : 'Challenge',
              },
              {
                text:
                  lang === 'es'
                    ? '¿Cuál ha sido el roce o caricia nuestra más inolvidable y electrizante que te dejó con ganas de muchísimo más?'
                    : 'Which physical contact of ours was the most unforgettable and left you wanting much more?',
                cat: lang === 'es' ? 'Sensaciones' : 'Sensations',
              },
            ];
            const currentCard = picanteCards[picanteIdx % picanteCards.length] || picanteCards[0];

            return (
              <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-3xl shadow-2xl flex flex-col justify-between p-5 border-[#ff4d6d]/40 border bg-gradient-to-b from-[#180509] to-[#3a0b14] text-center select-none overflow-hidden group">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,109,0.15)_0%,transparent_70%)] pointer-events-none" />

                <div className="absolute top-4 left-4 text-[9px] font-extrabold text-[#ff4d6d] tracking-widest uppercase bg-rose-950/50 px-2.5 py-1 rounded-full border border-[#ff4d6d]/25">
                  {currentCard.cat}
                </div>

                <div className="my-auto space-y-4 px-2 relative z-10">
                  <p className="text-sm font-sans font-black text-slate-100 leading-relaxed">
                    &quot;{currentCard.text}&quot;
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPicanteIdx((prev) => (prev + 1) % picanteCards.length);
                    addFloatingHearts();
                  }}
                  className="w-full py-3 bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white rounded-xl text-xs font-serif font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer border-none relative z-10"
                >
                  {lang === 'es' ? 'Siguiente Carta' : 'Next Spicy Card'}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. ROMANTIC SCRATCH CARDS OVERLAY */}
      {activeGame === 'raspa' && (
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => {
                setActiveGame('hub');
                addFloatingHearts();
              }}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                setScratchedCoupons({ c1: false, c2: false, c3: false, c4: false });
                setActiveCoupons([...COUPONS_POOL].sort(() => Math.random() - 0.5).slice(0, 4));
                addFloatingHearts();
              }}
              className="text-[10px] uppercase font-bold bg-white/5 text-slate-300 hover:text-white border border-white/10 px-3 py-1 rounded-md cursor-pointer border-none"
            >
              {lang === 'es' ? 'Resetear' : 'Reset'}
            </button>
          </div>

          <div className="px-1">
            <h3 className="text-base font-serif font-black text-white">
              {lang === 'es'
                ? 'Raspa y Gana de Deseos Románticos'
                : 'Romantic Scratch & Win Tickets'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {lang === 'es'
                ? 'Toca cada boleto misterioso para rasparlo, revelar un deseo secreto canjeable y sorprender a su pareja durante su cita.'
                : 'Tap each golden coupon to scrape the foil, reveal romantic favors, and claim them with your partner.'}
            </p>
          </div>

          {/* Grid of metallic coupons */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {activeCoupons.map((coupon, idx) => {
              const couponId = `c${idx + 1}`;
              const isOpen = scratchedCoupons[couponId];
              return (
                <div
                  key={couponId}
                  onClick={() => {
                    if (!isOpen) {
                      setScratchedCoupons((prev) => ({ ...prev, [couponId]: true }));
                      for (let i = 0; i < 4; i++) {
                        setTimeout(() => addFloatingHearts(), i * 150);
                      }
                    }
                  }}
                  className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer relative overflow-hidden ${
                    isOpen
                      ? 'bg-gradient-to-t from-indigo-950 to-stone-900 border-indigo-500/30 shadow-inner'
                      : 'bg-gradient-to-tr from-amber-500/20 via-rose-500/10 to-purple-600/30 border-yellow-500/30 shadow-md hover:scale-102 flex'
                  }`}
                >
                  {!isOpen ? (
                    <>
                      {/* Scratch gold cover */}
                      <span className="text-3xl animate-bounce" style={{ animationDuration: '4s' }}>
                        ✨🎫
                      </span>
                      <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest mt-2">
                        {lang === 'es' ? 'RASPAR CON AMOR' : 'REVEAL SURPRISE'}
                      </p>
                      <span className="text-[8px] text-yellow-500/60 uppercase font-mono tracking-tighter mt-1">
                        TAP ME QUICK
                      </span>
                    </>
                  ) : (
                    <div className="space-y-1.5 animate-fade-in text-center">
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] uppercase font-black tracking-widest inline-block mb-1">
                        {lang === 'es' ? 'REVELADO' : 'REVEALED'}
                      </span>
                      <h6 className="text-[11px] font-black font-sans text-white leading-none">
                        {coupon.title}
                      </h6>
                      <p className="text-[9px] text-slate-300 leading-tight font-medium px-0.5">
                        {coupon.desc}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. OUR HISTORICAL TIMELINE PUZZLE OVERLAY */}
      {activeGame === 'linea-tiempo' && (
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => {
                setActiveGame('hub');
                addFloatingHearts();
              }}
              className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-[10px] font-mono font-black text-teal-400 uppercase tracking-wider bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-500/20">
              ⏳ RETRO LOVE TRIVIA
            </span>
          </div>

          <div className="px-1">
            <h3 className="text-base font-serif font-black text-white">
              {lang === 'es' ? 'Línea de Tiempo de Recuerdos' : 'Timeline Memory Swapper'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {lang === 'es'
                ? '¿Qué sucedió primero en su historia? Utiliza las flechas para ordenar cronológicamente de arriba (más antiguo) a abajo (reciente).'
                : 'What order did these sweet events happen? Swap entries using Up and Down controls to match reality!'}
            </p>
          </div>

          {/* Draggable-like ordering element blocks list */}
          <div className="space-y-2 py-2">
            {milestonesOrder.map((milestone, idx) => (
              <div
                key={milestone.id}
                className="bg-stone-900 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-2.5 shadow-sm hover:border-teal-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-white/5 border border-white/5 font-mono text-xs font-black text-[#ff4d6d] rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-[11px] font-bold text-slate-200 font-sans leading-snug">
                    {milestone.text}
                  </p>
                </div>

                {/* Swap controls arrows */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      if (idx > 0) {
                        const copy = [...milestonesOrder];
                        const temp = copy[idx];
                        copy[idx] = copy[idx - 1];
                        copy[idx - 1] = temp;
                        setMilestonesOrder(copy);
                        addFloatingHearts();
                      }
                    }}
                    className={`p-1 rounded-md bg-white/5 hover:bg-teal-550 hover:text-white transition-colors border-none cursor-pointer ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'text-slate-400'}`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === milestonesOrder.length - 1}
                    onClick={() => {
                      if (idx < milestonesOrder.length - 1) {
                        const copy = [...milestonesOrder];
                        const temp = copy[idx];
                        copy[idx] = copy[idx + 1];
                        copy[idx + 1] = temp;
                        setMilestonesOrder(copy);
                        addFloatingHearts();
                      }
                    }}
                    className={`p-1 rounded-md bg-white/5 hover:bg-teal-550 hover:text-white transition-colors border-none cursor-pointer ${idx === milestonesOrder.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-slate-400'}`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submission and verification box */}
          <div className="pt-2 text-center">
            {timelineCorrect === null ? (
              <button
                type="button"
                onClick={() => {
                  const sortedIncorrectly = milestonesOrder.some(
                    (m, idx) => m.correctOrderIndex !== idx
                  );
                  setTimelineCorrect(!sortedIncorrectly);
                  setTimelineDone(true);
                  if (!sortedIncorrectly) {
                    for (let j = 0; j < 6; j++) {
                      setTimeout(() => addFloatingHearts(), j * 150);
                    }
                  } else {
                    addFloatingHearts();
                  }
                }}
                className="w-full py-3 bg-teal-600 hover:bg-teal-550 text-white rounded-xl text-xs font-serif font-black uppercase tracking-wider transition-all cursor-pointer border-none shadow-md"
              >
                🔍 {lang === 'es' ? 'Verificar Sintonía Histórica' : 'Verify Historic Sync'}
              </button>
            ) : (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 text-center space-y-3 animate-fade-in">
                {timelineCorrect ? (
                  <>
                    <span className="text-3xl animate-bounce inline-block">🏅✨</span>
                    <h4 className="text-sm font-black text-teal-400 uppercase tracking-widest">
                      {lang === 'es'
                        ? '¡COMPATIBILIDAD CRONOLÓGICA PERFECTA!'
                        : 'PERFECT CHRONOLOGICAL SYNC!'}
                    </h4>
                    <p className="text-[11px] text-slate-350 px-3">
                      {lang === 'es'
                        ? '¡Increíble! Recuerdas perfectamente el orden cronológico en el que se construyeron los escalones de su amor.'
                        : 'Incredible memory alignment! You ordered your love milestones flawlessly.'}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl inline-block">⏳🥀</span>
                    <h4 className="text-sm font-black text-pink-500 uppercase tracking-widest">
                      {lang === 'es' ? 'HAY ALGÚN PEQUEÑO ERROR' : 'A MINOR DEVIATION DETECTED'}
                    </h4>
                    <p className="text-[11px] text-slate-350 px-3">
                      {lang === 'es'
                        ? '¡No pasa nada! Recuerden juntos para re-agrupar la historia e intentarlo de nuevo.'
                        : 'No worries! Recalibrate those cozy memories together and retry.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTimelineCorrect(null);
                        setTimelineDone(false);
                        setMilestonesOrder(rollRandomMilestones());
                        addFloatingHearts();
                      }}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none"
                    >
                      🔄 {lang === 'es' ? 'Re-intentar' : 'Retry'}
                    </button>
                  </>
                )}
                {timelineCorrect && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineCorrect(null);
                      setTimelineDone(false);
                      setActiveGame('hub');
                    }}
                    className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-[10px] uppercase font-black tracking-wider hover:bg-teal-550 cursor-pointer border-none shadow-sm"
                  >
                    {lang === 'es' ? 'Volver al Hub de Juegos' : 'Back to Games Hub'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
