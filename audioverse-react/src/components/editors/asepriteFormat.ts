/**
 * asepriteFormat.ts — Aseprite .ase/.aseprite binary format parser & writer.
 * Spec: https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
 *
 * Supports:
 *  - RGBA color depth (32-bit)
 *  - Layers (normal, groups)
 *  - Cels (raw + zlib-compressed read, raw write)
 *  - Palette chunks
 *  - Frame tags
 *  - Round-trip: parseAse → writeAse produces valid .ase files
 */

// ── Public Types ─────────────────────────────────────────────

export interface AseDocument {
  width: number;
  height: number;
  colorDepth: 8 | 16 | 32;
  frames: AseFrame[];
  layers: AseLayer[];
  palette: AseColor[];
  tags: AseTag[];
  transparentIndex: number;
}

export interface AseFrame {
  duration: number; // ms
  cels: AseCel[];
}

export interface AseLayer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: number;
  childLevel: number;
  layerType: number; // 0=normal, 1=group
}

export interface AseCel {
  layerIndex: number;
  x: number;
  y: number;
  opacity: number;
  width: number;
  height: number;
  pixels: Uint8Array; // RGBA, length = w*h*4
}

export interface AseTag {
  name: string;
  from: number;
  to: number;
  direction: number; // 0=forward, 1=reverse, 2=ping-pong
  color: AseColor;
}

export interface AseColor {
  r: number; g: number; b: number; a: number;
}

// ── Binary helpers ───────────────────────────────────────────

class BinaryReader {
  private view: DataView;
  private pos = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  get offset() { return this.pos; }
  set offset(v: number) { this.pos = v; }
  get length() { return this.view.byteLength; }

  byte() { return this.view.getUint8(this.pos++); }
  word() { const v = this.view.getUint16(this.pos, true); this.pos += 2; return v; }
  short() { const v = this.view.getInt16(this.pos, true); this.pos += 2; return v; }
  dword() { const v = this.view.getUint32(this.pos, true); this.pos += 4; return v; }
  long() { const v = this.view.getInt32(this.pos, true); this.pos += 4; return v; }

  bytes(n: number) {
    const data = new Uint8Array(this.view.buffer, this.pos, n);
    this.pos += n;
    return data;
  }

  skip(n: number) { this.pos += n; }

  string() {
    const len = this.word();
    const bytes = this.bytes(len);
    return new TextDecoder('utf-8').decode(bytes);
  }
}

class BinaryWriter {
  private chunks: Uint8Array[] = [];
  private tempBuf = new ArrayBuffer(8);
  private tempView = new DataView(this.tempBuf);

  get byteLength() {
    return this.chunks.reduce((s, c) => s + c.length, 0);
  }

  byte(v: number) { this.chunks.push(new Uint8Array([v & 0xff])); }
  word(v: number) { this.tempView.setUint16(0, v, true); this.chunks.push(new Uint8Array(this.tempBuf.slice(0, 2))); }
  short(v: number) { this.tempView.setInt16(0, v, true); this.chunks.push(new Uint8Array(this.tempBuf.slice(0, 2))); }
  dword(v: number) { this.tempView.setUint32(0, v, true); this.chunks.push(new Uint8Array(this.tempBuf.slice(0, 4))); }

  bytes(data: Uint8Array) { this.chunks.push(new Uint8Array(data)); }

  string(s: string) {
    const encoded = new TextEncoder().encode(s);
    this.word(encoded.length);
    this.bytes(encoded);
  }

  zeros(n: number) { this.chunks.push(new Uint8Array(n)); }

  toArrayBuffer(): ArrayBuffer {
    const total = this.byteLength;
    const result = new Uint8Array(total);
    let off = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, off);
      off += chunk.length;
    }
    return result.buffer;
  }
}

// ── Zlib helpers (browser native) ────────────────────────────

async function zlibInflate(data: Uint8Array): Promise<Uint8Array> {
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(data);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { result.set(c, off); off += c.length; }
    return result;
  } catch {
    // Fallback: return raw data (may fail downstream)
    return data;
  }
}

async function zlibDeflate(data: Uint8Array): Promise<Uint8Array> {
  try {
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { result.set(c, off); off += c.length; }
    return result;
  } catch {
    return data;
  }
}

// ── Constants ────────────────────────────────────────────────

const ASE_MAGIC = 0xA5E0;
const FRAME_MAGIC = 0xF1FA;
const CHUNK_LAYER = 0x2004;
const CHUNK_CEL = 0x2005;
// Chunk types defined by spec but not yet used:
// CEL_EXTRA=0x2006, OLD_PALETTE_1=0x0004, OLD_PALETTE_2=0x0011,
// USER_DATA=0x2020, SLICE=0x2022, TILESET=0x2023
const CHUNK_PALETTE = 0x2019;
const CHUNK_FRAME_TAGS = 0x2018;

// ── Parse .ase ───────────────────────────────────────────────

export async function parseAseFile(buffer: ArrayBuffer): Promise<AseDocument> {
  const r = new BinaryReader(buffer);

  // -- File header (128 bytes) --
  r.dword(); // fileSize — read to advance cursor
  const magic = r.word();
  if (magic !== ASE_MAGIC) throw new Error(`Not an Aseprite file (magic: 0x${magic.toString(16)})`);

  const numFrames = r.word();
  const width = r.word();
  const height = r.word();
  const colorDepth = r.word() as 8 | 16 | 32;
  r.dword(); // flags
  r.word(); // speed (deprecated)
  r.skip(8); // reserved
  const transparentIndex = r.byte();
  r.skip(3);
  r.word(); // numColors
  r.byte(); // pixelWidth
  r.byte(); // pixelHeight
  r.short(); // gridX
  r.short(); // gridY
  r.word(); // gridW
  r.word(); // gridH
  r.skip(84); // padding to 128

  const layers: AseLayer[] = [];
  const palette: AseColor[] = [];
  const tags: AseTag[] = [];
  const frames: AseFrame[] = [];

  // -- Frames --
  for (let fr = 0; fr < numFrames; fr++) {
    r.dword(); // frameBytes — read to advance cursor
    const frameMagic = r.word();
    if (frameMagic !== FRAME_MAGIC) throw new Error(`Bad frame magic at frame ${fr}`);

    const oldChunks = r.word();
    const duration = r.word();
    r.skip(2);
    let numChunks = r.dword();
    if (numChunks === 0) numChunks = oldChunks;

    const frame: AseFrame = { duration, cels: [] };

    for (let ch = 0; ch < numChunks; ch++) {
      const chunkStart = r.offset;
      const chunkSize = r.dword();
      const chunkType = r.word();
      const chunkDataEnd = chunkStart + chunkSize;

      switch (chunkType) {
        case CHUNK_LAYER: {
          const flags = r.word();
          const layerType = r.word();
          const childLevel = r.word();
          r.skip(2); // default width
          r.skip(2); // default height
          const blendMode = r.word();
          const opacity = r.byte();
          r.skip(3);
          const name = r.string();
          layers.push({
            name,
            visible: !!(flags & 1),
            opacity,
            blendMode,
            childLevel,
            layerType,
          });
          break;
        }

        case CHUNK_CEL: {
          const layerIndex = r.word();
          const x = r.short();
          const y = r.short();
          const opacity = r.byte();
          const celType = r.word();
          r.short(); // zIndex
          r.skip(5);

          if (celType === 0) {
            // Raw cel
            const cw = r.word();
            const ch2 = r.word();
            const pixelBytes = cw * ch2 * (colorDepth / 8);
            const rawPixels = r.bytes(pixelBytes);
            const rgba = colorDepth === 32 ? new Uint8Array(rawPixels) : convertToRGBA(rawPixels, colorDepth, palette, transparentIndex, cw, ch2);
            frame.cels.push({ layerIndex, x, y, opacity, width: cw, height: ch2, pixels: rgba });
          } else if (celType === 2) {
            // Compressed cel
            const cw = r.word();
            const ch2 = r.word();
            const compressedLen = chunkDataEnd - r.offset;
            const compressed = r.bytes(compressedLen);
            const raw = await zlibInflate(compressed);
            const rgba = colorDepth === 32 ? new Uint8Array(raw) : convertToRGBA(raw, colorDepth, palette, transparentIndex, cw, ch2);
            frame.cels.push({ layerIndex, x, y, opacity, width: cw, height: ch2, pixels: rgba });
          } else if (celType === 1) {
            // Linked cel — points to another frame
            const linkedFrame = r.word();
            if (linkedFrame < frames.length) {
              const linked = frames[linkedFrame].cels.find(c => c.layerIndex === layerIndex);
              if (linked) {
                frame.cels.push({ ...linked, x, y, opacity });
              }
            }
          }
          // Skip tilemap cels (type 3)
          break;
        }

        case CHUNK_PALETTE: {
          const palSize = r.dword();
          const firstIdx = r.dword();
          const lastIdx = r.dword();
          r.skip(8);
          // Ensure palette array is large enough
          while (palette.length < palSize) palette.push({ r: 0, g: 0, b: 0, a: 255 });
          for (let i = firstIdx; i <= lastIdx; i++) {
            const hasName = r.word();
            const pr = r.byte(), pg = r.byte(), pb = r.byte(), pa = r.byte();
            palette[i] = { r: pr, g: pg, b: pb, a: pa };
            if (hasName & 1) r.string(); // skip name
          }
          break;
        }

        case CHUNK_FRAME_TAGS: {
          const numTags = r.word();
          r.skip(8);
          for (let t = 0; t < numTags; t++) {
            const from = r.word();
            const to = r.word();
            const dir = r.byte();
            const repeat = r.word();
            void repeat;
            r.skip(6);
            r.skip(1); // padding
            const tr = r.byte(), tg = r.byte(), tb = r.byte();
            const name = r.string();
            tags.push({ name, from, to, direction: dir, color: { r: tr, g: tg, b: tb, a: 255 } });
          }
          break;
        }

        default:
          // Skip unknown chunks
          break;
      }

      r.offset = chunkDataEnd;
    }

    frames.push(frame);
  }

  return { width, height, colorDepth, frames, layers, palette, tags, transparentIndex };
}

function convertToRGBA(
  raw: Uint8Array, depth: number, palette: AseColor[], transIdx: number,
  w: number, h: number
): Uint8Array {
  const rgba = new Uint8Array(w * h * 4);
  if (depth === 16) {
    // Grayscale: 2 bytes per pixel (value, alpha)
    for (let i = 0; i < w * h; i++) {
      const v = raw[i * 2], a = raw[i * 2 + 1];
      rgba[i * 4] = v; rgba[i * 4 + 1] = v; rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = a;
    }
  } else if (depth === 8) {
    // Indexed: 1 byte per pixel
    for (let i = 0; i < w * h; i++) {
      const idx = raw[i];
      if (idx === transIdx) {
        rgba[i * 4 + 3] = 0;
      } else if (idx < palette.length) {
        const c = palette[idx];
        rgba[i * 4] = c.r; rgba[i * 4 + 1] = c.g; rgba[i * 4 + 2] = c.b; rgba[i * 4 + 3] = c.a;
      }
    }
  }
  return rgba;
}

// ── Write .ase ───────────────────────────────────────────────

export async function writeAseFile(doc: AseDocument): Promise<ArrayBuffer> {
  // We'll build chunks per frame, then assemble the final file.
  const frameBuffers: ArrayBuffer[] = [];

  for (let fr = 0; fr < doc.frames.length; fr++) {
    const frame = doc.frames[fr];
    const fw = new BinaryWriter();

    let numChunks = 0;

    // In first frame, write layer chunks + palette
    if (fr === 0) {
      // Layers
      for (const layer of doc.layers) {
        const chunk = new BinaryWriter();
        const flags = (layer.visible ? 1 : 0);
        chunk.word(flags);
        chunk.word(layer.layerType);
        chunk.word(layer.childLevel);
        chunk.word(0); // default w
        chunk.word(0); // default h
        chunk.word(layer.blendMode);
        chunk.byte(layer.opacity);
        chunk.zeros(3);
        chunk.string(layer.name);

        const chunkData = chunk.toArrayBuffer();
        fw.dword(chunkData.byteLength + 6); // +6 for size+type header
        fw.word(CHUNK_LAYER);
        fw.bytes(new Uint8Array(chunkData));
        numChunks++;
      }

      // Palette
      if (doc.palette.length > 0) {
        const chunk = new BinaryWriter();
        chunk.dword(doc.palette.length);
        chunk.dword(0);
        chunk.dword(doc.palette.length - 1);
        chunk.zeros(8);
        for (const c of doc.palette) {
          chunk.word(0); // no name
          chunk.byte(c.r);
          chunk.byte(c.g);
          chunk.byte(c.b);
          chunk.byte(c.a);
        }
        const chunkData = chunk.toArrayBuffer();
        fw.dword(chunkData.byteLength + 6);
        fw.word(CHUNK_PALETTE);
        fw.bytes(new Uint8Array(chunkData));
        numChunks++;
      }

      // Frame tags
      if (doc.tags.length > 0) {
        const chunk = new BinaryWriter();
        chunk.word(doc.tags.length);
        chunk.zeros(8);
        for (const tag of doc.tags) {
          chunk.word(tag.from);
          chunk.word(tag.to);
          chunk.byte(tag.direction);
          chunk.word(0); // repeat
          chunk.zeros(6);
          chunk.byte(0); // padding
          chunk.byte(tag.color.r);
          chunk.byte(tag.color.g);
          chunk.byte(tag.color.b);
          chunk.string(tag.name);
        }
        const chunkData = chunk.toArrayBuffer();
        fw.dword(chunkData.byteLength + 6);
        fw.word(CHUNK_FRAME_TAGS);
        fw.bytes(new Uint8Array(chunkData));
        numChunks++;
      }
    }

    // Cels — write compressed (type 2)
    for (const cel of frame.cels) {
      const chunk = new BinaryWriter();
      chunk.word(cel.layerIndex);
      chunk.short(cel.x);
      chunk.short(cel.y);
      chunk.byte(cel.opacity);

      // Use compressed cels (type 2) for space efficiency
      const compressed = await zlibDeflate(cel.pixels);
      chunk.word(2); // cel type = compressed
      chunk.short(0); // z-index
      chunk.zeros(5);
      chunk.word(cel.width);
      chunk.word(cel.height);
      chunk.bytes(compressed);

      const chunkData = chunk.toArrayBuffer();
      fw.dword(chunkData.byteLength + 6);
      fw.word(CHUNK_CEL);
      fw.bytes(new Uint8Array(chunkData));
      numChunks++;
    }

    // Build frame header
    const frameData = fw.toArrayBuffer();
    const fh = new BinaryWriter();
    fh.dword(frameData.byteLength + 16); // 16 = frame header size
    fh.word(FRAME_MAGIC);
    fh.word(numChunks > 0xFFFF ? 0xFFFF : numChunks);
    fh.word(frame.duration);
    fh.zeros(2);
    fh.dword(numChunks);
    const headerBuf = fh.toArrayBuffer();

    // Combine header + data
    const combined = new Uint8Array(headerBuf.byteLength + frameData.byteLength);
    combined.set(new Uint8Array(headerBuf), 0);
    combined.set(new Uint8Array(frameData), headerBuf.byteLength);
    frameBuffers.push(combined.buffer);
  }

  // Assemble final file
  const framesTotal = frameBuffers.reduce((s, b) => s + b.byteLength, 0);
  const fileSize = 128 + framesTotal;

  // File header
  const header = new BinaryWriter();
  header.dword(fileSize);
  header.word(ASE_MAGIC);
  header.word(doc.frames.length);
  header.word(doc.width);
  header.word(doc.height);
  header.word(doc.colorDepth);
  header.dword(1); // flags: layer opacity valid
  header.word(100); // speed (deprecated)
  header.dword(0); // reserved
  header.dword(0); // reserved
  header.byte(doc.transparentIndex);
  header.zeros(3);
  header.word(doc.palette.length || 0);
  header.byte(1); // pixel width
  header.byte(1); // pixel height
  header.short(0); // grid x
  header.short(0); // grid y
  header.word(16); // grid w
  header.word(16); // grid h
  header.zeros(84); // padding to 128

  const headerBuf = header.toArrayBuffer();
  const file = new Uint8Array(fileSize);
  file.set(new Uint8Array(headerBuf), 0);
  let off = 128;
  for (const fb of frameBuffers) {
    file.set(new Uint8Array(fb), off);
    off += fb.byteLength;
  }

  return file.buffer;
}

// ── Convenience: create empty AseDocument ────────────────────

export function createEmptyAseDocument(width = 64, height = 64): AseDocument {
  const pixels = new Uint8Array(width * height * 4); // transparent
  return {
    width,
    height,
    colorDepth: 32,
    frames: [{ duration: 100, cels: [{ layerIndex: 0, x: 0, y: 0, opacity: 255, width, height, pixels }] }],
    layers: [{ name: 'Layer 1', visible: true, opacity: 255, blendMode: 0, childLevel: 0, layerType: 0 }],
    palette: defaultPalette(),
    tags: [],
    transparentIndex: 0,
  };
}

export function defaultPalette(): AseColor[] {
  const hex = [
    '#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8',
    '#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa',
    '#291814','#111d35','#422136','#125359','#742f29','#49333b','#a28879','#f2e8cf',
    '#be1250','#ff6c24','#ffd726','#44891a','#1d6aff','#6b3a89','#ff5577','#eebb77',
  ];
  return hex.map(h => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return { r, g, b, a: 255 };
  });
}

export function aseColorToHex(c: AseColor): string {
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function hexToAseColor(hex: string): AseColor {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 255,
  };
}
