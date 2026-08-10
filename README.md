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

## Key Differences

| | Reflected | Stored | DOM-Based |
|---|---|---|---|
| **Payload travels to server** | Yes (query param) | Yes (POST body) | No (`#` fragment never sent) |
| **Persistence** | No — payload is in the URL | Yes — payload lives in the database | No — payload is in the URL hash |
| **Victims** | Only users who click the crafted URL | Every user who loads the page | Only users who click the crafted URL |
| **Execution origin** | Server reflects it into the HTML response | Server serves stored payload | Client JS reads hash and writes to DOM |
| **Visible in server logs** | Yes | Yes | No |
| **Server required** | No | Yes (Node.js) | No |

---

## Mitigations

- **Reflected:** Never pass user input through `document.write()`. Use `textContent` or encode output before insertion.
- **Stored:** Sanitize/escape input before storing **and** before rendering. Use `textContent` instead of `innerHTML`, or a library like [DOMPurify](https://github.com/cure53/DOMPurify).
- **DOM-Based:** Avoid writing `location.hash`, `location.search`, or any URL-sourced data to `innerHTML`. Use `textContent`, or sanitize with [DOMPurify](https://github.com/cure53/DOMPurify) before touching the DOM.
