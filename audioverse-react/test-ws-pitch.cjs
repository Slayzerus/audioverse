// Quick test: connect to Crepe WS and send fake PCM audio to see if backend responds
// Usage: node test-ws-pitch.cjs

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const wsUrl = 'ws://localhost:5000/api/aiAudio/pitch/ws/server';
console.log(`Connecting to ${wsUrl}...`);
const ws = new WebSocket(wsUrl);

ws.binaryType = 'arraybuffer';

ws.addEventListener('open', () => {
  console.log('✅ WS connected!');

  const sampleRate = 16000;
  const chunkSamples = 3200; // 200ms at 16kHz
  const freq = 440;

  for (let chunk = 0; chunk < 5; chunk++) {
    const buf = new Int16Array(chunkSamples);
    for (let i = 0; i < chunkSamples; i++) {
      const t = (chunk * chunkSamples + i) / sampleRate;
      buf[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * 32767 * 0.5);
    }
    ws.send(buf.buffer);
    console.log(`↑ Sent chunk ${chunk + 1} (${buf.byteLength} bytes)`);
  }

  setTimeout(() => {
    console.log('Closing...');
    ws.close();
    process.exit(0);
  }, 8000);
});

ws.addEventListener('message', (ev) => {
  const text = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString();
  console.log(`↓ Received: ${text}`);
});

ws.addEventListener('error', (ev) => {
  console.error('❌ WS error:', ev.message || ev);
});

ws.addEventListener('close', (ev) => {
  console.log(`WS closed: code=${ev.code} reason=${ev.reason}`);
});
