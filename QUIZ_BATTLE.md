# Quiz Battle Game

## Overview
Quiz Battle is a multiplayer quiz game integrated into the WeleeConsole platform. Players use their phones as controllers to answer quiz questions displayed on the main screen.

## Features
- **Player 1 Controls**: First player to join has exclusive control over game settings
- Language selection: Arabic, French, or English
- Category selection:
  - History
  - Geography
  - Football
  - Countries and Capitals
  - Electronics
  - Famous People
  - Movies and Music
- Difficulty selection: Easy, Medium, or Hard
- 20 questions per game (generated based on selected settings)
- 4 multiple-choice options per question
- 20-second timer per question
- Dynamic question generation using OpenAI API (with fallback questions)
- Real-time scoring and live leaderboard
- Final ranking display with winner announcement
- One answer per player per question
- No negative points

## Setup

### Backend Configuration
1. Install dependencies:
   ```bash
   cd v1_backend
   npm install
   ```

2. Configure OpenAI API key in `.env`:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```
   
   Note: If the API key is not configured or invalid, the game will use fallback questions automatically.

3. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd v1_frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## How to Play

### Host (TV/Desktop):
1. Navigate to `/host` route
2. Share the room code or QR code with players
3. Wait for players to join
4. Select "🎯 Quiz Battle" from the game selection dropdown
5. Click "Start Game"
6. Wait for Player 1 to configure quiz settings
7. Questions will appear automatically with a 20-second timer after settings are locked
8. View real-time player answers and scores
9. After 20 questions, see the final rankings and winner

### Players (Phones):

#### Player 1 (First to Join):
1. Navigate to `/join` route or scan the QR code
2. Enter the room code and your name
3. Wait for the host to start the quiz game
4. **Configure Quiz Settings:**
   - Select language: Arabic, French, or English
   - Select category: History, Geography, Football, etc.
   - Select difficulty: Easy, Medium, or Hard
5. Click "Confirm & Start Quiz" to lock settings
6. Answer questions by tapping one of the four options (A, B, C, D)
7. See immediate feedback (correct/incorrect)
8. View your score after each question
9. Wait for the next question
10. See final results after all 20 questions

#### Other Players:
1. Navigate to `/join` route or scan the QR code
2. Enter the room code and your name
3. Wait for the host to start the quiz game
4. **View Player 1's settings** (cannot modify)
5. Wait for Player 1 to confirm settings
6. Answer questions by tapping one of the four options (A, B, C, D)
7. See immediate feedback (correct/incorrect)
8. View your score after each question
9. Wait for the next question
10. See final results after all 20 questions

## Technical Details

### Backend Components
- **quizGenerator.js**: Handles question generation using OpenAI API
  - Uses GPT-3.5-turbo model
  - Accepts language, category, and difficulty settings
  - Generates questions in specified language
  - Filters questions by category
  - Adjusts difficulty level
  - Provides 20 fallback questions if API fails
  - Validates JSON response format

- **quizGameManager.js**: Manages quiz game state
  - Tracks current question index
  - Records player answers (server-side only)
  - Calculates scores
  - Prevents duplicate answers per question

- **roomManager.js**: Manages room state and quiz settings
  - Stores quiz settings per room
  - Identifies first player (Player 1)
  - Manages settings lock state
  - Provides settings update and retrieval methods

- **server.js**: Socket.IO event handlers
  - `quiz:start` - Initialize quiz game (requires locked settings)
  - `quiz:update-settings` - Update settings (Player 1 only)
  - `quiz:lock-settings` - Lock settings and start quiz (Player 1 only)
  - `quiz:get-settings` - Get current settings
  - `quiz:get-question` - Get current question
  - `quiz:submit-answer` - Submit player answer
  - `quiz:next-question` - Move to next question
  - `quiz:get-scores` - Get current scores
  - `quiz:finished` - Broadcast game completion

### Frontend Components
- **QuizSettingsPanel.jsx**: Settings configuration component (for players)
  - Shown only when quiz game starts
  - Player 1 sees editable settings form
  - Other players see read-only settings view
  - Allows language, category, and difficulty selection
  - Broadcasts settings changes in real-time
  - Locks settings when Player 1 confirms

- **QuizGameScreen.jsx**: Host display component
  - Waits for settings to be locked
  - Shows questions and options
  - Displays timer countdown
  - Shows live scoreboard
  - Indicates which players answered
  - Highlights correct answer
  - Shows final rankings

- **QuizController.jsx**: Player controller component
  - Displays question and options
  - Shows timer
  - Allows answer selection (once per question)
  - Shows feedback (correct/incorrect)
  - Displays current score
  - Shows waiting states between questions

## Game Flow
1. Host starts Quiz Battle → Players see settings panel
2. Player 1 configures settings (language, category, difficulty)
3. Other players see settings but cannot modify
4. Player 1 clicks "Confirm & Start Quiz" → Settings locked
5. Backend generates 20 questions based on settings
6. Question 1 displayed → 20-second timer starts
7. Players select answers → Server validates and updates scores
8. Timer expires → Correct answer highlighted
9. Host clicks "Next Question" → Repeat steps 6-8
10. After question 20 → Display final rankings
11. Winner announced with score
12. Return to lobby

## Security Features
- API key stored in `.env` (not exposed to frontend)
- Correct answers kept server-side only
- Answer validation done on server
- One answer per player per question enforced
- Settings modification restricted to Player 1 only
- Settings cannot be changed after being locked
- Room-based isolation (no cross-room interference)

## Customization
You can customize the quiz by modifying:
- Languages: Add more languages in `QuizSettingsPanel.jsx` and update prompts in `quizGenerator.js`
- Categories: Add more categories in `QuizSettingsPanel.jsx` and update prompts in `quizGenerator.js`
- Difficulty levels: Modify options in `QuizSettingsPanel.jsx` and prompts in `quizGenerator.js`
- Number of questions: Change `count` parameter in `quizGenerator.generateQuestions()`
- Timer duration: Modify `timeLimit` in `quizGameManager.js` and corresponding UI components
- Fallback questions: Edit `getFallbackQuestions()` in `quizGenerator.js`

## Troubleshooting

### OpenAI API Issues
- If questions fail to generate, the system automatically uses fallback questions
- Check API key validity in `.env`
- Ensure internet connectivity for OpenAI API calls
- Monitor backend console for error messages

### Connection Issues
- Ensure backend is running on port 3000
- Verify frontend SOCKET_URL matches backend address
- Check firewall settings if testing on different devices
- Use the same network for host and players

### Game State Issues
- If game gets stuck, refresh the host page
- Players can rejoin by re-entering the room code
- Games are automatically cleaned up 60 seconds after completion
