import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import gsmarenaHandler from './api/gsmarena.js'
import aiSourcingHandler from './api/ai-sourcing.js'
import karamboLiveHandler from './api/karambo-live.js'
import storeReviewsLiveHandler from './api/store-reviews-live.js'
import wearablesHandler from './api/wearables.js'
import trustCheckHandler from './api/trust-check.js'
import notifyHandler from './api/notify.js'
import marketplaceHandler from './api/marketplace.js'

/**
 * Local Dev API Middleware so all Vercel /api/* endpoints work LIVE
 * directly inside `npm run dev` and `npm run preview`.
 */
function localVercelApiPlugin() {
  const attach = (middlewares) => {
    const routes = {
      '/api/gsmarena': gsmarenaHandler,
      '/api/karambo-live': karamboLiveHandler,
      '/api/store-reviews-live': storeReviewsLiveHandler,
      '/api/wearables': wearablesHandler,
      '/api/trust-check': trustCheckHandler,
      '/api/ai-sourcing': aiSourcingHandler,
      '/api/notify': notifyHandler,
      '/api/marketplace': marketplaceHandler
    };
    middlewares.use(async (req, res, next) => {
      const parsed = new URL(req.url || '/', 'http://localhost');
      const handler = routes[parsed.pathname];
      if (!handler) return next();

      req.query = Object.fromEntries(parsed.searchParams.entries());
      if (req.method === 'POST' || req.method === 'PUT') {
        const chunks = [];
        for await (const ch of req) chunks.push(ch);
        const raw = Buffer.concat(chunks).toString('utf8');
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      } else {
        req.body = {};
      }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
        return res;
      };
      try {
        await handler(req, res);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Local API error' }));
      }
    });
  };
  return {
    name: 'local-vercel-api',
    configureServer(server) { attach(server.middlewares); },
    configurePreviewServer(server) { attach(server.middlewares); }
  };
}

export default defineConfig({
  plugins: [react(), localVercelApiPlugin()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor-libs';
          }
        }
      }
    }
  }
})
