# XSS Examples

Hands-on demos of Cross-Site Scripting (XSS) vulnerabilities for educational purposes.

> **Warning:** These examples are intentionally vulnerable. Run them only in a local, isolated environment. Never deploy them publicly.

---

## Examples

### 01 — Reflected XSS

**Location:** `01-reflected/index.html`

A static HTML page that reads a `name` query parameter and injects it directly into the DOM via `document.write()`, with no sanitization.

**How to run:** Open `01-reflected/index.html` directly in a browser (no server needed).

**Attack payload:**
```
?name=<script>alert('Fatality ☠️')</script>
```

**Why it works:** The raw query string value is concatenated into an HTML string and written to the page. The browser parses the injected `<script>` tag and executes it.

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
<img src=x onerror=alert("XSS")>
```

**Why it works:** The server stores the raw input in SQLite and the client renders it with `innerHTML`, treating the stored string as live HTML.

---

## Key Differences

| | Reflected | Stored |
|---|---|---|
| **Persistence** | No — payload is in the URL | Yes — payload lives in the database |
| **Victims** | Only users who click the crafted URL | Every user who loads the page |
| **Server required** | No | Yes (Node.js) |

---

## Mitigations

- **Reflected:** Never pass user input through `document.write()`. Use `textContent` or encode output before insertion.
- **Stored:** Sanitize/escape input before storing **and** before rendering. Use `textContent` instead of `innerHTML`, or a library like [DOMPurify](https://github.com/cure53/DOMPurify).
