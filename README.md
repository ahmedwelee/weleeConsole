# WeleeConsole

A multiplayer gaming platform featuring Quiz Battle - an interactive quiz game where players use their phones as controllers.

## Features

- **Quiz Battle Game**: Multiplayer quiz game with real-time scoring
- **OpenAI Integration**: Dynamic question generation using GPT-3.5-turbo
- **Multiple Languages**: Support for Arabic, French, and English
- **Various Categories**: History, Geography, Football, Countries & Capitals, Electronics, Famous People, Movies & Music
- **Difficulty Levels**: Easy, Medium, and Hard
- **Real-time Gameplay**: Socket.IO powered real-time communication
- **Mobile Controllers**: Players use their phones to answer questions
- **Host Display**: Questions and scores displayed on TV/Desktop

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for dynamic question generation)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ahmedwelee/weleeConsole.git
cd weleeConsole
```

### 2. Backend Setup

```bash
cd v1_backend
npm install
```

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your OpenAI API key:
   ```bash
   nano .env  # or use your preferred text editor
   ```

3. Update the `OPENAI_API_KEY` value:
   ```
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```

#### Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-proj-` or `sk-`)
6. Paste it into your `.env` file

**Important**: Your API key should look like this:
```
sk-proj-Eyh2paUI-hP-E4Hoz7DdMlidFWNFps_5sO_R0T...
```

#### Start the Backend Server

```bash
npm start
```

The backend server will run on `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal window:

```bash
cd v1_frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## How to Play

### Host (TV/Desktop)
1. Navigate to `http://localhost:5173/host`
2. Share the room code or QR code with players
3. Select "🎯 Quiz Battle" from the game selection
4. Click "Start Game"
5. Wait for Player 1 to configure settings
6. Monitor gameplay and scores

### Players (Phones)
1. Navigate to `http://localhost:5173/join` or scan the QR code
2. Enter the room code and your name
3. Player 1 configures quiz settings (language, category, difficulty)
4. Other players wait for settings to be confirmed
5. Answer questions by tapping options (A, B, C, D)
6. View scores and compete for the top position!

## Configuration

### Quiz Settings (Player 1 Only)

The first player to join has exclusive control over:

- **Language**: Arabic, French, or English
- **Category**: 
  - History
  - Geography
  - Football
  - Countries and Capitals
  - Electronics
  - Famous People
  - Movies and Music
- **Difficulty**: Easy, Medium, or Hard

### Fallback Questions

If the OpenAI API key is not configured or the API fails, the system automatically uses 20 built-in fallback questions to ensure the game can still be played.

## Security Best Practices

⚠️ **Important Security Notes**:

1. **Never commit your `.env` file** to version control
2. **Never share your OpenAI API key** publicly
3. The `.gitignore` file is already configured to exclude `.env`
4. Use `.env.example` as a template only
5. Keep your API keys secure and rotate them regularly

## Docker Setup (Optional)

```bash
docker-compose -f v1_docker-compose.yml up
```

## Troubleshooting

### OpenAI API Issues

**Problem**: Questions fail to generate
**Solution**: 
- Verify your API key is correct in `.env`
- Check your OpenAI account has available credits
- Ensure internet connectivity
- The system will automatically use fallback questions if API fails

### Connection Issues

**Problem**: Players can't connect
**Solution**:
- Ensure backend is running on port 3000
- Check `FRONTEND_URL` in `.env` matches your setup
- For networked play, update `FRONTEND_URL` to your local IP
- Ensure all devices are on the same network

### Port Already in Use

**Problem**: Port 3000 or 5173 is already in use
**Solution**:
```bash
# Find and kill the process using the port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## Project Structure

```
weleeConsole/
├── v1_backend/           # Node.js + Socket.IO backend
│   ├── server.js         # Main server file
│   ├── quizGenerator.js  # OpenAI quiz generation
│   ├── quizGameManager.js # Quiz game logic
│   ├── roomManager.js    # Room management
│   ├── .env.example      # Environment template
│   └── package.json
├── v1_frontend/          # React + Vite frontend
│   └── src/
│       ├── components/   # React components
│       └── utils/        # Utilities (socket.io-client)
└── README.md
```

## Technology Stack

### Backend
- Node.js
- Express
- Socket.IO
- OpenAI API (GPT-3.5-turbo)
- dotenv

### Frontend
- React
- Vite
- Socket.IO Client
- React Router

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available for educational purposes.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation in `/QUIZ_BATTLE.md`
- Review implementation details in `/IMPLEMENTATION_SUMMARY.md`

## Credits

Developed by Ahmed Welee
