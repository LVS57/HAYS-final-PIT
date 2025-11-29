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

## Hotspot / Mobile Access (React + PHP)

If you want to open the frontend on another mobile connected to the same hotspot:

1) Connect all devices to the same hotspot
- PC (running Vite + XAMPP), ESP32, and the mobile viewer must be on the same Wi‑Fi network/hotspot.

2) Find your PC hotspot IPv4
- PowerShell: `ipconfig`
- Use the IPv4 of your Wi‑Fi adapter (often 192.168.137.1 on Windows Mobile Hotspot).

3) Configure Vite to bind to all interfaces and proxy to your PHP
- frontend/vite.config.js:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes dev server on LAN
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://<PC_IP>', // e.g. http://192.168.137.1
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/'),
      },
    },
  },
})
```

4) Start services
- XAMPP: start Apache (and MySQL if needed). Ensure `insert.php` is reachable: `http://<PC_IP>/insert.php?list=logs`.
- Frontend: in `frontend/` run `npm install` then `npm run dev`.

5) Open on mobile
- In mobile browser: `http://<PC_IP>:5173`

6) ESP32 server URL
- In `src/main.cpp` and `MQTT Relay LED/src/main.cpp`, set:
  - `serverScan = "http://<PC_IP>/insert.php"`
  - MQTT broker/IPs to the same `<PC_IP>` if you run Mosquitto on the PC.

Notes
- Do not use `localhost` in the frontend or ESP32 when accessing from other devices; use the PC IP.
- If pages don’t load on mobile, check firewall (allow Node/Vite and Apache) and confirm devices are on the same subnet.

---

## Quick Git Commands

```powershell
# Global identity (run once)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Clone
cd C:\Users\Acer\Desktop\everything
git clone https://github.com/<owner>/<repo>.git
cd <repo>

# Branching
git checkout -b feature/my-change
# work, then
git add .
git commit -m "feat: my change"
git push origin feature/my-change

# Update main
git checkout main
git pull origin main

# Delete branch
git branch -d MQTT-Relay-LED
git push origin --delete MQTT-Relay-LED
```

---

## Dev Tips
- Frontend auto-refreshes via polling; reduce interval if needed in `App.jsx` (setInterval).
- Mobile: logs are full width and smaller text; registered list shows before logs.
- Ensure PHP returns valid JSON; frontend uses a strict parser and will show an error banner if JSON is invalid.

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

## From-Scratch Setup (Backend, Frontend, MQTT, ESP32)

Follow these steps on Windows to get everything running from zero.

### 1) Install prerequisites
- Install Git: https://git-scm.com/downloads
- Install Node.js LTS: https://nodejs.org/
- Install XAMPP (Apache + MySQL): https://www.apachefriends.org/
- Optional: Install Mosquitto (MQTT broker) if you’ll use MQTT locally: https://mosquitto.org/download/
- Install VS Code: https://code.visualstudio.com/
- Install PlatformIO extension in VS Code (for ESP32 build/upload).

### 2) Get the project
```powershell
cd C:\Users\Acer\Desktop\everything
git clone https://github.com/<owner>/<repo>.git
cd HAYS-final-PIT
```

### 3) Backend (PHP + MySQL)
1. Start XAMPP → Start Apache and MySQL.
2. Create DB and tables:
   - Open phpMyAdmin → Import `docs/SQL.txt` (creates `4r6_hays` with tables and triggers).
3. Deploy API script:
   - Copy `docs/insert.php` to `C:\xampp\htdocs\insert.php` (or set Apache DocumentRoot accordingly).
4. Test endpoints in browser:
   - `http://localhost/insert.php?list=registered`
   - `http://localhost/insert.php?list=logs`

If using a mobile/hotspot, use your PC IPv4 instead of `localhost` (see Hotspot section below).

### 4) Frontend (React + Vite)
1. Open a terminal in `frontend/`:
```powershell
cd frontend
npm install
```
2. Configure Vite proxy to your PHP host:
   - Edit `frontend/vite.config.js` and set `server.host = true` and proxy target to `http://<PC_IP>` or `http://localhost`.
3. Run dev server:
```powershell
npm run dev
```
4. Open the URL shown (e.g., `http://localhost:5173`).

### 5) MQTT Broker (optional but supported)
- If you need MQTT locally, install Mosquitto and start the broker:
```powershell
# Default local start (if installed in PATH)
mosquitto -v
```
- Ensure topics used in ESP32 (`RFID_LOGIN`, `rfid/data`) are allowed by your broker config (`MQTT Relay LED/mosquitto.conf` if needed).

### 6) ESP32 Firmware (RFID reader)
1. Connect ESP32 + MFRC522 wiring as in `src/main.cpp` (SS/CS=5, RST=0; SPI pins: SCK=18, MISO=19, MOSI=23).
2. Open VS Code → PlatformIO → Open Project `HAYS-final-PIT`.
3. Configure server IPs in code:
   - In `src/main.cpp` and `MQTT Relay LED/src/main.cpp`, set:
     - `const char* mqttServer = "<PC_IP>";` (if using MQTT)
     - `const char* serverScan = "http://<PC_IP>/insert.php";`
     - Update Wi‑Fi SSID/passwords in `wifiMulti.addAP(...)`.
4. Build and upload:
   - PlatformIO: “Build” then “Upload” (select correct COM port).
5. Monitor:
   - PlatformIO: “Monitor” to view serial logs at 115200.

### 7) Hotspot / Mobile Access
- Find PC IPv4: `ipconfig` → Wi‑Fi adapter IPv4 (often `192.168.137.1`).
- Frontend: open `http://<PC_IP>:5173` on mobile.
- Backend: `http://<PC_IP>/insert.php?...` should respond.
- ESP32 and MQTT should also target `<PC_IP>` (not `localhost`).
- Allow through Windows Firewall (Node/Vite, Apache, Mosquitto).

### 8) Common commands
```powershell
# Frontend
cd frontend
npm install
npm run dev

# Test API
Invoke-RestMethod -Uri 'http://<PC_IP>/insert.php' -Method POST -ContentType 'application/json' -Body '{"rfid_data":"TESTTAG"}'

# MQTT (publish tests; requires mosquitto-clients)
mosquitto_pub -h <PC_IP> -t RFID_LOGIN -m "1"
mosquitto_pub -h <PC_IP> -t rfid/data -m "DEADBEEF"
```

### 9) MQTT Start Batch (Windows)
Create a config file (example `cloudcontrol.txt`) in `C:\mosquitto`:
```
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
log_type all
```
Then create `start-mosquitto.bat` in the same folder:
```
@echo off
cd /d C:\mosquitto
mosquitto -v -c cloudcontrol.txt
```
Run it by double-clicking or from PowerShell:
```powershell
C:\mosquitto\start-mosquitto.bat
```
Adjust security for production (set `allow_anonymous false` and add `password_file`).