import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { CoupleState, LanguageCode } from '../types';
import { db } from '../firebase';
import { fetchIpLocation } from '../utils/geo';

interface UseGpsTrackingArgs {
  state: CoupleState;
  setState: Dispatch<SetStateAction<CoupleState>>;
  currentUserEmail: string | null;
  lang: LanguageCode;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;
}

/**
 * Owns all GPS / map sharing state and the real-time location logic that was
 * previously inline in HomeSection: passcode  map view state, geocoding
 * search, the high-accuracy watchPosition stream (with anti-jitter gating),
 * manual location requests and the permission grant/simulate handlers.
 */
export function useGpsTracking({
  state,
  setState,
  currentUserEmail,
  lang,
  addFloatingHearts,
  showTempAlert,
}: UseGpsTrackingArgs) {
  // GPS Location Sharing state
  const [showGpsPanel, setShowGpsPanel] = useState(false);
  const [dismissGpsIntro, setDismissGpsIntro] = useState(false);
  const [gpsPasscode, setGpsPasscode] = useState('1402');
  const [gpsCode, setGpsCode] = useState('US-9831-XP');
  const [gpsStatus, setGpsStatus] = useState<'home' | 'work' | 'transit' | 'school'>('home');
  const [partnerStatusStr, setPartnerStatusStr] = useState('');
  const [gpsLocked, setGpsLocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [locationRequesting, setLocationRequesting] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<string | null>(null);

  // Google Maps Simulator Interactive Coords & Views
  const [userLat, setUserLat] = useState<number>(state.meLat || 19.4326);
  const [userLng, setUserLng] = useState<number>(state.meLng || -99.1332);
  const [partnerLat, setPartnerLat] = useState<number>(state.partnerLat || 19.4442);
  const [partnerLng, setPartnerLng] = useState<number>(state.partnerLng || -99.1419);
  const [gpsTravelMode, setGpsTravelMode] = useState<'driving' | 'walking' | 'transit' | 'bicycle'>(
    'driving'
  );
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [gpsSearchVal, setGpsSearchVal] = useState('');
  const [gpsCustomSpot, setGpsCustomSpot] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsRealtimeMovement, setGpsRealtimeMovement] = useState(true);
  const [googleMapsZoom, setGoogleMapsZoom] = useState(14);
  const [mapViewMode, setMapViewMode] = useState<'radar' | 'gmap'>('radar');

  // Real-world exact custom Geocoding Search state (OpenStreetMap Nominatim)
  const [myGeoQuery, setMyGeoQuery] = useState('');
  const [partnerGeoQuery, setPartnerGeoQuery] = useState('');
  const [geoSearching, setGeoSearching] = useState<'me' | 'partner' | null>(null);

  const searchAddress = async (query: string, target: 'me' | 'partner') => {
    if (!query.trim()) return;
    setGeoSearching(target);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      if (!res.ok) throw new Error('Geocoding request failed');
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const name = data[0].display_name;

        if (target === 'me') {
          setUserLat(lat);
          setUserLng(lng);
          // Set zoom and map view mode
          setGoogleMapsZoom(14);

          // Save to persistent server db schema
          await fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, lat, lng, gpsConsent: true }),
          });

          if (currentUserEmail) {
            const myEmailClean = currentUserEmail.toLowerCase().trim();
            setDoc(
              doc(db, 'locations', myEmailClean),
              {
                email: myEmailClean,
                lat,
                lng,
                gpsConsent: true,
                updatedAt: Date.now(),
              },
              { merge: true }
            ).catch((err) => console.warn('Firestore search write failed:'));
          }

          setState((prev) => ({
            ...prev,
            meLat: lat,
            meLng: lng,
            meGpsConsent: true,
          }));
          showTempAlert(
            lang === 'es'
              ? `¡Tu ubicación se fijó en: ${name.split(',')[0]}! 📍`
              : `Your location set to: ${name.split(',')[0]}! 📍`
          );
          setMyGeoQuery('');
        } else {
          setPartnerLat(lat);
          setPartnerLng(lng);
          setGoogleMapsZoom(14);

          setState((prev) => ({
            ...prev,
            partnerLat: lat,
            partnerLng: lng,
            partnerGpsConsent: true,
          }));
          showTempAlert(
            lang === 'es'
              ? `¡Ubicación de pareja fijada en: ${name.split(',')[0]}! 👥📍`
              : `Partner location set to: ${name.split(',')[0]}! 👥📍`
          );
          setPartnerGeoQuery('');
        }
        addFloatingHearts();
      } else {
        showTempAlert(
          lang === 'es'
            ? 'No se encontró el lugar. Intenta agregar el país o ser más específico. 🗺️'
            : 'Place not found. Try adding the country name. 🗺️'
        );
      }
    } catch (e) {
      console.error('Geocoding error:', e);
      showTempAlert(
        lang === 'es'
          ? 'Error temporal al buscar ciudad. Inténtalo de nuevo.'
          : 'Temporary geocoding error. Please try again.'
      );
    } finally {
      setGeoSearching(null);
    }
  };

  useEffect(() => {
    if (lang === 'es') {
      setPartnerStatusStr('En el Trabajo 💼');
    } else if (lang === 'en') {
      setPartnerStatusStr('At Work 💼');
    } else {
      setPartnerStatusStr('Trabalhando 💼');
    }
  }, [lang]);

  // Synchronize partner and user lat/lng coordinates to local states
  useEffect(() => {
    if (state.partnerLat && state.partnerLng) {
      setPartnerLat(state.partnerLat);
      setPartnerLng(state.partnerLng);
    }
  }, [state.partnerLat, state.partnerLng]);

  useEffect(() => {
    if (state.meLat && state.meLng) {
      setUserLat(state.meLat);
      setUserLng(state.meLng);
    }
  }, [state.meLat, state.meLng]);

  // High accuracy real-time browser GPS streaming using continuous watchPosition tracking
  useEffect(() => {
    if (!currentUserEmail || !state.meGpsConsent) return;

    let watchId: number | null = null;
    let lastSentTime = 0;
    // Ignore GPS jitter below ~11 meters. Desktop GPS/Wi-Fi positioning wobbles
    // constantly; without this the map + state update on every reading, which
    // causes a re-render storm (and, with two paired clients, mutual flicker).
    const MOVE_EPSILON = 0.0001;
    let lastWrittenLat: number | null = null;
    let lastWrittenLng: number | null = null;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Only update local state when the position actually moved meaningfully.
          setUserLat((prev) => (Math.abs(prev - lat) > MOVE_EPSILON ? lat : prev));
          setUserLng((prev) => (Math.abs(prev - lng) > MOVE_EPSILON ? lng : prev));

          // Direct real-time write to Firebase Firestore (throttled + movement-gated)
          const now = Date.now();
          const movedEnough =
            lastWrittenLat === null ||
            Math.abs(lastWrittenLat - lat) > MOVE_EPSILON ||
            Math.abs(lastWrittenLng - lng) > MOVE_EPSILON;

          if (movedEnough && now - lastSentTime > 2500) {
            lastSentTime = now;
            lastWrittenLat = lat;
            lastWrittenLng = lng;
            const myEmailClean = currentUserEmail.toLowerCase().trim();

            // 1. Direct secure write to Firestore for instant WebSocket push to partner
            setDoc(
              doc(db, 'locations', myEmailClean),
              {
                email: myEmailClean,
                lat,
                lng,
                gpsConsent: true,
                updatedAt: Date.now(),
              },
              { merge: true }
            ).catch((err) => console.warn('Firestore GPS write failed:'));

            // 2. Sync local state
            setState((prev) => ({
              ...prev,
              meLat: lat,
              meLng: lng,
              meGpsConsent: true,
            }));

            // 3. Keep server REST backup synced
            fetch('/api/user/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: currentUserEmail, lat, lng, gpsConsent: true }),
            }).catch((e) => console.log('Bg GPS streaming error:', e));
          }
        },
        (error) => {
          console.log('Bg GPS streaming blocked or unavailable:', error);

          // If hardware watch is blocked (common in sandboxed iframes) and we have no coordinate values ye
          // trigger an automated IP-based geolocator fallback
          if (!state.meLat || !state.meLng) {
            fetchIpLocation(lang === 'es' ? 'tu ciudad' : 'your city', (ipLat, ipLng) => {
              setUserLat(ipLat);
              setUserLng(ipLng);
              const myEmailClean = currentUserEmail.toLowerCase().trim();

              // Write IP fallback location to Firestore
              setDoc(
                doc(db, 'locations', myEmailClean),
                {
                  email: myEmailClean,
                  lat: ipLat,
                  lng: ipLng,
                  gpsConsent: true,
                  updatedAt: Date.now(),
                },
                { merge: true }
              ).catch((err) => console.warn('Firestore IP fallback failed:'));

              setState((prev) => ({
                ...prev,
                meLat: ipLat,
                meLng: ipLng,
                meGpsConsent: true,
              }));

              fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: currentUserEmail,
                  lat: ipLat,
                  lng: ipLng,
                  gpsConsent: true,
                }),
              }).catch((e) => console.log('IP fallback error:', e));
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [currentUserEmail, state.meGpsConsent]);

  const triggerLocationRequest = () => {
    setLocationRequesting(true);
    addFloatingHearts();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);

          setLastRequestTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );

          // Post coordinates to server
          fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, lat, lng }),
          })
            .then(() => {
              setLocationRequesting(false);
              setState((prev) => ({
                ...prev,
                meLat: lat,
                meLng: lng,
              }));

              if (state.partnerLat && state.partnerLng) {
                setPartnerLat(state.partnerLat);
                setPartnerLng(state.partnerLng);
                const dist =
                  Math.sqrt((lat - state.partnerLat) ** 2 + (lng - state.partnerLng) ** 2) *
                  111.325;
                const statusStr =
                  lang === 'es'
                    ? `Vinculado • Distancia: ${dist.toFixed(2)} km 🗺️`
                    : `Linked • Distance: ${dist.toFixed(2)} km 🗺️`;
                setPartnerStatusStr(statusStr);
              } else {
                setPartnerStatusStr(
                  lang === 'es'
                    ? '📍 Ubicación actualizada con éxito. Esperando a pareja...'
                    : "📍 Location updated. Waiting for partner's update..."
                );
              }
              showTempAlert(
                lang === 'es'
                  ? '¡Ubicación real actualizada con éxito!'
                  : 'Real-time location updated and parsed!'
              );
            })
            .catch((err) => {
              console.error('GPS API request failed');
              setLocationRequesting(false);
            });
        },
        (error) => {
          console.error('Geolocation failed, initiating IP-based fallback:', error);

          showTempAlert(
            lang === 'es'
              ? '⚠️ Tu navegador bloqueó el GPS directo (común en iFrames). Buscando tu ubicación aproximada por IP...'
              : '⚠️ Browser blocked geolocation (common in iFrames). Fetching approximate location via IP...'
          );

          fetchIpLocation(
            lang === 'es' ? 'tu ciudad' : 'your city',
            (lat, lng, city) => {
              setUserLat(lat);
              setUserLng(lng);
              setLastRequestTime(
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              );

              fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail, lat, lng }),
              })
                .then(() => {
                  setLocationRequesting(false);
                  setState((prev) => ({
                    ...prev,
                    meLat: lat,
                    meLng: lng,
                  }));

                  if (state.partnerLat && state.partnerLng) {
                    setPartnerLat(state.partnerLat);
                    setPartnerLng(state.partnerLng);
                    const dist =
                      Math.sqrt((lat - state.partnerLat) ** 2 + (lng - state.partnerLng) ** 2) *
                      111.325;
                    const statusStr =
                      lang === 'es'
                        ? `Vinculado • Distancia: ${dist.toFixed(2)} km 🗺️`
                        : `Linked • Distance: ${dist.toFixed(2)} km 🗺️`;
                    setPartnerStatusStr(statusStr);
                  } else {
                    setPartnerStatusStr(
                      lang === 'es'
                        ? `📍 Ubicación fijada en ${city}. Esperando a pareja...`
                        : `📍 Location set to ${city}. Waiting for partner's update...`
                    );
                  }
                  showTempAlert(
                    lang === 'es'
                      ? `¡Ubicación fijada con éxito en ${city}! 📍`
                      : `Location set successfully to ${city}! 📍`
                  );
                })
                .catch((err) => {
                  console.error('GPS API request failed on fallback');
                  setLocationRequesting(false);
                });
            },
            (finalErr) => {
              setLocationRequesting(false);
              showTempAlert(
                lang === 'es'
                  ? "Búsqueda IP fallida. Por favor, escribe tu ciudad abajo en 'Fijar Ubicación Real' para posicionarte exactamente ¡es 100% seguro! 🗺️"
                  : "IP lookup failed. Please type your city in 'Set Real Map Location' below to set your spot! 🗺️"
              );
            }
          );
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationRequesting(false);
      showTempAlert('Tu navegador no soporta Georreferenciación real.');
    }
  };

  const handleRequestAllPermissions = async () => {
    // 1. Set local state consents to true so UI reacts instantly
    setState((prev) => ({
      ...prev,
      meGpsConsent: true,
    }));
    setDismissGpsIntro(true);

    // 2. Immediately send consent POST to server
    try {
      await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, gpsConsent: true }),
      });
    } catch (e) {
      console.error('Error saving consent to server:', e);
    }

    showTempAlert(
      lang === 'es'
        ? '¡Iniciando solicitud de ubicación y llamadas! 🗺️📞'
        : 'Requesting location & call permissions! 🗺️📞'
    );

    // 3. Request Phone Call Permissions (Mic + Cam) safely
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // Release tracks immediately
        stream.getTracks().forEach((track) => track.stop());
        showTempAlert(
          lang === 'es'
            ? '¡Permisos de llamada (Micrófono/Cámara) concedidos! 🎙️✨'
            : 'Call permissions (Mic/Cam) granted! 🎙️✨'
        );
      } catch (err) {
        console.warn('Media permissions either denied or caught in sandbox:');
        showTempAlert(
          lang === 'es'
            ? 'Permisos de llamada (Cámara/Micrófono) no disponibles o denegados en este navegador.'
            : 'Voice/Video permissions blocked or unavailable in this window.'
        );
      }
    }

    // 4. Request Real High Accuracy Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);

          fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, lat, lng, gpsConsent: true }),
          })
            .then(() => {
              setState((prev) => ({
                ...prev,
                meLat: lat,
                meLng: lng,
              }));
              showTempAlert(
                lang === 'es'
                  ? '¡Ubicación real de GPS activada con éxito! 📍'
                  : 'Real GPS coordinates active! 📍'
              );
            })
            .catch((e) => console.error('Error setting coordinates:', e));
        },
        (err) => {
          console.warn('GPS request failed, trying IP-based fallback...');
          showTempAlert(
            lang === 'es'
              ? '⚠️ GPS denegado o bloqueado. Intentando ubicarte de forma aproximada por IP...'
              : '⚠️ GPS blocked or unavailable. Trying to locate you approximately via IP...'
          );
          fetchIpLocation(
            lang === 'es' ? 'tu ciudad' : 'your city',
            (lat, lng, city) => {
              setUserLat(lat);
              setUserLng(lng);

              fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail, lat, lng, gpsConsent: true }),
              })
                .then(() => {
                  setState((prev) => ({
                    ...prev,
                    meLat: lat,
                    meLng: lng,
                  }));
                  showTempAlert(
                    lang === 'es'
                      ? `¡Ubicación aproximada fijada en ${city}! 📍`
                      : `Approximate location set to ${city}! 📍`
                  );
                })
                .catch((e) => console.error('Error setting coordinates via IP fallback:', e));
            },
            () => {
              showTempAlert(
                lang === 'es'
                  ? 'Búsqueda IP fallida. Escribe tu ciudad abajo en la barra de búsqueda para posicionarte con precisión. 🗺️'
                  : 'IP fallback failed. Type your city in the search bar below to position yourself! 🗺️'
              );
            }
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Open GPS sharing panel automatically so they see the maps immediately!
    setShowGpsPanel(true);
  };

  const handleSimulatePermissions = () => {
    setState((prev) => ({
      ...prev,
      meGpsConsent: true,
      partnerGpsConsent: true,
      partnerLat: 19.4442,
      partnerLng: -99.1419,
    }));
    setDismissGpsIntro(true);
    setShowGpsPanel(true);

    // Default safe coordinates
    setUserLat(19.4326);
    setUserLng(-99.1332);
    setPartnerLat(19.4442);
    setPartnerLng(-99.1419);

    fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUserEmail,
        gpsConsent: true,
        lat: 19.4326,
        lng: -99.1332,
      }),
    }).catch((e) => console.warn(e));

    addFloatingHearts();
    showTempAlert(
      lang === 'es'
        ? '¡Permisos telefónicos y GPS simulados con éxito! ❤️'
        : 'Simulated location & call permissions active! ❤️'
    );
  };

  return {
    showGpsPanel,
    setShowGpsPanel,
    dismissGpsIntro,
    setDismissGpsIntro,
    gpsPasscode,
    setGpsPasscode,
    gpsCode,
    setGpsCode,
    gpsStatus,
    setGpsStatus,
    partnerStatusStr,
    setPartnerStatusStr,
    gpsLocked,
    setGpsLocked,
    passcodeInput,
    setPasscodeInput,
    locationRequesting,
    setLocationRequesting,
    lastRequestTime,
    setLastRequestTime,
    userLat,
    setUserLat,
    userLng,
    setUserLng,
    partnerLat,
    setPartnerLat,
    partnerLng,
    setPartnerLng,
    gpsTravelMode,
    setGpsTravelMode,
    isSatelliteView,
    setIsSatelliteView,
    gpsSearchVal,
    setGpsSearchVal,
    gpsCustomSpot,
    setGpsCustomSpot,
    gpsRealtimeMovement,
    setGpsRealtimeMovement,
    googleMapsZoom,
    setGoogleMapsZoom,
    mapViewMode,
    setMapViewMode,
    myGeoQuery,
    setMyGeoQuery,
    partnerGeoQuery,
    setPartnerGeoQuery,
    geoSearching,
    setGeoSearching,
    searchAddress,
    triggerLocationRequest,
    handleRequestAllPermissions,
    handleSimulatePermissions,
  };
}

