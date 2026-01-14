# Quick Start Guide

Get up and running with WeleeConsole Quiz Battle in 5 minutes!

## Prerequisites Check

Before you start, make sure you have:
- [ ] Node.js installed (v14+): Run `node --version`
- [ ] npm installed: Run `npm --version`
- [ ] OpenAI API key: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Step-by-Step Setup

### 1️⃣ Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/ahmedwelee/weleeConsole.git
cd weleeConsole

# Install backend dependencies
cd v1_backend
npm install

# Install frontend dependencies (in a new terminal)
cd v1_frontend
npm install
```

### 2️⃣ Configure OpenAI API Key (1 minute)

```bash
# Navigate to backend directory
cd v1_backend

# Copy the environment template
cp .env.example .env

# Edit the .env file (use nano, vim, or any text editor)
nano .env
```

**Replace the placeholder with your actual API key:**
```env
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
```

Save and close the file.

**Don't have an API key yet?**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create account
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key and paste it in your `.env` file

### 3️⃣ Start the Application (2 minutes)

**Terminal 1 - Backend:**
```bash
cd v1_backend
npm start
```

You should see:
```
🚀 Server running on port 3000
📡 Socket.IO server ready
```

**Terminal 2 - Frontend:**
```bash
cd v1_frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 4️⃣ Play the Game! 🎮

**Host (Desktop/TV):**
1. Open browser: `http://localhost:5173/host`
2. You'll get a room code (e.g., `ABC123`)
3. Share the code or QR code with players

**Players (Phones):**
1. Open browser: `http://localhost:5173/join`
2. Enter the room code
3. Enter your name
4. Player 1 configures quiz settings:
   - Language: Arabic/French/English
   - Category: History, Geography, Football, etc.
   - Difficulty: Easy/Medium/Hard
5. Player 1 clicks "Confirm & Start Quiz"
6. All players answer 20 questions
7. Winner is crowned! 👑

## Verification

### Check Backend
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "totalRooms": 0,
  "activePlayers": 0
}
```

### Check Frontend
Open `http://localhost:5173` - you should see the WeleeConsole interface.

### Check OpenAI Integration
1. Start a quiz game
2. Configure settings
3. If questions are generated (not the default 20 questions), OpenAI is working! ✓

## Network Play (Optional)

Want to play with friends on your local network?

### Find Your IP Address

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for something like `192.168.1.100`

### Update Configuration

Edit `v1_backend/.env`:
```env
FRONTEND_URL=http://192.168.1.100:5173
```

### Access from Other Devices

- **Host**: `http://192.168.1.100:5173/host`
- **Players**: `http://192.168.1.100:5173/join`

All devices must be on the same WiFi network!

## Troubleshooting

### ❌ "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### ❌ "Port 5173 already in use"
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### ❌ "Cannot connect to backend"
- Check backend is running: `curl http://localhost:3000/health`
- Verify FRONTEND_URL in `.env` matches your setup
- Check firewall settings

### ❌ "OpenAI API Error"
- Verify API key is correct (no extra spaces)
- Check OpenAI account has credits
- Game will use fallback questions if API fails

### ❌ "Questions are always the same 20 questions"
This means OpenAI API is not being used. Possible reasons:
1. API key not configured correctly
2. No internet connection
3. OpenAI API is down
4. No credits in OpenAI account

The game will still work with fallback questions!

## What's Next?

- 📖 Read [README.md](README.md) for full documentation
- 🎮 Learn about Quiz Battle in [QUIZ_BATTLE.md](QUIZ_BATTLE.md)
- 🔑 Detailed API key setup: [OPENAI_SETUP.md](OPENAI_SETUP.md)
- 🏗️ Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## Common Questions

**Q: Is the OpenAI API required?**
A: No! The game works with built-in fallback questions if the API is not configured.

**Q: How much does it cost per game?**
A: Approximately $0.001-$0.002 per game with GPT-3.5-turbo (very affordable!)

**Q: Can I add more question categories?**
A: Yes! Edit the category list in the code. See documentation for details.

**Q: Can I host this online?**
A: Yes! You'll need to deploy both backend and frontend. Update environment variables accordingly.

**Q: Is my API key safe?**
A: Yes! It's stored in `.env` which is excluded from git. Never share your API key publicly.

## Support

Need help?
- 💬 Create an issue on GitHub
- 📚 Check the documentation files
- 🔍 Search existing issues

---

**Ready to play? Let's go! 🚀**
