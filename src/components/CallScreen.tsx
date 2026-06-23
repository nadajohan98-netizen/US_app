import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  PhoneOff,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { CallStatus, CallType } from '../hooks/useWebRTCCall';
import { useRingtone } from '../hooks/useRingtone';

interface CallScreenProps {
  status: CallStatus;
  callType: CallType;
  muted: boolean;
  cameraOff: boolean;
  isSharingScreen: boolean;
  canShareScreen: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreamRevision: number;
  partnerName: string;
  partnerAvatar: string;
  meAvatar: string;
  lang: LanguageCode;
  onAccept: () => void;
  onDecline: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
}

export default function CallScreen({
  status,
  callType,
  muted,
  cameraOff,
  isSharingScreen,
  canShareScreen,
  localStream,
  remoteStream,
  remoteStreamRevision,
  partnerName,
  partnerAvatar,
  meAvatar,
  lang,
  onAccept,
  onDecline,
  onHangUp,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
}: CallScreenProps) {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [remoteAudioBlocked, setRemoteAudioBlocked] = useState(false);

  // Auto-maximize when call ends or incoming rings
  useEffect(() => {
    if (status === 'idle' || status === 'ringing-in') {
      setIsMinimized(false);
    }
  }, [status]);

  // Ring while a call is incoming (callee) or ringing out (caller).
  useRingtone(status === 'ringing-in' || status === 'calling');

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // Dedicated audio sink so remote sound always plays (works for voice calls
    // and avoids relying on a hidden/display:none video element).
    if (remoteAudioRef.current && remoteStream) {
      const audio = remoteAudioRef.current;
      audio.srcObject = remoteStream;
      audio.muted = false;
      audio.volume = 1;
      const audioTracks = remoteStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audio
          .play()
          .then(() => setRemoteAudioBlocked(false))
          .catch(() => setRemoteAudioBlocked(true));
      }
    }
  }, [remoteStream, remoteStreamRevision, isMinimized]); // Re-attach when minimized state changes because DOM element might recreate

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isMinimized]); // Re-attach when minimized state changes

  if (status === 'idle') return null;

  const isVideo = callType === 'video';
  const partner = partnerName || (lang === 'es' ? 'Tu pareja' : 'Your partner');

  // ---- Incoming call (ringing) -------------------------------------------
  if (status === 'ringing-in') {
    return (
      <div className="fixed inset-0 z-[120] bg-[#0c0c0e]/98 flex flex-col items-center justify-between p-8 text-white animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
          <div className="relative">
            <div className="absolute inset-[-18px] rounded-full bg-[#ff4d6d]/15 animate-ping" />
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#ff4d6d] shadow-2xl bg-stone-900">
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partner}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">💖</div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-black">{partner}</h3>
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#ff4d6d] flex items-center justify-center gap-1.5">
              {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {lang === 'es'
                ? isVideo
                  ? 'Videollamada entrante…'
                  : 'Llamada entrante…'
                : isVideo
                  ? 'Incoming video call…'
                  : 'Incoming call…'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-16 pb-6">
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-2 cursor-pointer border-none bg-transparent"
          >
            <span className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <PhoneOff className="w-7 h-7 text-white" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {lang === 'es' ? 'Rechazar' : 'Decline'}
            </span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-2 cursor-pointer border-none bg-transparent"
          >
            <span className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg active:scale-95 transition-all animate-bounce">
              <Phone className="w-7 h-7 text-white fill-white" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {lang === 'es' ? 'Aceptar' : 'Accept'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ---- Outgoing / active call --------------------------------------------
  const isRinging = status === 'calling';
  const statusLabel = isRinging
    ? lang === 'es'
      ? 'Llamando…'
      : 'Calling…'
    : status === 'connecting'
      ? lang === 'es'
        ? 'Conectando…'
        : 'Connecting…'
      : lang === 'es'
        ? 'En llamada'
        : 'In call';

  // Minimized state view
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-[150] w-28 h-40 bg-stone-900 rounded-2xl overflow-hidden border-2 border-[#ff4d6d] shadow-2xl flex flex-col group animate-fade-in">
        <audio ref={remoteAudioRef} autoPlay />

        {/* Maximize overlay */}
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 cursor-pointer border-none"
        >
          <Maximize2 className="w-6 h-6 text-white" />
        </button>

        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#121216]">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#ff4d6d]">
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partner}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-stone-800 flex items-center justify-center text-xl">
                  💖
                </div>
              )}
            </div>
            <div className="text-[#ff4d6d] animate-pulse">
              <Phone className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Mini Hangup Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHangUp();
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white z-30 shadow-lg cursor-pointer border-none hover:bg-red-700"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-[#0c0c0e] flex flex-col text-white animate-fade-in">
      {/* Remote feed / partner */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-stone-950">
        {/* Dedicated audio sink — guarantees the partner's voice is heard
            (video element below stays muted to avoid double audio). */}
        <audio ref={remoteAudioRef} autoPlay />
        {remoteAudioBlocked && (
          <button
            type="button"
            onClick={() => {
              remoteAudioRef.current
                ?.play()
                .then(() => setRemoteAudioBlocked(false))
                .catch(() => setRemoteAudioBlocked(true));
            }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#ff4d6d] text-white text-xs font-black shadow-lg border-none cursor-pointer"
          >
            {lang === 'es' ? 'Activar audio' : 'Enable audio'}
          </button>
        )}

        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Voice call: show the partner's avatar (audio plays via the sink above) */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div
                className="absolute inset-[-16px] rounded-full bg-[#ff4d6d]/12 animate-ping"
                style={{ animationDuration: '3s' }}
              />
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#ff4d6d] shadow-2xl bg-stone-900">
                {partnerAvatar ? (
                  <img
                    src={partnerAvatar}
                    alt={partner}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    💖
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/70 to-transparent flex items-center gap-3">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer backdrop-blur-sm mr-2"
            title={lang === 'es' ? 'Minimizar' : 'Minimize'}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-stone-900 shrink-0">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partner}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">💖</div>
            )}
          </div>
          <div>
            <p className="text-sm font-black">{partner}</p>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff4d6d] flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full bg-[#ff4d6d] ${isRinging ? 'animate-ping' : 'animate-pulse'}`}
              />
              {statusLabel}
            </p>
          </div>
        </div>

        {/* Local PiP (video calls only) */}
        {isVideo && (
          <div className="absolute top-20 right-4 w-24 aspect-[3/4] bg-stone-900 rounded-2xl overflow-hidden border-2 border-white/80 shadow-xl z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {cameraOff && (
              <div className="absolute inset-0 bg-stone-950 flex items-center justify-center">
                {meAvatar ? (
                  <img
                    src={meAvatar}
                    alt="Me"
                    className="w-full h-full object-cover opacity-60"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <VideoOff className="w-5 h-5 text-slate-500" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[#0c0c0e] border-t border-white/5 px-6 py-5 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className={`w-13 h-13 p-3.5 rounded-full transition-colors cursor-pointer border-none ${muted ? 'bg-[#ff4d6d] text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isVideo && (
          <button
            type="button"
            onClick={onToggleCamera}
            title={cameraOff ? 'Camera on' : 'Camera off'}
            className={`p-3.5 rounded-full transition-colors cursor-pointer border-none ${cameraOff ? 'bg-[#ff4d6d] text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Screen share — desktop only (mobile browsers don't support it) */}
        {isVideo && canShareScreen && (
          <button
            type="button"
            onClick={onShareScreen}
            title={lang === 'es' ? 'Compartir pantalla' : 'Share screen'}
            className={`p-3.5 rounded-full transition-colors cursor-pointer border-none ${isSharingScreen ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <MonitorUp className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onHangUp}
          title={lang === 'es' ? 'Colgar' : 'Hang up'}
          className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer border-none shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
