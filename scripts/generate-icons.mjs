import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const taxiSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFA23E"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFC24C"/>
      <stop offset="100%" stop-color="#FFA733"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <ellipse cx="180" cy="120" rx="220" ry="120" fill="#ffffff" opacity="0.08"/>

  <!-- wheels -->
  <rect x="88" y="392" width="66" height="66" rx="10" fill="#C1401D"/>
  <rect x="358" y="392" width="66" height="66" rx="10" fill="#C1401D"/>

  <!-- car body -->
  <rect x="82" y="286" width="348" height="176" rx="58" fill="url(#body)"/>
  <path d="M70 340 Q52 340 52 322 L52 300 Q52 282 70 282 L110 282 L110 330 Z" fill="url(#body)"/>
  <path d="M442 340 Q460 340 460 322 L460 300 Q460 282 442 282 L402 282 L402 330 Z" fill="url(#body)"/>

  <!-- windshield -->
  <polygon points="176,210 336,210 388,296 124,296" fill="#B23A1C"/>

  <!-- taxi sign -->
  <rect x="196" y="118" width="120" height="88" rx="22" fill="#B23A1C"/>
  <text x="256" y="178" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#FFF7EC" text-anchor="middle">TAXI</text>

  <!-- wiper glints -->
  <line x1="196" y1="318" x2="228" y2="352" stroke="#E8863F" stroke-width="10" stroke-linecap="round"/>
  <line x1="316" y1="318" x2="284" y2="352" stroke="#E8863F" stroke-width="10" stroke-linecap="round"/>

  <!-- headlights -->
  <rect x="128" y="352" width="88" height="52" rx="24" fill="#FFEFD2"/>
  <rect x="296" y="352" width="88" height="52" rx="24" fill="#FFEFD2"/>

  <!-- grille -->
  <rect x="188" y="358" width="136" height="12" rx="6" fill="#C1401D"/>
  <rect x="188" y="384" width="136" height="12" rx="6" fill="#C1401D"/>

  <!-- bumper reflectors -->
  <rect x="128" y="424" width="82" height="16" rx="8" fill="#C1401D"/>
  <rect x="302" y="424" width="82" height="16" rx="8" fill="#C1401D"/>

  <!-- sparkle -->
  <path d="M446 420 L454 440 L474 448 L454 456 L446 476 L438 456 L418 448 L438 440 Z" fill="#FFE9C4" opacity="0.85"/>
</svg>
`;

const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FF7A00"/>
  <g transform="translate(58 58) scale(0.775)">
    ${taxiSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
</svg>
`;

mkdirSync('public/icons', { recursive: true });

const jobs = [
  ['public/icons/icon-192.png', taxiSvg, 192],
  ['public/icons/icon-512.png', taxiSvg, 512],
  ['public/icons/maskable-512.png', maskableSvg, 512],
  ['public/favicon.png', taxiSvg, 64],
];

for (const [out, source, size] of jobs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}

// iOS "Add to Home Screen" icon: uses the custom icon.png at the project root.
await sharp('icon.png')
  .resize(180, 180)
  .flatten({ background: '#FF8C00' })
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('wrote public/apple-touch-icon.png (from icon.png)');
