const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;
  c = c.replace(/useEffec /g, 'useEffect, ');
  c = c.replace(/Reac /g, 'React, ');
  c = c.replace(/currentUserE /g, 'currentUserEmail, ');
  c = c.replace(/la lng/g, 'lat, lng');
  c = c.replace(/ipLa ipLng/g, 'ipLat, ipLng');
  c = c.replace(/state\.meLa /g, 'state.meLat, ');
  c = c.replace(/state\.partnerLa /g, 'state.partnerLat, ');
  c = c.replace(/appToas /g, 'appToast, ');
  c = c.replace(/dateAler /g, 'dateAlert, ');
  c = c.replace(/selectedPhotoForLightbo /g, 'selectedPhotoForLightbox, ');
  c = c.replace(/showTempAler /g, 'showTempAlert, ');
  c = c.replace(/userLa /g, 'userLat, ');
  c = c.replace(/partnerLa /g, 'partnerLat, ');
  c = c.replace(/gpsCustomSpo /g, 'gpsCustomSpot, ');
  c = c.replace(/gpsRealtimeMovemen /g, 'gpsRealtimeMovement, ');
  c = c.replace(/setPasscodeInpu /g, 'setPasscodeInput, ');
  c = c.replace(/setUserLa /g, 'setUserLat, ');
  c = c.replace(/setPartnerLa /g, 'setPartnerLat, ');
  c = c.replace(/setGpsCustomSpo /g, 'setGpsCustomSpot, ');
  c = c.replace(/setGpsRealtimeMovemen /g, 'setGpsRealtimeMovement, ');
  c = c.replace(/ENDPOIN /g, 'ENDPOINT, ');
  c = c.replace(/add i \*/g, 'addFloatingHearts, i *');
  c = c.replace(/add j \*/g, 'addFloatingHearts, j *');
  c = c.replace(/add index \*/g, 'addFloatingHearts, index *');
  c = c.replace(/\badd\n/g, 'addFloatingHearts,\n');
  c = c.replace(/\{ audio: true: false \}/g, '{ audio: true, video: false }');
  c = c.replace(/\{ audio: true: true \}/g, '{ audio: true, video: true }');
  c = c.replace(/\{ \.\.\.ini headers \}/g, '{ ...init, headers }');
  c = c.replace(/descDefault: '(.*?)':/g, 'descDefault: \'$1\',');
  c = c.replace(/titleDefault: '(.*?)':/g, 'titleDefault: \'$1\',');
  if (c !== o) { fs.writeFileSync(f, c); console.log('Fixed', f); }
});
