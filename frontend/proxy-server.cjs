const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy API requests directly to Django
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`API: ${req.url} -> Django`);
  }
}));

// Proxy everything else to Vite
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  ws: true,
  changeOrigin: true,
  headers: {
    host: 'localhost:5173'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Frontend: ${req.url} -> Vite`);
  }
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running on port ${PORT}`);
  console.log(`📍 Access your memorial at: http://4josh.caseclosure.org:${PORT}`);
  console.log(`   API requests go to Django on :8000`);
  console.log(`   Frontend requests go to Vite on :5173`);
});