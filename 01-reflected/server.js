const express = require('express');

const app = express();

app.get('/', (req, res) => {
  // Intentionally vulnerable: reflects raw query param into HTML to demo reflected XSS
  const name = req.query.name ?? 'World';
  res.send(`<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reflected (Non-persistent)</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-6">
  <div class="text-center space-y-4">
    <p class="text-gray-400 text-sm uppercase tracking-widest">Reflected XSS Demo</p>
    <h1 class="text-5xl font-bold text-white">Hello, <span id="name-display">${name}</span>!</h1>
  </div>

  <p class="text-gray-500 text-xs">Try this payload: <code class="text-red-400">?name=&lt;img src=x onerror=alert('Fatality')&gt;</code></p>
</body>

</html>`);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Reflected XSS demo running at http://localhost:${PORT}`));
