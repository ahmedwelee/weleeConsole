# 📱 MOBILE CONNECTION SETUP GUIDE

## 🎯 Your Network Configuration

**Your Computer's Local IP**: `192.168.1.108`

## 🔧 Step-by-Step Setup

### 1. Update Frontend Configuration

The frontend needs to know your computer's IP address to connect from mobile devices.

**File**: `v1_frontend/.env` (create if doesn't exist)

```env
VITE_SOCKET_URL=http://192.168.1.108:3000
```

### 2. Start Backend Server

```bash
cd v1_backend
npm start
```

**Server will run on**: `http://192.168.1.108:3000`

### 3. Start Frontend with Network Access

```bash
cd v1_frontend
npm run dev -- --host
```

This exposes the dev server to your local network.

**Frontend will be available at**:
- Computer: `http://localhost:5173`
- **Mobile: `http://192.168.1.108:5173`** ✅

### 4. Connect from Your Phone

#### On Your Computer:
1. Open: `http://192.168.1.108:5173/host`
2. Note the room code (e.g., "ABC123")

#### On Your Phone:
1. **Make sure phone is on the same WiFi network**
2. Open mobile browser (Chrome/Safari)
3. Go to: `http://192.168.1.108:5173/join`
4. Enter the room code
5. Enter your name
6. Click "Join"

## 📋 Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running with `--host` flag
- [ ] Created `.env` file with correct IP
- [ ] Phone connected to same WiFi network
- [ ] Firewall allows connections (see below)

## 🔥 Firewall Configuration

### Windows Firewall (if blocked)

1. **Open Windows Defender Firewall**
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. TCP, Specific ports: `3000, 5173`
6. Allow the connection → Next
7. Apply to all profiles → Next
8. Name: "Welee Console Dev" → Finish

### Quick Test (PowerShell as Admin):
```powershell
# Allow port 3000 (Backend)
New-NetFirewallRule -DisplayName "Node Backend 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow port 5173 (Vite Frontend)
New-NetFirewallRule -DisplayName "Vite Dev 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## 🧪 Testing Connection

### Test Backend from Phone:
Open mobile browser: `http://192.168.1.108:3000/health`

**Expected response:**
```json
{
  "status": "ok",
  "time": "2026-01-16T...",
  "rooms": { "totalRooms": 0, "totalPlayers": 0 }
}
```

### Test Frontend from Phone:
Open mobile browser: `http://192.168.1.108:5173`

**Expected**: Should see the landing page

## 🚨 Troubleshooting

### Problem: "Can't connect" / "ERR_CONNECTION_REFUSED"

**Solution 1**: Check if services are running
```bash
# Check if backend is running
curl http://192.168.1.108:3000/health

# Check if frontend is running
curl http://192.168.1.108:5173
```

**Solution 2**: Verify same WiFi network
- Computer WiFi: Settings → Network → WiFi
- Phone WiFi: Settings → WiFi
- **Must be on same network name**

**Solution 3**: Restart with correct flags
```bash
# Backend (make sure it binds to 0.0.0.0, not just localhost)
cd v1_backend
npm start

# Frontend (MUST use --host flag)
cd v1_frontend
npm run dev -- --host
```

### Problem: Frontend loads but socket doesn't connect

**Check `.env` file exists and has correct IP:**
```env
VITE_SOCKET_URL=http://192.168.1.108:3000
```

**Restart frontend after creating .env file:**
```bash
# Stop with Ctrl+C, then restart
npm run dev -- --host
```

### Problem: "Cross-Origin Request Blocked" (CORS)

**Already handled** - Backend has:
```javascript
cors: { origin: "*" }
```

If still blocked, verify `v1_backend/server.js` has:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

## 📱 QR Code Connection (Easiest Method)

Once frontend is running with `--host`:

1. **On Computer** (Host page): Shows QR code with the correct URL
2. **On Phone**: Scan QR code with camera app
3. Phone will open browser to: `http://192.168.1.108:5173/join?code=ABC123`
4. Auto-fills room code, just enter your name!

## ✅ Success Indicators

### Computer Console (Frontend):
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.108:5173/
```

### Computer Console (Backend):
```
🚀 Server running on port 3000
✅ Connected: <socket-id>
```

### Phone Browser:
- Loads the join page
- Can enter room code
- Shows "Connected!" after joining
- Controller buttons appear after game starts

## 🎮 Full Test Flow

1. **Computer**: Open `http://192.168.1.108:5173/host`
2. **Computer**: See room code (e.g., "ABC123")
3. **Phone**: Open `http://192.168.1.108:5173/join`
4. **Phone**: Enter room code + name → Join
5. **Computer**: Should see player joined
6. **Computer**: Click "Start Quiz Battle"
7. **Computer**: Configure game → Confirm → Start
8. **Phone**: Should see A/B/C/D buttons appear
9. **Phone**: Tap a letter → Submit answer
10. **Computer**: See score update

## 💡 Pro Tips

1. **Bookmark on Phone**: Save `http://192.168.1.108:5173/join` as a bookmark
2. **Keep Screen Awake**: Phone settings → Display → Keep screen on while charging
3. **Full Screen Mode**: In mobile browser, tap "Add to Home Screen" for app-like experience
4. **Multiple Players**: Each player needs their own phone/device

## 🔄 If IP Changes

Your IP might change if you:
- Restart your router
- Reconnect to WiFi
- Connect to different network

**To get new IP:**
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Then update `.env` file with new IP.

## 📞 Still Not Working?

Run these diagnostic commands and share the output:

```powershell
# Check IP
ipconfig | Select-String -Pattern "IPv4"

# Check if backend port is listening
netstat -an | findstr "3000"

# Check if frontend port is listening
netstat -an | findstr "5173"

# Test backend from computer
curl http://192.168.1.108:3000/health

# Check firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3000*" -or $_.DisplayName -like "*5173*"}
```

---

**Your URLs**:
- 🖥️ **Computer Host**: `http://192.168.1.108:5173/host`
- 📱 **Phone Join**: `http://192.168.1.108:5173/join`
- 🔧 **Backend Health**: `http://192.168.1.108:3000/health`
