# Quiz Battle Game

## Overview
Quiz Battle is a multiplayer quiz game integrated into the WeleeConsole platform. Players use their phones as controllers to answer quiz questions displayed on the main screen.

## Features
- 20 questions per game
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
6. Questions will appear automatically with a 20-second timer
7. View real-time player answers and scores
8. After 20 questions, see the final rankings and winner

### Players (Phones):
1. Navigate to `/join` route or scan the QR code
2. Enter the room code and your name
3. Wait for the host to start the game
4. Answer questions by tapping one of the four options (A, B, C, D)
5. See immediate feedback (correct/incorrect)
6. View your score after each question
7. Wait for the next question
8. See final results after all 20 questions

## Technical Details

### Backend Components
- **quizGenerator.js**: Handles question generation using OpenAI API
  - Uses GPT-3.5-turbo model
  - Provides 20 fallback questions if API fails
  - Validates JSON response format

- **quizGameManager.js**: Manages quiz game state
  - Tracks current question index
  - Records player answers (server-side only)
  - Calculates scores
  - Prevents duplicate answers per question

- **server.js**: Socket.IO event handlers
  - `quiz:start` - Initialize quiz game
  - `quiz:get-question` - Get current question
  - `quiz:submit-answer` - Submit player answer
  - `quiz:next-question` - Move to next question
  - `quiz:get-scores` - Get current scores
  - `quiz:finished` - Broadcast game completion

### Frontend Components
- **QuizGameScreen.jsx**: Host display component
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
1. Host starts Quiz Battle → Backend generates 20 questions
2. Question 1 displayed → 20-second timer starts
3. Players select answers → Server validates and updates scores
4. Timer expires → Correct answer highlighted
5. Host clicks "Next Question" → Repeat steps 2-4
6. After question 20 → Display final rankings
7. Winner announced with score
8. Return to lobby

## Security Features
- API key stored in `.env` (not exposed to frontend)
- Correct answers kept server-side only
- Answer validation done on server
- One answer per player per question enforced
- Room-based isolation (no cross-room interference)

## Customization
You can customize the quiz by modifying:
- Number of questions: Change `count` parameter in `quizGenerator.generateQuestions()`
- Timer duration: Modify `timeLimit` in `quizGameManager.js` and corresponding UI components
- Difficulty: Adjust OpenAI prompt in `quizGenerator.js`
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
