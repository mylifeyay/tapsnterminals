// Generates pixel-art PWA icons, favicon and placeholder sprites with no external deps.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}
const hex = (h) => h === '.' ? [0, 0, 0, 0] : [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255]

// Renders a char grid (with palette) scaled into a size×size canvas over a background.
function render(grid, palette, size, { bg = null, pad = 0 } = {}) {
  const gh = grid.length, gw = grid[0].length
  const scale = Math.floor((size - pad * 2) / Math.max(gw, gh))
  const ox = Math.floor((size - gw * scale) / 2), oy = Math.floor((size - gh * scale) / 2)
  const buf = Buffer.alloc(size * size * 4)
  const bgc = bg ? hex(bg) : [0, 0, 0, 0]
  for (let i = 0; i < size * size; i++) bgc.forEach((v, k) => (buf[i * 4 + k] = v))
  grid.forEach((row, gy) => [...row].forEach((ch, gx) => {
    if (ch === ' ' || !palette[ch]) return
    const c = hex(palette[ch])
    for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
      const i = ((oy + gy * scale + y) * size + ox + gx * scale + x) * 4
      c.forEach((v, k) => (buf[i + k] = v))
    }
  }))
  return encodePNG(size, size, buf)
}

const MUG = [
  '                ',
  '   wwwwwwwww    ',
  '  wwwwwwwwwww   ',
  '  gwwwwwwwwwg   ',
  '  gaaaaaaaaag   ',
  '  gaAaaaaaaagggg',
  '  gaAaaaaaaag  g',
  '  gaAaaaaaaag  g',
  '  gaAaaaaaaag  g',
  '  gaaaaaaaaag  g',
  '  gaaaaaaaaagggg',
  '  gaaaaaaaaag   ',
  '  gaaaaaaaaag   ',
  '  ggggggggggg   ',
  '   >_ terminal  ',
  '                ',
]
const MUG_PAL = { w: '#f5f0e1', g: '#00ff66', a: '#ffb000', A: '#ffd866', '>': '#00ff66', _: '#00ff66' }
// Strip the text row for the icon; keep it purely pictorial.
const ICON = MUG.map((r, i) => (i === 14 ? '                ' : r))

mkdirSync('public/icons', { recursive: true })
mkdirSync('public/sprites', { recursive: true })
writeFileSync('public/icons/icon-192.png', render(ICON, MUG_PAL, 192, { bg: '#1e1e2e', pad: 16 }))
writeFileSync('public/icons/icon-512.png', render(ICON, MUG_PAL, 512, { bg: '#1e1e2e', pad: 40 }))
// Maskable icons need the art inside the ~80% safe zone.
writeFileSync('public/icons/icon-maskable-512.png', render(ICON, MUG_PAL, 512, { bg: '#1e1e2e', pad: 104 }))
writeFileSync('public/icons/apple-touch-icon.png', render(ICON, MUG_PAL, 180, { bg: '#1e1e2e', pad: 14 }))

// favicon.ico: a single 32×32 PNG wrapped in an ICO container.
const fav = render(ICON, MUG_PAL, 32, { bg: '#1e1e2e' })
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
const entry = Buffer.alloc(16)
entry[0] = 32; entry[1] = 32; entry[2] = 0; entry[3] = 0
entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6)
entry.writeUInt32LE(fav.length, 8); entry.writeUInt32LE(22, 12)
writeFileSync('public/favicon.ico', Buffer.concat([header, entry, fav]))

// Placeholder sprites (16×16 art at 4×) — the canvas currently draws procedurally,
// these exist so artists have a drop-in target.
const BARTENDER = [
  '                ',
  '     hhhhhh     ',
  '    hhhhhhhh    ',
  '    ssssssss    ',
  '    sesssses    ',
  '    ssssssss    ',
  '     ssmmss     ',
  '   wwwwbbwwww   ',
  '  wwwwwbbwwwww  ',
  '  sw wwwwww ws  ',
  '  s  aaaaaa  s  ',
  '     aaaaaa     ',
  '     kk  kk     ',
  '     kk  kk     ',
  '    ddd  ddd    ',
  '                ',
]
const PATRON = BARTENDER.map((r) => r.replace(/w/g, 'c').replace(/b/g, 'c').replace(/a/g, 'k'))
const SPR_PAL = { h: '#3b2a1a', s: '#e0b48a', e: '#121212', m: '#a0522d', w: '#f5f0e1', b: '#1e1e2e', a: '#2a2b3d', k: '#334155', d: '#121212', c: '#3b82f6' }
writeFileSync('public/sprites/bartender.png', render(BARTENDER, SPR_PAL, 64))
writeFileSync('public/sprites/patron.png', render(PATRON, SPR_PAL, 64))
console.log('icons + sprites written')
