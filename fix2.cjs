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
  
  c = c.replace(/setPasscodeInpu\r?\n/g, 'setPasscodeInput,\n');
  c = c.replace(/setUserLa\r?\n/g, 'setUserLat,\n');
  c = c.replace(/setPartnerLa\r?\n/g, 'setPartnerLat,\n');
  c = c.replace(/setGpsCustomSpo\r?\n/g, 'setGpsCustomSpot,\n');
  c = c.replace(/gpsRealtimeMovemen\r?\n/g, 'gpsRealtimeMovement,\n');
  c = c.replace(/setGpsRealtimeMovemen\r?\n/g, 'setGpsRealtimeMovement,\n');
  c = c.replace(/profileNameInpu\r?\n/g, 'profileNameInput,\n');
  c = c.replace(/profileNameInpu\b/g, 'profileNameInput');
  c = c.replace(/ipLa\r?\n/g, 'ipLat,\n');
  c = c.replace(/la\r?\n/g, 'lat,\n');

  // App.tsx
  c = c.replace(/partnerName: data\.partner\r?\n/g, 'partnerName: data.partner,\n');
  c = c.replace(/meLng: data\.user\.lng,\r?\n/g, 'meLng: data.user.lng,\n');
  // EditProfileModal.tsx
  c = c.replace(/avatar: avatar,\r?\n/g, 'avatar: avatar\n');
  c = c.replace(/\[target === 'me' \? 'meAvatar' : 'partnerAvatar'\]: avatar,\r?\n/g, '[target === \'me\' ? \'meAvatar\' : \'partnerAvatar\']: avatar\n');
  
  if (c !== o) { fs.writeFileSync(f, c); console.log('Fixed', f); }
});
