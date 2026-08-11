const express = require('express');
const path = require('path');

// ── Internal service (port 3004) ─────────────────────────────────────────────
// Simulates a private admin API reachable only from localhost.
// In a real environment this could be: cloud metadata, an internal DB UI, etc.
const internal = express();

internal.get('/admin', (req, res) => {
  res.json({
    service: 'Internal Admin API',
    db_password: 's3cr3t_db_p@ss!',
    aws_key: 'AKIA3XAMPLEKEY00001',
    aws_secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    jwt_secret: 'super_secret_jwt_key_do_not_leak',
  });
});

internal.get('/health', (req, res) => res.json({ status: 'ok', internal: true }));

internal.listen(3004, '127.0.0.1', () =>
  console.log('Internal service listening on 127.0.0.1:3004 (not publicly reachable)')
);

// ── Public app (port 3003) ───────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Intentionally vulnerable: fetches any URL the user provides — no allowlist, no block on private IPs
app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'text/plain';
    const body = await response.text();
    res.json({ url, contentType, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`XSS + SSRF demo running at http://localhost:${PORT}`);
  console.log(`Attack the internal service at http://localhost:3004/admin`);
});
