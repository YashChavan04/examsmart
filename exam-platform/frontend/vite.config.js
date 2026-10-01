import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // sockjs-client (used by the progress-wall WebSocket connection) was
  // written for Node.js and references the global `global` object, which
  // doesn't exist in a browser. Vite doesn't polyfill Node globals by
  // default, so without this the app throws "global is not defined" the
  // moment sockjs-client loads, before React ever renders anything.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      // Dev-only: avoids CORS pain when running `npm run dev` against a
      // backend on a different port. Not used in the merged-JAR build below,
      // since there both frontend and API share the same origin.
      '/api': 'http://localhost:8080',
      '/ws': { target: 'http://localhost:8080', ws: true }
    }
  },
  build: {
    // `npm run build` (or the Maven plugin below, which calls it
    // automatically) writes straight into the backend's static resources,
    // so the compiled JAR contains both frontend and backend as one artifact.
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
  }
});
