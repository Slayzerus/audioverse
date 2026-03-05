import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// Shared proxy config — targets unified AudioVerse API at localhost:5000
function wsProxyConfig() {
  return {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,       // accept self-signed certs
    ws: true,            // proxy WebSocket connections
    proxyTimeout: 120_000,  // 2 min backend timeout
    timeout: 120_000,
    configure: (proxy: { on: (event: string, handler: (...args: unknown[]) => void) => void }) => {
      // Prevent ECONNRESET from killing the proxy
      proxy.on('error', (err: unknown, _req: unknown, res: unknown) => {
        const e = err as { code?: string; message?: string };
        console.log(`[vite-proxy] HTTP error: ${e.code || e.message}`);
        const r = res as { headersSent?: boolean; writeHead?: (status: number, headers: Record<string, string>) => void; end?: (body: string) => void } | undefined;
        if (r && !r.headersSent && typeof r.writeHead === 'function') {
          r.writeHead(502, { 'Content-Type': 'text/plain' });
          r.end!('Proxy error');
        }
      });
      proxy.on('proxyReqWs', (_proxyReq: unknown, _req: unknown, socket: unknown) => {
        const s = socket as { on: (event: string, handler: (err: unknown) => void) => void };
        s.on('error', (err: unknown) => {
          const e = err as { code?: string; message?: string };
          console.log(`[vite-proxy] WS socket error: ${e.code || e.message}`);
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-report.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      '/hubs': wsProxyConfig(),
      // audio_pitch (Crepe/torchcrepe) service — proxied directly to port 8084, stripping /api/ai/audio/pitch
      // so /api/ai/audio/pitch/ws/pitch_server → ws://localhost:8084/ws/pitch_server
      // Must come BEFORE the generic /api/ai/audio rule (Vite matches first)
      '/api/ai/audio/pitch': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path: string) => path.replace(/^\/api\/ai\/audio\/pitch/, ''),
      },
      // Proxy remaining WebSocket pitch-detection endpoints to the .NET API backend
      '/api/ai/audio': wsProxyConfig(),
      // Librosa Python microservice — proxied directly to port 8088 (Docker: 8088:8000), stripping /api/librosa prefix
      // so /api/librosa/ws/pyin → ws://localhost:8088/ws/pyin (matches FastAPI @app.websocket('/ws/pyin'))
      '/api/librosa': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path: string) => path.replace(/^\/api\/librosa/, ''),
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: {
      '@hl/shared': path.resolve(__dirname, '../honest-living/packages/shared/src'),
      '@hl/game-engine': path.resolve(__dirname, '../honest-living/packages/game-engine/src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // specific large libraries -> their own chunk
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor_monaco';
          if (id.includes('@ffmpeg/ffmpeg')) return 'vendor_ffmpeg';
          if (id.includes('aubiojs')) return 'vendor_aubio';
          if (id.match(/\bhls\b|hls\.js/)) return 'vendor_hls';
          if (id.includes('framer-motion')) return 'vendor_framer';
          // Phaser: try to split into smaller logical chunks by path when possible
          if (id.includes('phaser')) {
            try {
              if (id.match(/phaser.*[\\/]src[\\/](audio|sound|webaudio|input)[\\/]/)) return 'vendor_phaser_audio';
              if (id.match(/phaser.*[\\/]src[\\/](core|systems|scene|game)[\\/]/)) return 'vendor_phaser_core';
              if (id.match(/phaser.*[\\/]src[\\/](loader|load|file|plugins)[\\/]/)) return 'vendor_phaser_loader';
              if (id.match(/phaser.*[\\/]src[\\/](math|geom|utils)[\\/]/)) return 'vendor_phaser_math';
              if (id.match(/phaser.*[\\/]src[\\/](renderer|display|textures|tilemaps|cameras)[\\/]/)) return 'vendor_phaser_renderer';
            } catch (e) {
              // fall through to generic vendor_phaser
            }
            return 'vendor_phaser';
          }
          if (id.includes('recharts')) return 'vendor_recharts';
          if (id.includes('react-router')) return 'vendor_routing';
          if (id.includes('react-bootstrap') || id.includes('bootstrap') || id.includes('@restart')) return 'vendor_bootstrap';
          if (id.includes('@tanstack') || id.includes('react-query')) return 'vendor_query';
          if (id.includes('@emotion')) return 'vendor_emotion';
          if (id.includes('@fortawesome')) return 'vendor_fa';
          if (id.includes('lamejs')) return 'vendor_lame';
          if (id.includes('recordrtc')) return 'vendor_recordrtc';
          if (id.includes('pitchy')) return 'vendor_pitchy';
          // Three.js — large 3D engine used by game pages
          if (id.includes('three')) return 'vendor_three';
          // SignalR — real-time hub client
          if (id.includes('@microsoft/signalr')) return 'vendor_signalr';
          // i18next — internationalisation runtime
          if (id.includes('i18next')) return 'vendor_i18n';
          // music-metadata-browser — audio file metadata parser
          if (id.includes('music-metadata')) return 'vendor_music_metadata';
          // marked + DOMPurify — markdown rendering (Wiki)
          if (id.includes('marked') || id.includes('dompurify')) return 'vendor_markdown';
          // qrcode.react — QR code generator
          if (id.includes('qrcode')) return 'vendor_qrcode';
          // react-icons — icon pack
          if (id.includes('react-icons')) return 'vendor_icons';
          // zustand — state management
          if (id.includes('zustand')) return 'vendor_zustand';
          // axios — HTTP client
          if (id.includes('axios')) return 'vendor_axios';
          // react/react-dom split — match only core packages, not react-* libraries
          if (id.match(/[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/)) return 'vendor_react_dom';
          if (id.match(/[\\/]node_modules[\\/]react[\\/]/)) return 'vendor_react';
          // fallback for other node_modules
          return 'vendor_misc';
        }
      }
    }
  }
})
