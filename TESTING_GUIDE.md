# 🧪 TESTING GUIDE - State-Based Game Architecture

## 🚀 Quick Start

### 1. Start Backend
```bash
cd v1_backend
npm install
npm start
```
**Expected Output:**
```
🚀 Server running on port 3000
```

### 2. Start Frontend
```bash
cd v1_frontend
npm install
npm run dev
```
**Expected Output:**
```
VITE ready in XXXms
Local: http://localhost:5173
```

## 📋 Test Checklist

### ✅ Phase 1: Host Setup
1. Open browser: `http://localhost:5173/host`
2. **Expected**: Room code appears (e.g., "ABC123")
3. **Check Console**: Should see:
   ```
   ✅ Connected to server: <socket-id>
   ✅ Host joined as player: { playerId, isHost: true }
   ```
4. **Expected**: Debug line shows: `isHost=YES | hostPlayerId=<id> | players=1`
5. **Expected**: "Start Quiz Battle 🎯" button is ENABLED and clickable

### ✅ Phase 2: Player Joins
1. Open mobile browser or incognito: `http://localhost:5173/join`
2. Enter the room code
3. Enter player name (e.g., "Player2")
4. Click "Join"
5. **Expected on Controller**: "Waiting for host to select game..."
6. **Expected on Host**: Player count increases to 2

### ✅ Phase 3: Game Selection (WAITING → CONFIG)
1. On Host screen, click "Start Quiz Battle 🎯"
2. **Expected on Host**: Configuration panel appears with:
   - Language dropdown
   - Category dropdown
   - Difficulty buttons (Easy/Medium/Hard)
3. **Expected on Controller**: "Host is configuring the game..."
4. **Check Console**: `Room state changed: CONFIG`

### ✅ Phase 4: Configuration (CONFIG State)
1. Host selects settings (e.g., English, Science, Hard)
2. Host clicks "Confirm Settings & Continue"
3. **Expected**: "Start Game Now! 🚀" button appears
4. **Check Console**: Config ready event received

### ✅ Phase 5: Game Start (CONFIG → PLAYING)
1. Host clicks "Start Game Now! 🚀"
2. **Expected on Host**: Full game screen with:
   - Question text
   - 4 options (A/B/C/D with text)
   - Timer
   - Player list with scores
3. **Expected on Controller**: 
   - **ONLY 4 LETTER BUTTONS: A B C D**
   - **NO question text**
   - **NO answer options**
   - Room code and score at top
4. **Check Console**: 
   ```
   Room state changed: PLAYING
   ✅ Quiz received: [array of 10 questions]
   ```

### ✅ Phase 6: Gameplay (PLAYING State)
1. **On Controller**: Tap any letter button (A, B, C, or D)
2. **Expected**: 
   - Button becomes disabled
   - Feedback message appears: "✅ Correct!" or "❌ Wrong!"
   - Score updates if correct
3. **On Host**: 
   - Click "Next Question" button
   - **Expected**: All controllers reset and can answer again
4. **Repeat** for all 10 questions

### ✅ Phase 7: Game End (PLAYING → FINISHED)
1. After question 10, host clicks "Next Question"
2. **Expected on Host**: Results screen with winner
3. **Expected on Controller**: 
   - "🏆 Game Over!"
   - Final score displayed
   - "Check the main screen for rankings!"

## 🐛 Common Issues & Solutions

### Issue: "Start Quiz Battle" button is disabled
**Cause**: Host not recognized as player
**Solution**: 
- Check console for `isHost=YES`
- Verify `hostPlayerId` matches first player
- Ensure host joined as player (see Host.jsx changes)

### Issue: Controller shows question text
**Cause**: Wrong component or old code
**Solution**: 
- Verify QuizController.jsx is the NEW version
- Controller should ONLY show A/B/C/D buttons in PLAYING state

### Issue: "Must configure game first" error
**Cause**: Trying to start without going through CONFIG state
**Solution**:
- Click "Start Quiz Battle" first (WAITING → CONFIG)
- Configure settings
- Confirm settings
- Then click "Start Game Now"

### Issue: Players can't answer
**Cause**: Room not in PLAYING state
**Solution**:
- Check console: `room.state === 'PLAYING'`
- Verify server emitted `room:state-changed` with state: 'PLAYING'

### Issue: Buttons don't work on controller
**Cause**: Socket not joined to room or state mismatch
**Solution**:
- Check browser console for socket errors
- Verify `player:join-room` was successful
- Check `roomState` value in controller

## 📊 State Transition Validation

Use browser console to verify:
```javascript
// On Host or Controller, check:
console.log('Current State:', roomState);
console.log('Is Host:', isHost);
console.log('Host Player ID:', hostPlayerId);
```

**Valid State Flow:**
```
WAITING → CONFIG → PLAYING → FINISHED
   ↓         ↓         ↓          ↓
  Lobby   Config   Game      Results
```

## 🔍 Debug Commands

### Check Room State (Backend)
Add to server.js temporarily:
```javascript
setInterval(() => {
  console.log('Rooms:', Array.from(roomManager.rooms.entries()).map(([code, room]) => ({
    code,
    state: room.state,
    players: room.players.size,
    hostPlayerId: room.hostPlayerId
  })));
}, 5000);
```

### Check Frontend State (Browser Console)
```javascript
// Check socket connection
window.socket = socketService.getSocket();
console.log('Socket ID:', window.socket.id);
console.log('Connected:', window.socket.connected);
```

## ✨ Success Criteria

- ✅ Host creates room and is identified as first player/host
- ✅ Multiple players can join
- ✅ Only host can start game and configure settings
- ✅ State transitions follow strict order
- ✅ Controller shows ONLY A/B/C/D buttons during gameplay
- ✅ Host sees full question and options
- ✅ Answers are submitted as letters and converted to indices server-side
- ✅ Game progresses through all questions synchronously
- ✅ Final scores are calculated and displayed correctly

## 📞 Need Help?

If tests fail, check:
1. Console errors (F12)
2. Network tab for failed socket events
3. Server logs for validation errors
4. State values in debug info on host page
