# Who Is The Spy - Quick Start Guide

## Game Overview
"Who Is The Spy" is a social deduction game where:
- 1 player is the **Spy** (doesn't know the location)
- Other players are **Civilians** (know the location and their roles)
- Players discuss and try to identify the spy
- Vote to eliminate the suspected spy

## Starting the Game

### 1. Host Creates Room
- Go to `/host` on TV/Desktop
- Room code is displayed with QR code
- Wait for players to join (minimum 3 players)

### 2. Players Join
- Scan QR code or go to `/join` on mobile
- Enter room code and player name
- Wait in lobby

### 3. Select Game
- Host clicks **🕵️ Who Is The Spy** button
- Game starts immediately (no config needed)

## Game Flow

### Phase 1: Reveal (30 seconds)
**Host Screen**: Shows timer and player list
**Spy Phone**: 
- Red border with pulsing animation
- Shows "YOU ARE THE SPY"
- Tips to blend in

**Civilian Phone**:
- Blue/purple gradient
- Shows location (e.g., "Restaurant")
- Shows role (e.g., "Waiter")

### Phase 2: Gameplay (5 minutes)
**Host Screen**: Timer counts down
**All Phones**: Show quick reference of role
**Offline**: Players ask each other questions verbally

### Phase 3: Voting
**Host**: Clicks "Vote Now!" button
**All Phones**: See list of all players
**Action**: Each player taps one name to vote

### Phase 4: Results
**Host Screen**: 
- Shows winner (Spy or Civilians)
- Reveals who was the spy
- Shows the location
- Vote counts

**All Phones**: Shows if they won or lost

### Next Round
**Host**: Can click "Play Again" or "Back to Lobby"

## Language Support

### Switching Language
**When**: In lobby or during gameplay
**How**: Host clicks language toggle button (🇬🇧 EN / 🇸🇦 AR)
**Effect**: All UI text and roles update to selected language

### Arabic Mode
- All text in Arabic
- RTL (Right-to-Left) layout
- Arabic location and role names

## Winning Conditions

### Spy Wins When:
✅ Civilian receives most votes
✅ Vote is tied
✅ Timer runs out and spy not identified

### Civilians Win When:
✅ Spy receives most votes

## Tips for Players

### As Spy:
- Ask vague questions that could apply anywhere
- Listen carefully to understand the location
- Don't be too specific or too vague
- Pretend to know something without revealing you don't

### As Civilian:
- Ask questions that only someone at the location would know
- Watch for hesitant or vague answers
- Don't be too obvious with your questions
- The spy is trying to learn the location from you

## Technical Details

### Minimum Requirements
- 3 players minimum
- Modern web browser
- Socket connection

### Tested With
- Chrome, Firefox, Safari
- iOS and Android mobile browsers
- Desktop browsers

## Available Locations
1. Traditional Bath (Hammam) - الحمام الشعبي
2. Restaurant - المطعم
3. Airport - المطار
4. Hospital - المستشفى
5. School - المدرسة
6. Bank - البنك
7. Wedding Party - حفل زفاف

Each location has 6 unique roles for variety.

## Socket Events Quick Reference

### Start Game
```javascript
socket.emit('spy:start-game', { roomCode, playerId, language })
```

### Start Voting
```javascript
socket.emit('spy:start-voting', { roomCode, playerId })
```

### Submit Vote
```javascript
socket.emit('spy:submit-vote', { roomCode, playerId, votedForId })
```

### Process Results
```javascript
socket.emit('spy:process-votes', { roomCode, playerId })
```

### Play Again
```javascript
socket.emit('spy:next-round', { roomCode, playerId })
```

### Change Language
```javascript
socket.emit('spy:change-language', { roomCode, playerId, language })
```

## Troubleshooting

**Q: Game button is disabled**
A: Need at least 3 players to start

**Q: Can't vote**
A: Wait for host to start voting phase

**Q: Language not switching**
A: Only host can change language; check connection

**Q: Timer not showing**
A: Refresh page or check socket connection

**Q: Votes not counting**
A: Each player must vote once

## Development

### Adding New Locations
Edit `v1_backend/whoIsTheSpyData.json`:
```json
{
  "id": "unique-id",
  "name_en": "English Name",
  "name_ar": "الاسم العربي",
  "roles_en": ["Role1", "Role2", ...],
  "roles_ar": ["دور١", "دور٢", ...]
}
```

### Adding UI Text
Edit `ui_text` section in same file:
```json
"new_key": {
  "en": "English Text",
  "ar": "النص العربي"
}
```

## Credits & License
Part of WeleeConsole - A multiplayer gaming platform.
Supports Quiz Battle and Who Is The Spy games.
