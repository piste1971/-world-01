const fs = require('fs');
const path = require('path');

const OUT = path.join(process.cwd(), 'mission000_seedance_keyframes');
fs.mkdirSync(OUT, { recursive: true });

const W = 1920;
const H = 1080;
const colors = {
  black: '#050505',
  charcoal: '#11110F',
  warm: '#E8E3D8',
  muted: '#8B8881',
  dim: '#55524D',
  bronze: '#A78252',
  bronze2: '#715A3D',
  line: '#3A3731',
};

const esc = (s) => String(s)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function txt(x, y, value, size = 22, color = colors.warm, opts = {}) {
  const anchor = opts.anchor || 'start';
  const weight = opts.weight || 400;
  const spacing = opts.spacing ?? 2.2;
  const opacity = opts.opacity ?? 1;
  return `<text x="${x}" y="${y}" fill="${color}" font-family="DejaVu Sans Mono, monospace" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`;
}

function lines(x, y, values, size = 22, gap = 38, color = colors.warm, opts = {}) {
  return values.map((v, i) => txt(x, y + i * gap, v, size, color, opts)).join('\n');
}

function shell(opacity = 0.42) {
  return `
    <rect width="${W}" height="${H}" fill="${colors.black}" opacity="${opacity}"/>
    <rect x="54" y="54" width="1812" height="972" rx="2" fill="none" stroke="${colors.line}" stroke-width="1" opacity="0.48"/>
    ${txt(86, 102, 'WORLD//01', 25, colors.warm, { weight: 700, spacing: 4 })}
    ${txt(1834, 102, 'MERIDIAN RELAY / MISSION 000', 14, colors.muted, { anchor: 'end', spacing: 2.4 })}
    <line x1="86" y1="126" x2="1834" y2="126" stroke="${colors.line}" stroke-width="1" opacity="0.75"/>
    ${txt(86, 997, 'THE WORLD IS THE ROOM', 12, colors.dim, { spacing: 3.2 })}
    ${txt(1834, 997, 'ARCHIVE CHANNEL 00', 12, colors.dim, { anchor: 'end', spacing: 2.4 })}
  `;
}

function panel(x, y, w, h, opacity = 0.88) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${colors.black}" opacity="${opacity}" stroke="${colors.line}" stroke-width="1"/>`;
}

function button(x, y, w, label, enabled = true) {
  const stroke = enabled ? colors.bronze : colors.line;
  const textColor = enabled ? colors.warm : colors.dim;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="68" rx="2" fill="${enabled ? '#19150F' : '#0D0D0C'}" stroke="${stroke}" stroke-width="1.4"/>
    ${txt(x + w / 2, y + 43, label, 17, textColor, { anchor: 'middle', weight: 700, spacing: 2.8 })}
  `;
}

function mapRoute(progress = 1, tokyoOpacity = 1, florenceOpacity = 1) {
  // Coordinates are aligned to the generated background map.
  const tx = 1623, ty = 460;
  const fx = 1034, fy = 419;
  const total = 680;
  return `
    <path d="M ${tx} ${ty} Q 1325 285 ${fx} ${fy}" fill="none" stroke="${colors.bronze}" stroke-width="2" opacity="0.66" stroke-dasharray="${Math.round(total * progress)} ${total}" filter="url(#softGlow)"/>
    <circle cx="${tx}" cy="${ty}" r="17" fill="none" stroke="${colors.bronze}" stroke-width="1" opacity="${0.42 * tokyoOpacity}"/>
    <circle cx="${tx}" cy="${ty}" r="5" fill="${colors.warm}" opacity="${tokyoOpacity}" filter="url(#softGlow)"/>
    ${txt(tx - 22, ty - 30, 'TOKYO', 13, colors.muted, { anchor: 'end', spacing: 2, opacity: tokyoOpacity })}
    <circle cx="${fx}" cy="${fy}" r="18" fill="none" stroke="${colors.bronze}" stroke-width="1" opacity="${0.48 * florenceOpacity}"/>
    <circle cx="${fx}" cy="${fy}" r="6" fill="${colors.warm}" opacity="${florenceOpacity}" filter="url(#softGlow)"/>
    ${txt(fx - 22, fy + 42, 'FLORENCE', 13, colors.muted, { anchor: 'end', spacing: 2, opacity: florenceOpacity })}
  `;
}

function statusLabel(x, y, label, value, accent = false) {
  return `
    ${txt(x, y, label, 13, colors.dim, { spacing: 2.2 })}
    ${txt(x, y + 33, value, 20, accent ? colors.bronze : colors.warm, { weight: 600, spacing: 1.8 })}
  `;
}

function waveform(x, y, w, h, progress = 0.68) {
  const bars = [0.18,0.3,0.52,0.28,0.72,0.42,0.84,0.35,0.62,0.91,0.46,0.68,0.32,0.76,0.49,0.88,0.41,0.57,0.29,0.65,0.37,0.81,0.48,0.7,0.25,0.54,0.34,0.78,0.44,0.59,0.21,0.67,0.38,0.83,0.45,0.61,0.31,0.73,0.4,0.56,0.24,0.69,0.36,0.8,0.43,0.63,0.27,0.5];
  const gap = w / bars.length;
  const active = Math.floor(bars.length * progress);
  return bars.map((v, i) => {
    const bh = Math.max(5, h * v);
    const bx = x + i * gap;
    const by = y + (h - bh) / 2;
    return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${Math.max(2, gap - 5).toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="${i <= active ? colors.bronze : colors.line}" opacity="${i <= active ? 0.9 : 0.55}"/>`;
  }).join('\n');
}

function defs() {
  return `<defs>
    <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function renderState(state) {
  let body = '';
  let dim = 0.44;

  if (state === 'landing') {
    dim = 0.70;
    body = `
      ${txt(960, 270, 'REGISTRATION COMPLETE', 15, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 390, 'AGENT #004817', 54, colors.warm, { anchor: 'middle', weight: 700, spacing: 5 })}
      ${txt(960, 452, 'STATUS: CANDIDATE', 17, colors.muted, { anchor: 'middle', spacing: 3.5 })}
      ${button(690, 570, 540, 'BEGIN MISSION 000', true)}
      ${txt(960, 680, 'MISSION 000 IS FREE', 12, colors.dim, { anchor: 'middle', spacing: 3 })}
    `;
  }

  if (state === 'request') {
    dim = 0.72;
    body = `
      ${txt(960, 352, 'MISSION 000', 16, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 451, 'ENTRY REQUEST RECEIVED', 36, colors.warm, { anchor: 'middle', weight: 600, spacing: 4 })}
      <line x1="770" y1="505" x2="1150" y2="505" stroke="${colors.line}"/>
      ${statusLabel(775, 558, 'AGENT', '#004817')}
      ${statusLabel(1030, 558, 'STATUS', 'CANDIDATE', true)}
      ${txt(960, 705, 'CHECKING AVAILABLE RELAYS', 13, colors.dim, { anchor: 'middle', spacing: 3 })}
      <circle cx="960" cy="755" r="4" fill="${colors.bronze}" opacity="0.9"/>
    `;
  }

  if (state === 'incoming') {
    dim = 0.28;
    body = `
      ${mapRoute(1, 1, 1)}
      ${panel(118, 214, 530, 536, 0.91)}
      ${txt(162, 270, 'INCOMING RELAY DETECTED', 22, colors.warm, { weight: 700, spacing: 2.4 })}
      <line x1="162" y1="300" x2="604" y2="300" stroke="${colors.line}"/>
      ${statusLabel(162, 350, 'SOURCE', 'CANDIDATE #003921')}
      ${statusLabel(162, 432, 'LOCATION', 'TOKYO')}
      ${statusLabel(162, 514, 'DESTINATION', 'FLORENCE')}
      ${statusLabel(162, 596, 'RECORDED', '03H 17M AGO')}
      ${statusLabel(162, 678, 'PACKET INTEGRITY', '100%', true)}
    `;
  }

  if (state === 'audio_ready') {
    dim = 0.40;
    body = `
      ${mapRoute(1, 0.68, 0.68)}
      ${panel(355, 260, 1210, 485, 0.94)}
      ${txt(410, 322, 'AUDIO FRAGMENT 1/2', 17, colors.bronze, { weight: 700, spacing: 3 })}
      ${txt(1510, 322, 'SOURCE / CANDIDATE #003921 / TOKYO', 12, colors.dim, { anchor: 'end', spacing: 1.8 })}
      <line x1="410" y1="355" x2="1510" y2="355" stroke="${colors.line}"/>
      ${waveform(450, 425, 1020, 118, 0)}
      ${txt(450, 590, '00:00', 13, colors.dim, { spacing: 1 })}
      ${txt(1470, 590, '00:07', 13, colors.dim, { anchor: 'end', spacing: 1 })}
      ${button(720, 630, 480, 'PLAY RELAY', true)}
    `;
  }

  if (state === 'audio_playing') {
    dim = 0.40;
    body = `
      ${mapRoute(1, 0.68, 0.68)}
      ${panel(355, 260, 1210, 485, 0.94)}
      ${txt(410, 322, 'AUDIO FRAGMENT 1/2', 17, colors.bronze, { weight: 700, spacing: 3 })}
      ${txt(1510, 322, 'SOURCE / CANDIDATE #003921 / TOKYO', 12, colors.dim, { anchor: 'end', spacing: 1.8 })}
      <line x1="410" y1="355" x2="1510" y2="355" stroke="${colors.line}"/>
      ${waveform(450, 425, 1020, 118, 0.72)}
      <line x1="1184" y1="407" x2="1184" y2="562" stroke="${colors.warm}" stroke-width="1" opacity="0.75"/>
      ${txt(450, 590, '00:05', 13, colors.warm, { spacing: 1 })}
      ${txt(1470, 590, '00:07', 13, colors.dim, { anchor: 'end', spacing: 1 })}
      ${txt(960, 675, 'PLAYBACK IN PROGRESS', 13, colors.muted, { anchor: 'middle', spacing: 3 })}
    `;
  }

  if (state === 'audio_complete') {
    dim = 0.48;
    body = `
      ${mapRoute(1, 0.54, 0.78)}
      ${panel(465, 298, 990, 405, 0.94)}
      ${txt(960, 375, 'PLAYBACK COMPLETE', 15, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 469, 'VERIFYING RELAY ORIGIN', 30, colors.warm, { anchor: 'middle', weight: 600, spacing: 3.2 })}
      <line x1="730" y1="523" x2="1190" y2="523" stroke="${colors.line}"/>
      ${txt(960, 588, 'CANDIDATE #003921 / TOKYO', 15, colors.muted, { anchor: 'middle', spacing: 2.5 })}
      ${txt(960, 645, 'SIGNATURE MATCH FOUND', 13, colors.dim, { anchor: 'middle', spacing: 2.5 })}
    `;
  }

  if (state === 'custody') {
    dim = 0.32;
    body = `
      ${mapRoute(1, 0.24, 1)}
      ${panel(420, 278, 1080, 455, 0.92)}
      ${txt(960, 354, 'RELAY RECEIVED', 15, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 435, 'CHAIN OF CUSTODY TRANSFERRED', 29, colors.warm, { anchor: 'middle', weight: 600, spacing: 3 })}
      <line x1="570" y1="487" x2="1350" y2="487" stroke="${colors.line}"/>
      ${statusLabel(570, 548, 'FROM', 'CANDIDATE #003921 / TOKYO')}
      ${statusLabel(1035, 548, 'TO', 'AGENT #004817 / FLORENCE', true)}
      ${txt(960, 676, 'TRANSFER COMPLETE', 13, colors.muted, { anchor: 'middle', spacing: 3 })}
    `;
  }

  if (state === 'routing') {
    dim = 0.48;
    body = `
      ${mapRoute(1, 0.18, 0.9)}
      ${panel(480, 300, 960, 408, 0.94)}
      ${txt(960, 382, 'SECOND FRAGMENT', 16, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 472, 'ROUTING TO REGISTERED CHANNEL', 28, colors.warm, { anchor: 'middle', weight: 600, spacing: 2.8 })}
      ${txt(960, 544, 'LU••••@••••.COM', 16, colors.muted, { anchor: 'middle', spacing: 3.2 })}
      <line x1="680" y1="592" x2="1240" y2="592" stroke="${colors.line}"/>
      ${txt(960, 646, 'DELIVERY PENDING', 13, colors.dim, { anchor: 'middle', spacing: 3 })}
    `;
  }

  if (state === 'email_delivered') {
    dim = 0.38;
    body = `
      ${mapRoute(1, 0.16, 1)}
      ${panel(225, 280, 920, 405, 0.92)}
      ${txt(280, 350, 'SECOND FRAGMENT ROUTED', 17, colors.bronze, { weight: 700, spacing: 3 })}
      ${txt(280, 432, 'DELIVERY CONFIRMED', 33, colors.warm, { weight: 600, spacing: 3.4 })}
      ${statusLabel(280, 508, 'CHANNEL', 'REGISTERED EMAIL')}
      ${statusLabel(655, 508, 'PAYLOAD', 'FRAGMENT 2 OF 2', true)}
      ${txt(280, 634, 'LEAVE THIS WINDOW OPEN', 13, colors.dim, { spacing: 2.5 })}
      <g filter="url(#softGlow)">
        <rect x="1215" y="198" width="510" height="190" rx="4" fill="#11100D" stroke="${colors.bronze2}"/>
        ${txt(1260, 248, 'NEW MESSAGE', 12, colors.bronze, { spacing: 3 })}
        ${txt(1260, 300, 'MERIDIAN RELAY', 21, colors.warm, { weight: 700, spacing: 2.4 })}
        ${txt(1260, 340, 'FRAGMENT 2 OF 2', 14, colors.muted, { spacing: 2.2 })}
      </g>
    `;
  }

  if (state === 'witness_pending') {
    dim = 0.34;
    body = `
      ${mapRoute(1, 0.12, 1)}
      ${panel(465, 268, 990, 480, 0.93)}
      ${txt(960, 344, 'RELAY STATUS', 15, colors.bronze, { anchor: 'middle', spacing: 4 })}
      ${txt(960, 433, 'SOURCE VERIFICATION: INCOMPLETE', 27, colors.warm, { anchor: 'middle', weight: 600, spacing: 2.6 })}
      <line x1="650" y1="490" x2="1270" y2="490" stroke="${colors.line}"/>
      ${statusLabel(650, 552, 'FIRST WITNESS', 'CANDIDATE #003921')}
      ${statusLabel(1045, 552, 'SECOND WITNESS', 'PENDING', true)}
      ${button(720, 650, 480, 'OPEN CASE 000-A', false)}
    `;
  }

  if (state === 'open_case') {
    dim = 0.62;
    body = `
      ${mapRoute(1, 0.08, 0.42)}
      ${txt(960, 343, 'THIS RECORD CANNOT BE VERIFIED', 34, colors.warm, { anchor: 'middle', weight: 600, spacing: 3.2 })}
      ${txt(960, 398, 'BY ITS SOURCE.', 34, colors.warm, { anchor: 'middle', weight: 600, spacing: 3.2 })}
      <line x1="760" y1="466" x2="1160" y2="466" stroke="${colors.line}"/>
      ${txt(960, 557, 'YOU ARE THE SECOND WITNESS.', 22, colors.bronze, { anchor: 'middle', weight: 700, spacing: 3.5 })}
      ${button(690, 661, 540, 'OPEN CASE 000-A', true)}
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs()}
    ${shell(dim)}
    ${body}
  </svg>`;
}

const frames = [
  ['01_start', 'landing'],
  ['01_end', 'request'],
  ['02_start', 'request'],
  ['02_end', 'incoming'],
  ['03_start', 'audio_ready'],
  ['03_end', 'audio_playing'],
  ['04_start', 'audio_complete'],
  ['04_end', 'custody'],
  ['05_start', 'routing'],
  ['05_end', 'email_delivered'],
  ['06_start', 'witness_pending'],
  ['06_end', 'open_case'],
];

for (const [name, state] of frames) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), renderState(state), 'utf8');
}

console.log(`Generated ${frames.length} SVG overlays in ${OUT}`);
