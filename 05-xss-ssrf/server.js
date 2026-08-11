const express = require('express');
const path = require('path');

// ── Internal service (port 3004) ─────────────────────────────────────────────
// Simulates a private admin API reachable only from localhost.
// In a real environment this could be: cloud metadata, an internal DB UI, etc.
const internal = express();

internal.get('/env', (req, res) => {
  res.type('text/plain').send([
    'DATABASE_URL=postgresql://app_user:db_password_example@db.internal:5432/myapp_prod',
    'AWS_ACCESS_KEY_ID=AWS_access_key_id_example',
    'AWS_SECRET_ACCESS_KEY=aws_secret_access_key_example',
    'STRIPE_SECRET_KEY=sk_live_stripe_secret_key_example',
    'JWT_SECRET=jwt_secret_example_do_not_use_in_prod',
    'REDIS_URL=redis://redis.internal:6379/0',
    'SENDGRID_API_KEY=SG.sendgrid_api_key_example',
  ].join('\n'));
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
