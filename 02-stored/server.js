const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const app = express();
const db = new DatabaseSync('chat.db');

db.exec(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const clients = new Set();

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  // Send a comment immediately to confirm connection
  res.write(': connected\n\n');
  clients.add(res);
  // Keep-alive ping every 15s to prevent connection drop
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

app.get('/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) return res.status(400).json({ error: 'Missing fields' });
  // Intentionally vulnerable: no sanitization to demo stored XSS
  const result = db.prepare('INSERT INTO messages (username, message) VALUES (?, ?)').run(username, message);
  broadcast({ type: 'message', id: result.lastInsertRowid, username, message });
  res.json({ id: result.lastInsertRowid });
});

app.delete('/messages', (req, res) => {
  db.prepare('DELETE FROM messages').run();
  broadcast({ type: 'clear' });
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Stored XSS demo running at http://localhost:${PORT}`));
