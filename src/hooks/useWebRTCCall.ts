import { useEffect, useRef, useState } from 'react';

export type CallType = 'voice' | 'video';
// idle | calling (ringing out) | ringing-in (incoming) | connecting | connected
export type CallStatus = 'idle' | 'calling' | 'ringing-in' | 'connecting' | 'connected';

interface UseWebRTCCallArgs {
  currentUserEmail: string | null;
  partnerEmail: string | null;
  coupleId: string | null;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

const POLL_MS = 1800;

// Screen sharing only works on desktop browsers; the UI hides the button on phones.
export const canShareScreen =
  typeof navigator !== 'undefined' &&
  !!(navigator.mediaDevices as any)?.getDisplayMedia &&
  !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

// Wait until ICE candidates are gathered so the SDP we send already contains
// them (non-trickle). This lets us signal with a single offer/answer exchange
// over plain same-origin HTTP — no fast candidate channel needed.
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(finish, 2500); // safety: don't wait forever for relay candidates
  });
}

export function useWebRTCCall({ currentUserEmail, partnerEmail, coupleId }: UseWebRTCCallArgs) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteStreamRevision, setRemoteStreamRevision] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const incomingRef = useRef<any>(null);
  const roleRef = useRef<'caller' | 'callee' | null>(null);
  const statusRef = useRef<CallStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const me = (currentUserEmail || '').toLowerCase().trim();
  const partner = (partnerEmail || '').toLowerCase().trim();

  // ---- Backend signaling helpers -----------------------------------------
  const apiPost = (path: string, body: any) =>
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).catch((err) => {
      console.warn('[call] POST failed', path);
    });

  // ---- Teardown -----------------------------------------------------------
  const stopLocalMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraTrackRef.current?.stop();
    cameraTrackRef.current = null;
    localStreamRef.current = null;
  };

  const resetLocalState = (reason?: string) => {
    if (reason) console.log('[call] reset:', reason);
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      try {
        pc.close();
      } catch {
        /* no-op */
      }
      pcRef.current = null;
    }
    stopLocalMedia();
    incomingRef.current = null;
    roleRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteStreamRevision(0);
    setMuted(false);
    setCameraOff(false);
    setIsSharingScreen(false);
    setStatus('idle');
  };

  // ---- Peer connection ----------------------------------------------------
  const buildPeer = () => {
    const pc = new RTCPeerConnection(ICE_CONFIG);
    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      const tracks = stream?.getTracks() || (event.track ? [event.track] : []);
      tracks.forEach((track) => {
        if (!remote.getTracks().some((existing) => existing.id === track.id)) {
          remote.addTrack(track);
        }
      });
      setRemoteStreamRevision((revision) => revision + 1);
    };
    pc.onconnectionstatechange = () => {
      console.log('[call] connectionState:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('connected');
      } else if (
        pc.connectionState === 'failed' &&
        (statusRef.current === 'connecting' || statusRef.current === 'connected')
      ) {
        resetLocalState('connection failed');
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const getLocalMedia = async (type: CallType) => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } } : false 
      });
    } catch (err) {
      if (type === 'video') {
        // Camera unavailable or already in use (e.g. two browsers sharing one
        // webcam on the same PC). Fall back to audio-only so the call still
        // connects instead of dropping.
        console.warn('[call] camera unavailable, falling back to audio-only:');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        throw err;
      }
    }
    localStreamRef.current = stream;
    setLocalStream(stream);
    const vTrack = stream.getVideoTracks()[0];
    if (vTrack) cameraTrackRef.current = vTrack;
    return stream;
  };

  // ---- Outgoing call ------------------------------------------------------
  const startCall = async (type: CallType) => {
    if (!coupleId || !me || !partner) {
      console.warn('[call] Cannot start: not coupled.', { me, partner, coupleId });
      return;
    }
    if (statusRef.current !== 'idle') return;
    console.log('[call] starting', { type, partner, coupleId });

    let stream: MediaStream;
    try {
      stream = await getLocalMedia(type);
    } catch (err) {
      console.warn('[call] mic/camera denied (caller):');
      resetLocalState('media denied (caller)');
      return;
    }

    try {
      setCallType(type);
      roleRef.current = 'caller';
      setStatus('calling');

      const pc = buildPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      const local = pc.localDescription!;
      await apiPost('/api/couple/call/start', {
        type,
        offer: { type: local.type, sdp: local.sdp },
      });
      console.log('[call] offer sen ringing…');
    } catch (err) {
      console.error('[call] startCall failed:');
      await apiPost('/api/couple/call/end', {});
      resetLocalState('startCall error');
    }
  };

  // ---- Accept an incoming call -------------------------------------------
  const acceptCall = async () => {
    const data = incomingRef.current;
    if (!data?.offer) return;
    const type: CallType = data.type === 'video' ? 'video' : 'voice';

    let stream: MediaStream;
    try {
      stream = await getLocalMedia(type);
    } catch (err) {
      console.warn('[call] mic/camera denied (callee):');
      await apiPost('/api/couple/call/end', { status: 'declined' });
      resetLocalState('media denied (callee)');
      return;
    }

    try {
      setCallType(type);
      roleRef.current = 'callee';
      setStatus('connecting');

      const pc = buildPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);

      const local = pc.localDescription!;
      await apiPost('/api/couple/call/answer', {
        answer: { type: local.type, sdp: local.sdp },
      });
      console.log('[call] answer sent');
    } catch (err) {
      console.error('[call] acceptCall failed:');
      await apiPost('/api/couple/call/end', {});
      resetLocalState('acceptCall error');
    }
  };

  const declineCall = async () => {
    await apiPost('/api/couple/call/end', { status: 'declined' });
    resetLocalState('declined locally');
  };

  const hangUp = async () => {
    await apiPost('/api/couple/call/end', {});
    resetLocalState('hung up locally');
  };

  // ---- Media controls -----------------------------------------------------
  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setMuted(next);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !cameraOff;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCameraOff(next);
  };

  const shareScreen = async () => {
    if (!canShareScreen || !pcRef.current) return;
    try {
      const display = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack: MediaStreamTrack = display.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      setIsSharingScreen(true);
      screenTrack.onended = async () => {
        const cam = cameraTrackRef.current;
        const vSender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
        if (cam && vSender) await vSender.replaceTrack(cam).catch(() => {});
        setIsSharingScreen(false);
      };
    } catch (err) {
      console.warn('[call] shareScreen cancelled/failed:');
    }
  };

  // ---- Polling signaling loop --------------------------------------------
  useEffect(() => {
    if (!coupleId || !me) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/couple/call/poll?email=${encodeURIComponent(me)}`);
        if (!res.ok || cancelled) return;
        const { call } = await res.json();

        if (!call) {
          // Signal cleared: if I was being rung, the caller cancelled.
          if (statusRef.current === 'ringing-in') resetLocalState('caller cancelled');
          return;
        }

        // Caller: the answer arrived → finish the handshake.
        if (
          roleRef.current === 'caller' &&
          call.answer &&
          pcRef.current &&
          !pcRef.current.currentRemoteDescription
        ) {
          console.log('[call] answer received');
          pcRef.current
            .setRemoteDescription(new RTCSessionDescription(call.answer))
            .then(() => setStatus('connecting'))
            .catch((err) => console.warn('[call] setRemoteDescription(answer) failed:'));
        }

        // Callee: a ringing call I didn't start → it's for me.
        if (
          roleRef.current === null &&
          statusRef.current === 'idle' &&
          call.status === 'ringing' &&
          call.offer &&
          call.callerEmail &&
          call.callerEmail !== me
        ) {
          console.log('[call] incoming from', call.callerEmail);
          incomingRef.current = call;
          setCallType(call.type === 'video' ? 'video' : 'voice');
          setStatus('ringing-in');
        }

        // Either side: remote ended/declined.
        if (
          (call.status === 'ended' || call.status === 'declined') &&
          statusRef.current !== 'idle'
        ) {
          resetLocalState('remote ' + call.status);
        }
      } catch (err) {
        if (!cancelled) console.warn('[call] poll failed:');
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, me]);

  // Cleanup media/peer on unmount.
  useEffect(() => {
    return () => {
      resetLocalState('unmount');
    };
  }, []);

  return {
    status,
    callType,
    muted,
    cameraOff,
    isSharingScreen,
    canShareScreen,
    localStream,
    remoteStream,
    remoteStreamRevision,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
    shareScreen,
  };
}
