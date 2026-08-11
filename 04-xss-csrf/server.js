const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const app = express();
const db = new DatabaseSync('data.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed default victim profile
db.prepare("INSERT OR IGNORE INTO profile VALUES ('username', 'victim')").run();
db.prepare("INSERT OR IGNORE INTO profile VALUES ('email', 'victim@company.com')").run();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/profile', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM profile').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

// Intentionally vulnerable: no CSRF token, no origin check
app.post('/api/profile', (req, res) => {
  const { email } = req.body;
  if (email) db.prepare("UPDATE profile SET value = ? WHERE key = 'email'").run(email);
  res.json({ ok: true });
});

app.get('/api/comments', (req, res) => {
  res.json(db.prepare('SELECT * FROM comments ORDER BY created_at ASC').all());
});

app.post('/api/comments', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  // Intentionally vulnerable: content stored without sanitization
  db.prepare('INSERT INTO comments (content) VALUES (?)').run(content);
  res.json({ ok: true });
});

app.delete('/api/reset', (req, res) => {
  db.prepare('DELETE FROM comments').run();
  db.prepare("UPDATE profile SET value = 'victim@company.com' WHERE key = 'email'").run();
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`XSS + CSRF demo running at http://localhost:${PORT}`));
