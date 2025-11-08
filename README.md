# IT414 Final PIT — RFID (PHP + React + ESP32)

End‑to‑end demo that:
- Reads RFID via ESP32 + MFRC522
- Sends scans to a PHP endpoint (insert.php)
- Updates current status (rfid_registered) and writes history (rfid_logs)
- Shows live Status and Logs in a React UI

Key guarantees:
- Unknown tags are logged with status = NULL and do not modify rfid_registered.
- Duplicate scans are suppressed: server ignores repeated scans within 3 seconds.
- UI toggles are debounced to avoid double clicks.

---

## Architecture

- PHP (XAMPP/Apache): C:\xampp\htdocs\insert.php
- MySQL: Database 4r6_hays (tables rfid_registered, rfid_logs)
- React (Vite): frontend/
- ESP32: src/main.cpp

Optional DB triggers (docs/SQL.txt) create a log row when rfid_registered changes.

---

## Quick Start (Windows + XAMPP)

1) Database
- Open phpMyAdmin → import docs/SQL.txt
- This creates:
  - rfid_registered (current status)
  - rfid_logs (history)
  - Triggers:
    - after_registered_update (only if status changed)
    - after_registered_insert

2) Backend
- Ensure file C:\xampp\htdocs\insert.php exists and Apache is running.
- Visit:
  - http://localhost/insert.php?list=registered → { rfids: [...] }
  - http://localhost/insert.php?list=logs → { logs: [...] }

3) Frontend
- Open terminal in frontend/
- Install deps: npm i
- Dev server: npm run dev
- Vite proxy should map /api to http://localhost (htdocs root). Example vite.config.js:
```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, '/')
      }
    }
  }
}
```
- Open the app URL Vite prints (e.g., http://localhost:5173)

4) Test (no ESP32 needed)
- On Status page, use “Test Tools”:
  - Post (simulate scan) → sends POST to insert.php
  - Register / Unregister → manage rfid_registered
  - Toggle selected → flips a known tag (server logs once)
- Or from PowerShell:
```powershell
Invoke-RestMethod -Uri 'http://localhost/insert.php' -Method POST -ContentType 'application/json' -Body '{"rfid_data":"XYZ99999"}'
```

---

## API (insert.php)

- GET /insert.php?list=registered
  - Response: { rfids: [{ rfid_tag, status, last_update }] }
- GET /insert.php?list=logs
  - Response: { logs: [{ id, rfid_tag, status, timestamp }] }
- GET /insert.php?action=register&tag=TAG
  - Adds TAG to rfid_registered (status 0)
- GET /insert.php?action=unregister&tag=TAG
  - Removes TAG from rfid_registered
- GET /insert.php?action=clearLogs
  - Deletes all rows in rfid_logs
- POST /insert.php
  - Body: { "rfid_data": "TAG" }
  - Behavior:
    - If TAG registered: toggle status and log exactly once
    - If TAG unknown: insert NULL log only
    - Duplicate safeguard: if last log for TAG < 3 seconds ago, request is ignored (duplicate: true)

CORS already allowed via headers; dev uses Vite proxy to avoid CORS issues.

---

## Duplicate Prevention (choose one)

- With DB triggers (recommended; shipped in docs/SQL.txt):
  - Keep PHP from inserting a log for known tags (trigger writes it).
  - PHP still inserts NULL for unknown tags.

- Without triggers:
  - Remove triggers and let PHP insert the log on toggle.

Never use both at once for known tags (would double‑log).

---

## Frontend Notes

- Auto‑refresh every 5s; after any POST, fetchData() runs immediately.
- Logs filter uses only the historical log.status (1/0/NULL).
- ToggleButton has a short cooldown (default 800 ms) to prevent double clicks.

---

## ESP32 (excerpt)

- Configure your server URL and Wi‑Fi, and keep a 3‑second debounce on repeated reads.
- The payload must be JSON: {"rfid_data":"<TAG>"} (uppercase hex recommended).

```cpp
// src/main.cpp (essentials)
unsigned long lastScanMillis = 0;
String lastSentTag = "";

String formatUID() {
  String out;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) out += "0";
    out += String(rfid.uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}

bool shouldSendTag(const String &tag) {
  unsigned long now = millis();
  if (tag != lastSentTag || now - lastScanMillis >= 3000) {
    lastSentTag = tag;
    lastScanMillis = now;
    return true;
  }
  return false;
}

void sendScan(const String &tag) {
  // POST http://<PC-IP>/insert.php with JSON {"rfid_data":"TAG"}
}
```

---

## Troubleshooting

- 404 / CORS from frontend
  - File must be at C:\xampp\htdocs\insert.php
  - Use Vite proxy (/api → http://localhost) to avoid CORS.

- Two identical log rows per toggle
  - You have both triggers and PHP inserting logs for known tags. Disable one (recommended: keep triggers; remove PHP known‑log insert).

- Logs show wrong status after toggling
  - Frontend must read log.status only (historical). This repo already does that.

- Unknown not visible as “RFID NOT FOUND”
  - Ensure PHP returns status: null in JSON; check http://localhost/insert.php?list=logs.

---

## Git (Testing branch)

```
git checkout -b Testing
git add .
git commit -m "docs: add full README; clarify duplicate-prevention and API"
```

---
```// filepath: c:\Users\Acer\HAYS-final-PIT\README.md
# IT414 Final PIT — RFID (PHP + React + ESP32)

End‑to‑end demo that:
- Reads RFID via ESP32 + MFRC522
- Sends scans to a PHP endpoint (insert.php)
- Updates current status (rfid_registered) and writes history (rfid_logs)
- Shows live Status and Logs in a React UI

Key guarantees:
- Unknown tags are logged with status = NULL and do not modify rfid_registered.
- Duplicate scans are suppressed: server ignores repeated scans within 3 seconds.
- UI toggles are debounced to avoid double clicks.

---

## Architecture

- PHP (XAMPP/Apache): C:\xampp\htdocs\insert.php
- MySQL: Database 4r6_hays (tables rfid_registered, rfid_logs)
- React (Vite): frontend/
- ESP32: src/main.cpp

Optional DB triggers (docs/SQL.txt) create a log row when rfid_registered changes.

---

## Quick Start (Windows + XAMPP)

1) Database
- Open phpMyAdmin → import docs/SQL.txt
- This creates:
  - rfid_registered (current status)
  - rfid_logs (history)
  - Triggers:
    - after_registered_update (only if status changed)
    - after_registered_insert

2) Backend
- Ensure file C:\xampp\htdocs\insert.php exists and Apache is running.
- Visit:
  - http://localhost/insert.php?list=registered → { rfids: [...] }
  - http://localhost/insert.php?list=logs → { logs: [...] }

3) Frontend
- Open terminal in frontend/
- Install deps: npm i
- Dev server: npm run dev
- Vite proxy should map /api to http://localhost (htdocs root). Example vite.config.js:
```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, '/')
      }
    }
  }
}
```
- Open the app URL Vite prints (e.g., http://localhost:5173)

4) Test (no ESP32 needed)
- On Status page, use “Test Tools”:
  - Post (simulate scan) → sends POST to insert.php
  - Register / Unregister → manage rfid_registered
  - Toggle selected → flips a known tag (server logs once)
- Or from PowerShell:
```powershell
Invoke-RestMethod -Uri 'http://localhost/insert.php' -Method POST -ContentType 'application/json' -Body '{"rfid_data":"XYZ99999"}'
```

---

## API (insert.php)

- GET /insert.php?list=registered
  - Response: { rfids: [{ rfid_tag, status, last_update }] }
- GET /insert.php?list=logs
  - Response: { logs: [{ id, rfid_tag, status, timestamp }] }
- GET /insert.php?action=register&tag=TAG
  - Adds TAG to rfid_registered (status 0)
- GET /insert.php?action=unregister&tag=TAG
  - Removes TAG from rfid_registered
- GET /insert.php?action=clearLogs
  - Deletes all rows in rfid_logs
- POST /insert.php
  - Body: { "rfid_data": "TAG" }
  - Behavior:
    - If TAG registered: toggle status and log exactly once
    - If TAG unknown: insert NULL log only
    - Duplicate safeguard: if last log for TAG < 3 seconds ago, request is ignored (duplicate: true)

CORS already allowed via headers; dev uses Vite proxy to avoid CORS issues.

---

## Duplicate Prevention (choose one)

- With DB triggers (recommended; shipped in docs/SQL.txt):
  - Keep PHP from inserting a log for known tags (trigger writes it).
  - PHP still inserts NULL for unknown tags.

- Without triggers:
  - Remove triggers and let PHP insert the log on toggle.

Never use both at once for known tags (would double‑log).

---

## Frontend Notes

- Auto‑refresh every 5s; after any POST, fetchData() runs immediately.
- Logs filter uses only the historical log.status (1/0/NULL).
- ToggleButton has a short cooldown (default 800 ms) to prevent double clicks.

---

## ESP32 (excerpt)

- Configure your server URL and Wi‑Fi, and keep a 3‑second debounce on repeated reads.
- The payload must be JSON: {"rfid_data":"<TAG>"} (uppercase hex recommended).

```cpp
// src/main.cpp (essentials)
unsigned long lastScanMillis = 0;
String lastSentTag = "";

String formatUID() {
  String out;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) out += "0";
    out += String(rfid.uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}

bool shouldSendTag(const String &tag) {
  unsigned long now = millis();
  if (tag != lastSentTag || now - lastScanMillis >= 3000) {
    lastSentTag = tag;
    lastScanMillis = now;
    return true;
  }
  return false;
}

void sendScan(const String &tag) {
  // POST http://<PC-IP>/insert.php with JSON {"rfid_data":"TAG"}
}
```

---

## Troubleshooting

- 404 / CORS from frontend
  - File must be at C:\xampp\htdocs\insert.php
  - Use Vite proxy (/api → http://localhost) to avoid CORS.

- Two identical log rows per toggle
  - You have both triggers and PHP inserting logs for known tags. Disable one (recommended: keep triggers; remove PHP known‑log insert).

- Logs show wrong status after toggling
  - Frontend must read log.status only (historical). This repo already does that.

- Unknown not visible as “RFID NOT FOUND”
  - Ensure PHP returns status: null in JSON; check http://localhost/insert.php?list=logs.

---

## Git (Testing branch)

```
git checkout -b Testing
git add .
git commit -m "docs: add full README; clarify duplicate-prevention and API"
```

---