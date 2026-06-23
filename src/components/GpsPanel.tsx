import React from 'react';
import { CoupleState, LanguageCode } from '../types';
import { Lock, MapPin } from 'lucide-react';
import { getHaversineDistance } from '../utils/geo';

type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycle';
type MapViewMode = 'radar' | 'gmap';
type GpsCustomSpot = { name: string; lat: number; lng: number } | null;

interface GpsPanelProps {
  state: CoupleState;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  t: (key: string) => string;
  lang: LanguageCode;
  currentUserEmail: string | null;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;

  gpsPasscode: string;
  gpsLocked: boolean;
  setGpsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  passcodeInput: string;
  setPasscodeInput: React.Dispatch<React.SetStateAction<string>>;

  userLat: number;
  userLng: number;
  setUserLat: React.Dispatch<React.SetStateAction<number>>;
  setUserLng: React.Dispatch<React.SetStateAction<number>>;
  partnerLat: number;
  partnerLng: number;
  setPartnerLat: React.Dispatch<React.SetStateAction<number>>;
  setPartnerLng: React.Dispatch<React.SetStateAction<number>>;

  mapViewMode: MapViewMode;
  setMapViewMode: React.Dispatch<React.SetStateAction<MapViewMode>>;
  isSatelliteView: boolean;
  setIsSatelliteView: React.Dispatch<React.SetStateAction<boolean>>;
  googleMapsZoom: number;
  setGoogleMapsZoom: React.Dispatch<React.SetStateAction<number>>;
  gpsSearchVal: string;
  setGpsSearchVal: React.Dispatch<React.SetStateAction<string>>;
  gpsCustomSpot: GpsCustomSpot;
  setGpsCustomSpot: React.Dispatch<React.SetStateAction<GpsCustomSpot>>;
  gpsTravelMode: TravelMode;
  setGpsTravelMode: React.Dispatch<React.SetStateAction<TravelMode>>;
  gpsRealtimeMovement: boolean;
  setGpsRealtimeMovement: React.Dispatch<React.SetStateAction<boolean>>;

  myGeoQuery: string;
  setMyGeoQuery: React.Dispatch<React.SetStateAction<string>>;
  partnerGeoQuery: string;
  setPartnerGeoQuery: React.Dispatch<React.SetStateAction<string>>;
  geoSearching: 'me' | 'partner' | null;
  searchAddress: (query: string, target: 'me' | 'partner') => void;

  locationRequesting: boolean;
  triggerLocationRequest: () => void;
  setShowGpsPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Interactive GPS / map sharing panel extracted from HomeSection.
 * Handles passcode  consent promp radar + Google Maps views,
 * geocoding search, manual coordinate entry, travel mode and live request.
 */
export default function GpsPanel({
  state,
  setState,
  t,
  lang,
  currentUserEmail,
  addFloatingHearts,
  showTempAlert,
  gpsPasscode,
  gpsLocked,
  setGpsLocked,
  passcodeInput,
  setPasscodeInput,
  userLat,
  userLng,
  setUserLat,
  setUserLng,
  partnerLat,
  partnerLng,
  setPartnerLat,
  setPartnerLng,
  mapViewMode,
  setMapViewMode,
  isSatelliteView,
  setIsSatelliteView,
  googleMapsZoom,
  setGoogleMapsZoom,
  gpsSearchVal,
  setGpsSearchVal,
  gpsCustomSpot,
  setGpsCustomSpot,
  gpsTravelMode,
  setGpsTravelMode,
  gpsRealtimeMovement,
  setGpsRealtimeMovement,
  myGeoQuery,
  setMyGeoQuery,
  partnerGeoQuery,
  setPartnerGeoQuery,
  geoSearching,
  searchAddress,
  locationRequesting,
  triggerLocationRequest,
  setShowGpsPanel,
}: GpsPanelProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 animate-fade-in shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#ff4d6d]" />
          <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider">
            {t('shareBtn')} (P2P GPS)
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[9px] font-mono text-slate-300">
          <Lock className="w-3 h-3 text-[#ff4d6d]" />
          <span>PIN: {gpsPasscode}</span>
        </div>
      </div>

      {gpsLocked ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-xs text-slate-300 font-bold">
            {lang === 'es'
              ? '⚠️ Esta ubicación está protegida para resguardar su privacidad'
              : '⚠️ This location is protected to safeguard your privacy'}
          </p>
          <div className="flex gap-2 max-w-[200px] mx-auto">
            <input
              type="password"
              maxLength={4}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="PIN PIN"
              className="bg-white/5 border border-white/10 rounded-lg text-center font-mono py-1 text-sm text-white w-full h-8 outline-none focus:border-[#ff4d6d]"
            />
            <button
              onClick={() => {
                if (passcodeInput === gpsPasscode) {
                  setGpsLocked(false);
                  setPasscodeInput('');
                  addFloatingHearts();
                } else {
                  showTempAlert(lang === 'es' ? 'PIN Incorrecto 🔒' : 'Incorrect PIN 🔒');
                }
              }}
              className="bg-[#ff4d6d] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#ff4d6d]/80 transition-all cursor-pointer"
            >
              Unlock
            </button>
          </div>
        </div>
      ) : !state.meGpsConsent ? (
        /* SECURE AUTHORIZATION PROMPT CHECK */
        <div className="bg-black/60 rounded-2xl p-5 border border-dashed border-[#ff4d6d]/40 space-y-4 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/25">
            <span className="text-2xl animate-pulse">🔒</span>
          </div>
          <h4 className="text-sm font-sans font-black text-white uppercase tracking-wider">
            {lang === 'es'
              ? 'Aviso de Autorización y Privacidad GPS'
              : 'GPS Privacy & Safe Authorization'}
          </h4>
          <p className="text-[11px] text-zinc-350 leading-relaxed max-w-sm mx-auto">
            {lang === 'es'
              ? 'Por seguridad, para visualizar la distancia en tiempo real y compartir ubicaciones mutuas, ambos extremos de la pareja deben activar explícitamente el consentimiento. No recopilamos datos en segundo plano sin permiso.'
              : 'For safety, to calculate real-time distance and display mutual coordinates, both partners must explicitly grant tracking consent. We never trace your movements in the background without permission.'}
          </p>
          <div className="flex gap-2 max-w-xs mx-auto justify-center">
            <button
              type="button"
              onClick={() => {
                // 1. Immediately authorized locally for instant and reactive UI feedback
                setState((prev) => ({
                  ...prev,
                  meGpsConsent: true,
                }));
                addFloatingHearts();
                showTempAlert(
                  lang === 'es'
                    ? '¡Has autorizado compartir tu ubicación! ⭐'
                    : 'You have authorized location sharing! ⭐'
                );

                // 2. Immediately send consent POST to server so next poll doesn't revert it
                fetch('/api/user/location', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: currentUserEmail, gpsConsent: true }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    console.log('Consent saved on server:', data);
                  })
                  .catch((e) => console.error('Error saving consent to server:', e));

                // 3. Try to query location in a non-blocking background thread with safe timeout
                if (navigator.geolocation) {
                  try {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setUserLat(lat);
                        setUserLng(lng);

                        // Send updated background coordinates to server
                        fetch('/api/user/location', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: currentUserEmail,
                            lat,
                            lng,
                            gpsConsent: true,
                          }),
                        })
                          .then(() => {
                            setState((prev) => ({
                              ...prev,
                              meLat: lat,
                              meLng: lng,
                            }));
                          })
                          .catch((e) => console.log('Error sending background coordinates:', e));
                      },
                      (err) => {
                        console.log('Optional background geolocation skipped/blocked:');
                      },
                      { enableHighAccuracy: true, timeout: 3000 }
                    );
                  } catch (err) {
                    console.error('Synchronous geolocation error caught safely:');
                  }
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:from-[#ff4d6d]/90 hover:to-purple-600/90 text-white font-sans text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer border-none"
            >
              {lang === 'es' ? '✏️ AUTORIZAR MI GPS' : '✏️ AUTHORIZE MY GPS'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowGpsPanel(false);
              }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
            >
              {lang === 'es' ? 'RECHAZAR' : 'DECLINE'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Map View Mode Selectors */}
          <div className="flex justify-between items-center bg-white/5 p-1.5 rounded-xl border border-white/10 text-[10px]">
            <span className="text-slate-300 font-bold ml-1.5 uppercase tracking-wide">
              {lang === 'es' ? '🗺️ MODO DE MAPA:' : '🗺️ MAP VIEW MODE:'}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setMapViewMode('radar');
                  addFloatingHearts();
                }}
                className={`px-2.5 py-1 rounded-md font-bold transition-all border-none cursor-pointer ${mapViewMode === 'radar' ? 'bg-[#ff4d6d] text-white shadow-sm' : 'text-slate-400 hover:bg-white/5'}`}
              >
                📡 {lang === 'es' ? 'RADAR EN VIVO' : 'LIVE RADAR'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapViewMode('gmap');
                  addFloatingHearts();
                }}
                className={`px-2.5 py-1 rounded-md font-bold transition-all border-none cursor-pointer ${mapViewMode === 'gmap' ? 'bg-[#ff4d6d] text-white shadow-sm' : 'text-slate-400 hover:bg-white/5'}`}
              >
                🗺️ GOOGLE MAPS
              </button>
            </div>
          </div>

          {/* MAP VISUAL CONTAINER */}
          {!userLat || !userLng ? (
            <div className="bg-black/60 rounded-2xl p-6 border border-dashed border-[#ff4d6d]/40 text-center space-y-4 h-[280px] flex flex-col justify-center items-center animate-fade-in">
              <div className="text-3xl animate-bounce">📍</div>
              <h4 className="text-xs font-sans font-black text-rose-400 uppercase tracking-wider">
                {lang === 'es'
                  ? 'OBTENIENDO TU UBICACIÓN EN TIEMPO REAL...'
                  : 'OBTAINING YOUR REAL-TIME LOCATION...'}
              </h4>
              <p className="text-[10px] text-slate-350 max-w-xs leading-relaxed">
                {lang === 'es'
                  ? 'Por favor, concede acceso a la ubicación si el navegador lo solicita para cargarte en el mapa interactivo.'
                  : 'Please grant location permissions when prompted by your browser to view yourself on the interactive map.'}
              </p>
              <button
                type="button"
                onClick={() => {
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
                          body: JSON.stringify({
                            email: currentUserEmail,
                            lat,
                            lng,
                            gpsConsent: true,
                          }),
                        }).catch((e) => console.log(e));
                      },
                      (err) => {
                        showTempAlert(
                          lang === 'es'
                            ? 'Error al obtener GPS. Actívalo en la configuración de tu navegador.'
                            : 'GPS Error. Enable it in your browser settings.'
                        );
                      },
                      { enableHighAccuracy: true, timeout: 6000 }
                    );
                  }
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none shadow-md"
              >
                {lang === 'es' ? '🔄 REINTENTAR OBTENER MI GPS' : '🔄 RETRY GPS LOCATION FETCH'}
              </button>
            </div>
          ) : mapViewMode === 'gmap' ? (
            /* OFFICIAL GOOGLE MAPS EMBED */
            <div className="relative rounded-2xl border border-white/15 overflow-hidden bg-[#121216] shadow-2xl h-[280px]">
              {/* Sticky Banner if partner hasn't loaded / consented GPS */}
              {(!state.partnerGpsConsent ||
                partnerLat === undefined ||
                partnerLng === undefined) && (
                <div className="absolute top-2 left-2 right-12 bg-rose-950/90 backdrop-blur-md text-white text-[9px] px-2 py-1.5 rounded-lg border border-[#ff4d6d]/30 z-35 flex items-center justify-between shadow-lg">
                  <div className="leading-tight">
                    <span className="font-bold text-rose-400">
                      📡 {lang === 'es' ? 'Esperando a tu pareja:' : 'Waiting for partner:'}
                    </span>{' '}
                    <span>{lang === 'es' ? 'Aún sin señal de GPS.' : 'No GPS signal yet.'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        partnerGpsConsent: true,
                        partnerLat: userLat + 0.003,
                        partnerLng: userLng - 0.003,
                      }));
                      showTempAlert(
                        lang === 'es'
                          ? 'Simulando ubicación de pareja! ❤️'
                          : 'Simulating partner location! ❤️'
                      );
                    }}
                    className="bg-[#ff4d6d] hover:bg-[#ff4d6d]/80 text-white font-sans text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer border-none uppercase ml-2 leading-none"
                  >
                    {lang === 'es' ? 'PROBAR SIMULACIÓN' : 'SIMULATE FOR TESTING'}
                  </button>
                </div>
              )}
              <iframe
                title="Google Maps Route"
                src={
                  !state.partnerGpsConsent || partnerLat === undefined || partnerLng === undefined
                    ? `https://maps.google.com/maps?q=${userLat},${userLng}&t=${isSatelliteView ? 'h' : 'm'}&z=${googleMapsZoom}&output=embed`
                    : `https://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${partnerLat},${partnerLng}&t=${isSatelliteView ? 'h' : 'm'}&z=${googleMapsZoom}&output=embed`
                }
                className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity animate-fade-in"
                allowFullScreen
                loading="lazy"
              />
              {/* Google Map zoom / Satellite indicators overlay */}
              <div className="absolute right-2 bottom-2 flex flex-col gap-1 z-20">
                <button
                  type="button"
                  onClick={() => setIsSatelliteView((prev) => !prev)}
                  className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center text-xs cursor-pointer border-none"
                  title="Google Satellite Mode"
                >
                  {isSatelliteView ? '🗺️' : '🛰️'}
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleMapsZoom((prev) => Math.min(18, prev + 1))}
                  className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                >
                  ï¼‹
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleMapsZoom((prev) => Math.max(10, prev - 1))}
                  className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                >
                  ï¼
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Google Map Simulation Chassis */
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#1e1e24] shadow-inner text-white h-[280px]">
              {/* Simulated Map Background (Satellite or Stylized Street Grid) */}
              <div
                className={`absolute inset-0 transition-colors duration-500 ${isSatelliteView ? 'bg-zinc-900' : 'bg-[#121216]'}`}
              >
                {/* Street grid pattern simulation */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1p transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1p transparent 1px)`,
                    backgroundSize: `${30 * (googleMapsZoom / 14)}px ${30 * (googleMapsZoom / 14)}px`,
                  }}
                />

                {/* Secondary diagonal street paths */}
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-white/[0.03] rotate-12 -translate-y-8 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-1/3 w-4 bg-white/[0.03] -rotate-45 pointer-events-none" />
                <div className="absolute top-1/4 bottom-0 right-1/4 w-3 bg-white/[0.03] rotate-45 pointer-events-none" />

                {/* Green park zones */}
                <div className="absolute top-8 left-12 w-24 h-16 rounded-full bg-emerald-950/25 border border-emerald-900/10 backdrop-blur-xs pointer-events-none" />
                <div className="absolute bottom-12 right-8 w-32 h-20 rounded-3xl bg-emerald-900/15 border border-emerald-900/5 backdrop-blur-xs pointer-events-none" />

                {/* Blue river/sea zone */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-blue-950/20 border-t border-blue-900/10 pointer-events-none" />
              </div>

              {/* Sticky Banner if partner hasn't loaded / consented GPS */}
              {(!state.partnerGpsConsent ||
                partnerLat === undefined ||
                partnerLng === undefined) && (
                <div className="absolute top-12 left-2 right-2 bg-rose-950/90 backdrop-blur-md text-white text-[9px] px-2 py-1.5 rounded-lg border border-[#ff4d6d]/30 z-35 flex items-center justify-between shadow-lg">
                  <div className="leading-tight">
                    <span className="font-bold text-rose-400">
                      📡 {lang === 'es' ? 'Esperando a tu pareja:' : 'Waiting for partner:'}
                    </span>{' '}
                    <span>{lang === 'es' ? 'Aún sin señal de GPS.' : 'No GPS signal yet.'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        partnerGpsConsent: true,
                        partnerLat: userLat + 0.003,
                        partnerLng: userLng - 0.003,
                      }));
                      showTempAlert(
                        lang === 'es'
                          ? 'Simulando ubicación de pareja! ❤️'
                          : 'Simulating partner location! ❤️'
                      );
                    }}
                    className="bg-[#ff4d6d] hover:bg-[#ff4d6d]/80 text-white font-sans text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer border-none uppercase ml-2 leading-none"
                  >
                    {lang === 'es' ? 'PROBAR SIMULACIÓN' : 'SIMULATE FOR TESTING'}
                  </button>
                </div>
              )}

              {/* Map Search Overlay Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!gpsSearchVal.trim()) return;
                  const uLat = userLat !== undefined ? userLat : 0;
                  const uLng = userLng !== undefined ? userLng : 0;
                  const pLat =
                    partnerLat !== undefined && state.partnerGpsConsent ? partnerLat : uLat + 0.003;
                  const pLng =
                    partnerLng !== undefined && state.partnerGpsConsent ? partnerLng : uLng - 0.003;
                  const midwayLat = (uLat + pLat) / 2 + 0.0015;
                  const midwayLng = (uLng + pLng) / 2 - 0.001;
                  setGpsCustomSpot({
                    name: gpsSearchVal,
                    lat: midwayLat,
                    lng: midwayLng,
                  });
                  addFloatingHearts();
                  showTempAlert(
                    lang === 'es'
                      ? `¡${gpsSearchVal} marcado para cita! ❤️`
                      : `${gpsSearchVal} marked as meeting spot! ❤️`
                  );
                  setGpsSearchVal('');
                }}
                className="absolute top-2 left-2 right-2 flex gap-1 z-20"
              >
                <div className="flex-1 bg-black/75 backdrop-blur-md rounded-xl border border-white/10 flex items-center px-2.5 py-1">
                  <span className="text-slate-400 text-xs mr-2">🔍</span>
                  <input
                    type="text"
                    value={gpsSearchVal}
                    onChange={(e) => setGpsSearchVal(e.target.value)}
                    placeholder={t('gpsSearchPlaceholder')}
                    className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none w-full border-none focus:ring-0 p-0"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#ff4d6d] text-white px-3 rounded-xl text-xs font-bold hover:bg-[#ff4d6d]/95 cursor-pointer flex items-center shadow-md border-none"
                >
                  Go
                </button>
              </form>

              {/* Calculations for dynamic positions inside the UI */}
              {(() => {
                const uLat = userLat !== undefined ? userLat : 0;
                const uLng = userLng !== undefined ? userLng : 0;

                const hasPartner =
                  state.partnerGpsConsent && partnerLat !== undefined && partnerLng !== undefined;
                const pLat = hasPartner ? partnerLat! : uLat + 0.001; // dummy fallback just to avoid zoom calculations exploding
                const pLng = hasPartner ? partnerLng! : uLng + 0.001;

                const centerLat = (uLat + pLat) / 2;
                const centerLng = (uLng + pLng) / 2;

                // Make map scaling adaptive to current distance, or fall back to standard factor
                const dLat = Math.abs(uLat - pLat);
                const dLng = Math.abs(uLng - pLng);
                const maxDiff = Math.max(dLat, dLng, 0.005);
                // scale factor to fit both markers cleanly inside 10% to 90% coordinates bounds
                const scaleFactor = Math.min(6000, 35 / maxDiff) * (googleMapsZoom / 14);

                const pctUserX = Math.min(88, Math.max(12, 50 + (uLng - centerLng) * scaleFactor));
                const pctUserY = Math.min(88, Math.max(12, 50 - (uLat - centerLat) * scaleFactor));

                const pctPartnerX = Math.min(
                  88,
                  Math.max(12, 50 + (pLng - centerLng) * scaleFactor)
                );
                const pctPartnerY = Math.min(
                  88,
                  Math.max(12, 50 - (pLat - centerLat) * scaleFactor)
                );

                const distanceKm = getHaversineDistance(uLat, uLng, pLat, pLng);
                const formattedDistance = hasPartner
                  ? `${distanceKm.toFixed(3)} km`
                  : lang === 'es'
                    ? 'Falta señal de pareja'
                    : 'Waiting for partner signal';

                const speedKmh =
                  gpsTravelMode === 'driving'
                    ? 45
                    : gpsTravelMode === 'walking'
                      ? 4.5
                      : gpsTravelMode === 'transit'
                        ? 25
                        : 15;
                const meetTimeMin = Math.round((distanceKm / speedKmh) * 60) + 1;
                const formattedTimeStr = hasPartner
                  ? meetTimeMin < 60
                    ? `${meetTimeMin} mins`
                    : `${Math.floor(meetTimeMin / 60)}h ${meetTimeMin % 60}m`
                  : 'N/A';

                const googleMapsUrl = hasPartner
                  ? `https://www.google.com/maps/dir/?api=1&origin=${uLat},${uLng}&destination=${pLat},${pLng}`
                  : `https://www.google.com/maps/search/?api=1&query=${uLat},${uLng}`;

                return (
                  <>
                    {/* Connection Route Vector Line (Only if partner exists) */}
                    {hasPartner && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <line
                          x1={`${pctUserX}%`}
                          y1={`${pctUserY}%`}
                          x2={`${pctPartnerX}%`}
                          y2={`${pctPartnerY}%`}
                          stroke="#ff4d6d"
                          strokeWidth="2.5"
                          strokeDasharray="4,5"
                        />
                      </svg>
                    )}

                    {/* Map HUD floating status info card */}
                    <div className="absolute bottom-2 left-2 bg-black/90 backdrop-blur-md rounded-xl p-2.5 border border-white/20 z-20 text-[10px] space-y-1.5 text-slate-300 shadow-xl max-w-[170px]">
                      <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                        <span>🧭</span>
                        <span className="text-[#ff4d6d] font-black uppercase tracking-wider">
                          {gpsTravelMode.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-0.5 font-mono text-[9px]">
                        <p className="font-bold flex justify-between gap-2">
                          <span>{lang === 'es' ? 'Distancia:' : 'Distance:'}</span>
                          <span className="text-[#ff4d6d] font-black">{formattedDistance}</span>
                        </p>
                        <p className="flex justify-between gap-1">
                          <span>{lang === 'es' ? 'Estimación:' : 'Estimate:'}</span>
                          <span className="text-emerald-400 font-bold">~{formattedTimeStr}</span>
                        </p>
                      </div>

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-[9px] bg-[#ff4d6d] hover:bg-[#ff4d6d]/80 text-white font-black py-1 px-2 rounded transition-colors uppercase tracking-wider no-underline"
                      >
                        🗺️ {lang === 'es' ? 'ABRIR RUTA GOOGLE MAPS' : 'VIEW GOOGLE MAPS ROUTE'}
                      </a>
                    </div>

                    {/* Map Control right toolbar */}
                    <div className="absolute right-2 bottom-2 flex flex-col gap-1 z-20">
                      <button
                        type="button"
                        onClick={() => setIsSatelliteView((prev) => !prev)}
                        className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center text-xs cursor-pointer border-none"
                        title="Satellite Mode"
                      >
                        {isSatelliteView ? '🗺️' : '🛰️'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleMapsZoom((prev) => Math.min(18, prev + 1))}
                        className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                      >
                        ï¼‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleMapsZoom((prev) => Math.max(10, prev - 1))}
                        className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                      >
                        ï¼
                      </button>
                    </div>

                    {/* Me Map Node Marker */}
                    <div
                      className="absolute h-9 w-9 -ml-4.5 -mt-4.5 flex flex-col items-center justify-center z-20 cursor-pointer shadow-lg animate-pulse"
                      style={{ left: `${pctUserX}%`, top: `${pctUserY}%` }}
                    >
                      <div className="relative">
                        <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 text-emerald-400 text-[10px]">
                          📍
                        </span>
                        <div className="w-6 h-6 rounded-full border border-emerald-400 bg-emerald-500 overflow-hidden relative p-[1px]">
                          <img
                            src={state.meAvatar}
                            className="w-full h-full object-cover rounded-full"
                            alt="Me"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom point Heart Pin if active */}
                    {gpsCustomSpot && (
                      <div
                        className="absolute h-8 w-8 -ml-4 -mt-4 flex flex-col items-center justify-center z-20 bg-rose-950/90 border border-[#ff4d6d]/40 rounded-full cursor-pointer p-0.5"
                        style={{ left: '50%', top: '45%' }}
                        onClick={() => {
                          setGpsCustomSpot(null);
                          showTempAlert(
                            lang === 'es' ? 'Sitio de cita removido' : 'Date meeting spot removed'
                          );
                        }}
                      >
                        <span className="text-[10px] leading-none">💝</span>
                        <span className="text-[6px] text-white font-black truncate max-w-[28px] uppercase">
                          {gpsCustomSpot.name}
                        </span>
                      </div>
                    )}

                    {/* Partner Map Node Marker (Only if partner signal is live) */}
                    {hasPartner && (
                      <div
                        className="absolute h-9 w-9 -ml-4.5 -mt-4.5 flex flex-col items-center justify-center z-20 cursor-pointer shadow-lg"
                        style={{ left: `${pctPartnerX}%`, top: `${pctPartnerY}%` }}
                      >
                        <div className="relative">
                          <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 text-[#ff4d6d] text-[10px]">
                            📍
                          </span>
                          <div className="w-6 h-6 rounded-full border border-[#ff4d6d] bg-[#ff4d6d] overflow-hidden relative p-[1px]">
                            <img
                              src={state.partnerAvatar}
                              className="w-full h-full object-cover rounded-full"
                              alt="Partner"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Real geographical search engine using OpenStreetMap Nominatim */}
          <div className="p-3 bg-white/5 border border-[#ff4d6d]/25 rounded-2xl space-y-3 text-[10px]">
            <div>
              <span className="text-[#ff4d6d] font-bold block uppercase tracking-wider mb-1">
                🗺️ {lang === 'es' ? 'Fijar Ubicación Real en el Mapa' : 'Set Real Map Location'}
              </span>
              <p className="text-zinc-400 text-[9px] leading-snug">
                {lang === 'es'
                  ? 'Por defecto estás en la Ciudad de México. Escribe tu ciudad/país verdadero abajo para mover tu GPS exactamente donde estás:'
                  : 'You are in Mexico City by default. Type your real city or country here to update your actual GPS spot:'}
              </p>
            </div>

            <div className="space-y-2">
              {/* Mine Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchAddress(myGeoQuery, 'me');
                }}
                className="space-y-1"
              >
                <label className="text-zinc-300 font-bold block">
                  {lang === 'es' ? '📍 Mi Ciudad o Dirección real:' : '📍 My Real City or Address:'}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={myGeoQuery}
                    onChange={(e) => setMyGeoQuery(e.target.value)}
                    placeholder={
                      lang === 'es'
                        ? 'Ej: Bogota, Colombia o Madrid, Espana'
                        : 'E.g. Bogota, Colombia or Madrid, Spain'
                    }
                    className="flex-1 text-[10px] bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-white placeholder:text-zinc-600 outline-none focus:border-[#ff4d6d]"
                  />
                  <button
                    type="submit"
                    disabled={geoSearching === 'me'}
                    className="bg-[#ff4d6d] hover:bg-[#ff4d6d]/90 text-white font-sans text-[10px] px-3 rounded-xl border-none cursor-pointer font-bold shrink-0 flex items-center gap-1"
                  >
                    {geoSearching === 'me' ? '⏱️...' : lang === 'es' ? 'Ubicarme' : 'Locate Me'}
                  </button>
                </div>
              </form>

              {/* Partner Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchAddress(partnerGeoQuery, 'partner');
                }}
                className="space-y-1 pt-1.5 border-t border-white/5"
              >
                <label className="text-zinc-300 font-bold block">
                  {lang === 'es'
                    ? '👥 Ciudad o Dirección de mi Pareja:'
                    : "👥 Partner's City or Address:"}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={partnerGeoQuery}
                    onChange={(e) => setPartnerGeoQuery(e.target.value)}
                    placeholder={
                      lang === 'es'
                        ? 'Ej: Buenos Aires o Santiago, Chile'
                        : 'E.g. Buenos Aires or Santiago, Chile'
                    }
                    className="flex-1 text-[10px] bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-white placeholder:text-zinc-600 outline-none focus:border-[#ff4d6d]"
                  />
                  <button
                    type="submit"
                    disabled={geoSearching === 'partner'}
                    className="bg-purple-650 hover:bg-purple-600 text-white font-sans text-[10px] px-3 rounded-xl border-none cursor-pointer font-bold shrink-0 flex items-center gap-1"
                  >
                    {geoSearching === 'partner'
                      ? '⏱️...'
                      : lang === 'es'
                        ? 'Ubicar Pareja'
                        : 'Locate Partner'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coordinates Inputs */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl grid grid-cols-2 gap-3 text-[10px]">
            <div className="space-y-1">
              <span className="text-zinc-300 font-bold block">
                {lang === 'es' ? 'Tus de Coordenadas:' : 'Your Coordinates:'}
              </span>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.0001"
                  value={userLat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserLat(val);
                    fetch('/api/user/location', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: currentUserEmail, lat: val, lng: userLng }),
                    }).catch((err) => console.log(err));
                  }}
                  className="w-1/2 text-[9px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={userLng}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserLng(val);
                    fetch('/api/user/location', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: currentUserEmail, lat: userLat, lng: val }),
                    }).catch((err) => console.log(err));
                  }}
                  className="w-1/2 text-[9px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono"
                  placeholder="Lng"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-300 font-bold block">
                {lang === 'es' ? 'Coordenadas de Pareja:' : "Partner's Coordinates:"}
              </span>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.0001"
                  value={partnerLat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPartnerLat(val);
                  }}
                  className="w-1/2 text-[9px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={partnerLng}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPartnerLng(val);
                  }}
                  className="w-1/2 text-[9px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono"
                  placeholder="Lng"
                />
              </div>
            </div>
          </div>

          {/* Slider simulation adjusters */}
          <div className="grid grid-cols-2 gap-3 text-[10px] bg-white/5 p-2 rounded-xl border border-white/5">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">
                {lang === 'es' ? 'Ajustar tu Longitud:' : 'Adjust Your Longitude:'}
              </span>
              <input
                type="range"
                min={userLng - 0.15}
                max={userLng + 0.15}
                step={0.0001}
                value={userLng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setUserLng(val);
                  addFloatingHearts();
                  fetch('/api/user/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentUserEmail, lat: userLat, lng: val }),
                  }).catch((err) => console.log(err));
                }}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff4d6d]"
              />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">
                {lang === 'es' ? 'Ajustar Longitud Pareja:' : "Adjust Partner's Longitude:"}
              </span>
              <input
                type="range"
                min={partnerLng - 0.15}
                max={partnerLng + 0.15}
                step={0.0001}
                value={partnerLng}
                onChange={(e) => {
                  setPartnerLng(parseFloat(e.target.value));
                  addFloatingHearts();
                }}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff4d6d]"
              />
            </div>
          </div>

          {/* Status and privacy actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Travel Mode selector */}
            <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
              <p className="text-[9px] font-extrabold text-[#ff4d6d] uppercase tracking-wider">
                {t('gpsTravelMode')}:
              </p>
              <div className="grid grid-cols-4 gap-1 mt-1 text-center font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setGpsTravelMode('driving');
                    addFloatingHearts();
                  }}
                  className={`p-1 bg-white/5 rounded-md transition-colors cursor-pointer text-xs border-none ${gpsTravelMode === 'driving' ? 'bg-[#ff4d6d] text-white' : 'text-slate-400'}`}
                  title="Driving"
                >
                  🚗
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGpsTravelMode('walking');
                    addFloatingHearts();
                  }}
                  className={`p-1 bg-white/5 rounded-md transition-colors cursor-pointer text-xs border-none ${gpsTravelMode === 'walking' ? 'bg-[#ff4d6d] text-white' : 'text-slate-400'}`}
                  title="Walking"
                >
                  🚶
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGpsTravelMode('transit');
                    addFloatingHearts();
                  }}
                  className={`p-1 bg-white/5 rounded-md transition-colors cursor-pointer text-xs border-none ${gpsTravelMode === 'transit' ? 'bg-[#ff4d6d] text-white' : 'text-slate-400'}`}
                  title="Transit"
                >
                  🚌
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGpsTravelMode('bicycle');
                    addFloatingHearts();
                  }}
                  className={`p-1 bg-white/5 rounded-md transition-colors cursor-pointer text-xs border-none ${gpsTravelMode === 'bicycle' ? 'bg-[#ff4d6d] text-white' : 'text-slate-400'}`}
                  title="Bicycle"
                >
                  🚲
                </button>
              </div>
            </div>

            {/* GPS Settings configuration */}
            <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col justify-between text-[10px]">
              <div className="flex justify-between items-center bg-black/30 p-1 rounded">
                <span className="font-bold text-slate-300">
                  {lang === 'es' ? 'Rastreo GPS:' : 'GPS Tracking:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGpsRealtimeMovement((prev) => !prev);
                    showTempAlert(
                      gpsRealtimeMovement
                        ? lang === 'es'
                          ? 'Movimiento de simulación pausado'
                          : 'Simulation movement paused'
                        : lang === 'es'
                          ? 'Movimiento en tiempo real activado 🛰️'
                          : 'Real-time movement activated 🛰️'
                    );
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black border-none leading-none ${gpsRealtimeMovement ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-350'}`}
                >
                  {gpsRealtimeMovement ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px]">
                <button
                  type="button"
                  onClick={() => setGpsLocked(true)}
                  className="text-[#ff4d6d] hover:underline font-bold border-none bg-none"
                >
                  🔒 {lang === 'es' ? 'Bloquear GPS' : 'Lock GPS'}
                </button>
                <span className="text-slate-500 font-mono">PIN: {gpsPasscode}</span>
              </div>
            </div>
          </div>

          {/* Request real-time location */}
          <button
            type="button"
            onClick={triggerLocationRequest}
            disabled={locationRequesting}
            className="w-full py-2.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:from-[#ff4d6d]/90 hover:to-purple-600/90 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-none"
          >
            {locationRequesting ? (
              <span className="animate-spin text-sm">🔄</span>
            ) : (
              <span className="text-sm">📍</span>
            )}
            {t('requestGpsLoc')}
          </button>
        </div>
      )}
    </section>
  );
}

