# Who Is The Spy - Implementation Documentation

## Overview
"Who Is The Spy" is a multiplayer browser game where one player is secretly the spy who doesn't know the location, while all other players (civilians) know the location and have specific roles. The game supports both English and Arabic with RTL layout support.

## Architecture

### Platform
- **Host Screen**: TV/Shared display showing game state, timer, and voting results
- **Mobile Controllers**: Each player's phone displays their role and voting interface
- **Real-time Communication**: Socket.IO for instant updates between host and players

### Technology Stack
- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: React with Vite
- **Styling**: CSS with RTL support for Arabic

## File Structure

### Backend Files
```
v1_backend/
├── whoIsTheSpyData.json          # Game content (locations, roles, UI text)
├── whoIsTheSpyGameManager.js     # Game state machine and logic
└── server.js                      # Socket event handlers (updated)
```

### Frontend Files
```
v1_frontend/src/
├── components/
│   ├── SpyGameScreen.jsx         # Host display component
│   ├── SpyGameScreen.css         # Host display styling
│   ├── SpyController.jsx         # Mobile controller component
│   └── SpyController.css         # Mobile controller styling
└── pages/
    ├── Host.jsx                   # Updated with game selection
    └── Controller.jsx             # Updated with game routing
```

## Game Data Structure

### Location Format
```json
{
  "id": "hammam",
  "name_en": "Traditional Bath (Hammam)",
  "name_ar": "الحمام الشعبي",
  "roles_en": ["Cashier", "Customer", "Scrubber", "Water Carrier"],
  "roles_ar": ["مول الكية", "زبون", "كسال", "الطياب"]
}
```

### Available Locations
1. **Traditional Bath (Hammam)** - الحمام الشعبي
2. **Restaurant** - المطعم
3. **Airport** - المطار
4. **Hospital** - المستشفى
5. **School** - المدرسة
6. **Bank** - البنك
7. **Wedding Party** - حفل زفاف

## Game State Machine

### States
1. **WAITING**: Lobby state, waiting for players to join
2. **REVEAL**: Players check their phones to see their roles
3. **GAMEPLAY**: Q&A phase (offline verbal interaction)
4. **VOTING**: Players vote on who they think is the spy
5. **RESULT**: Game over, show winner and reveal spy

### State Flow
```
WAITING → REVEAL → GAMEPLAY → VOTING → RESULT
                                          ↓
                                    [Play Again] → REVEAL
                                    [Back to Lobby] → WAITING
```

## Game Logic

### Role Assignment (`startGame()`)
```javascript
// 1. Select random location from 7 available locations
// 2. Randomly assign ONE player as the spy
// 3. Assign specific roles to all other players (civilians)
// 4. Send individual assignments via socket to each player
```

### Vote Processing (`processVotes()`)
```javascript
// 1. Count votes for each player
// 2. Find player(s) with most votes
// 3. Determine winner:
//    - If spy gets most votes → Civilians Win
//    - If civilian gets most votes → Spy Wins
//    - If tie → Spy Wins
//    - If no votes → Spy Wins
```

## Socket Events

### Host Events
- `spy:start-game` - Start a new game
- `spy:start-voting` - Trigger voting phase
- `spy:process-votes` - Process votes and show results
- `spy:next-round` - Start next round with same players
- `spy:change-language` - Toggle between EN/AR

### Controller Events
- `spy:submit-vote` - Submit vote for suspected spy

### Broadcast Events
- `spy:game-started` - Game has started (with UI text)
- `spy:assignment` - Individual role assignment (private)
- `spy:voting-started` - Voting phase has begun
- `spy:vote-update` - Vote count update
- `spy:game-result` - Game results with winner
- `spy:language-changed` - Language changed

## UI Features

### Host Screen
- **Room Code Display**: Large, easy-to-read room code
- **Language Toggle**: Switch between EN 🇬🇧 / AR 🇸🇦
- **Player Avatars**: Visual representation of connected players
- **Timer Display**: Countdown timer (5:00 default)
- **Voting Progress**: Real-time vote count
- **Result Display**: Winner announcement with spy reveal

### Mobile Controller (Spy)
- **Red Theme**: Distinct visual with red border and dark background
- **Pulsing Border**: Animated to emphasize spy role
- **No Location**: Only shows "YOU ARE THE SPY"
- **Strategic Tips**: Reminders to act natural and listen

### Mobile Controller (Civilian)
- **Safe Theme**: Blue/purple gradient background
- **Location Display**: Shows the location clearly
- **Role Display**: Shows assigned specific role
- **Quick Reference**: Always visible location and role during gameplay

### RTL Support
- Direction automatically switches to RTL when Arabic is selected
- Arabic-friendly fonts (Cairo, Tajawal)
- All UI elements properly aligned for RTL layout

## API Reference

### Game Manager Methods

#### `createGame(roomCode, players, language)`
Creates a new game instance.
- **Parameters**:
  - `roomCode`: String - Room identifier
  - `players`: Array - Player objects with `id` and `name`
  - `language`: String - 'en' or 'ar'
- **Returns**: Game state object

#### `getPlayerAssignment(roomCode, playerId)`
Gets the role assignment for a specific player.
- **Returns**: `{ isSpy: boolean, role: string|null, location: string|null }`

#### `startVoting(roomCode)`
Transitions game to voting phase.

#### `submitVote(roomCode, voterId, votedForId)`
Records a player's vote.
- **Returns**: `{ success: boolean, totalVotes: number }`

#### `processVotes(roomCode)`
Processes all votes and determines winner.
- **Returns**: `{ winner: 'SPY'|'CIVILIANS', reason: string, spyId: string, location: string, voteCounts: object }`

#### `resetGame(roomCode, players)`
Creates a new round with same players.

## Testing

### Backend Tests Performed
```bash
✅ JSON data validation (7 locations, 27 UI text keys)
✅ Game manager instantiation
✅ Game creation with role assignment
✅ Vote submission and processing
✅ Winner determination logic
✅ Server syntax validation
```

### Test Results
- All backend logic validated successfully
- Role assignment working correctly
- Voting mechanism tested with multiple scenarios
- Spy wins when civilian is eliminated
- Civilians win when spy is identified

## Usage Example

### Starting a Game
```javascript
// Host clicks "🕵️ Who Is The Spy" button
// Frontend sends:
socket.emit('spy:start-game', {
  roomCode: 'ABC123',
  playerId: 'host-id',
  language: 'en'
});

// Server responds:
// - Assigns roles to all players
// - Sends individual assignments to each player
// - Broadcasts game-started event to room
```

### Voting Flow
```javascript
// Player clicks on suspected spy
socket.emit('spy:submit-vote', {
  roomCode: 'ABC123',
  playerId: 'player-1',
  votedForId: 'player-3'
});

// When all votes are in, host processes:
socket.emit('spy:process-votes', {
  roomCode: 'ABC123',
  playerId: 'host-id'
});

// Server broadcasts result to all players
```

## Minimum Requirements
- **Players**: 3 minimum (1 spy + 2 civilians)
- **Optimal**: 4-8 players for best gameplay
- **Browser**: Modern browser with Socket.IO support
- **Network**: Same network or internet connection

## Language Support

### English (EN)
- All UI text provided in English
- LTR (Left-to-Right) layout
- Standard fonts

### Arabic (AR)
- All UI text provided in Arabic
- RTL (Right-to-Left) layout
- Arabic fonts: Cairo, Tajawal
- Proper text alignment and spacing

## Security Considerations
- Role assignments sent individually (not broadcast)
- Only host can start game, trigger voting, process votes
- Voting phase requires all players to vote
- Results only shown after voting complete

## Future Enhancements
- Add more locations (currently 7, can easily expand)
- Configurable timer duration
- Add spy reveal option (spy can guess location)
- Statistics and score tracking across rounds
- Custom location creation by users
- More language support (French, Spanish, etc.)

## Troubleshooting

### Common Issues
1. **Game won't start**: Ensure at least 3 players have joined
2. **Language not switching**: Check socket connection
3. **Votes not counted**: Ensure all players have voted
4. **Spy reveal red border not showing**: Check CSS animation support in browser

## Credits
Implemented following the specifications for a multiplayer social deduction game with bilingual support (EN/AR) and RTL layout capabilities.
