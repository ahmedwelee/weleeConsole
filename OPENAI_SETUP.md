# OpenAI API Key Setup Guide

This guide will help you configure your OpenAI API key for the Quiz Battle game.

## Quick Setup

### Step 1: Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Give it a name (e.g., "WeleeConsole Quiz")
6. Copy the key immediately (you won't be able to see it again!)

Your key will look like:
```
sk-proj-abcd1234efgh5678ijklmnop9012qrstuvwx3456yzABCDEF7890...
```

### Step 2: Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd v1_backend
   ```

2. Copy the example environment file (if you haven't already):
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file:
   ```bash
   nano .env
   ```
   
   Or open it with any text editor (VSCode, Sublime, etc.)

4. Replace `your_openai_api_key_here` with your actual API key:
   ```env
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
   ```

5. Save the file

### Step 3: Verify Setup

1. Start the backend server:
   ```bash
   npm start
   ```

2. Look for this message in the console:
   ```
   Server is running on port 3000
   ```

3. When you start a quiz game, the system will use your OpenAI key to generate questions

## Security Reminders

🔒 **NEVER commit your `.env` file to Git**
- The `.gitignore` is already configured to exclude it
- Only commit `.env.example` with placeholder values

🔒 **NEVER share your API key publicly**
- Don't post it in issues, forums, or chat
- Don't include it in screenshots
- Treat it like a password

🔒 **Rotate your keys regularly**
- If you suspect a key is compromised, delete it immediately
- Create a new key from the OpenAI dashboard

## Testing Your Configuration

### Method 1: Check Environment Variable

Add this temporary code to `v1_backend/server.js` (just for testing):

```javascript
console.log('OpenAI API Key configured:', process.env.OPENAI_API_KEY ? '✓ Yes' : '✗ No');
```

### Method 2: Start a Quiz Game

1. Start both backend and frontend
2. Join a room and start Quiz Battle
3. Configure settings and start the quiz
4. If questions are generated successfully, your API key is working!
5. Check the backend console for any error messages

## Troubleshooting

### Issue: "Invalid API Key"

**Cause**: The API key is incorrect or expired

**Solution**:
1. Double-check you copied the entire key
2. Ensure there are no extra spaces or quotes
3. Generate a new key if the old one was deleted

### Issue: "Rate limit exceeded"

**Cause**: You've exceeded OpenAI's rate limits

**Solution**:
1. Wait a few minutes and try again
2. Check your OpenAI usage limits
3. Consider upgrading your OpenAI plan

### Issue: "Insufficient credits"

**Cause**: Your OpenAI account has no credits

**Solution**:
1. Add credits to your OpenAI account
2. Check billing settings at [OpenAI Billing](https://platform.openai.com/account/billing)
3. The game will use fallback questions if API fails

### Issue: Questions are in wrong language

**Cause**: The language setting might not be applied correctly

**Solution**:
1. Ensure Player 1 selects the correct language
2. Check the backend console for any errors
3. The language instruction is sent to OpenAI in the prompt

## Fallback Mode

If your API key is not configured or the API fails:
- ✓ The game will still work
- ✓ It will use 20 built-in fallback questions
- ✓ Questions will be in English only
- ✓ Only general knowledge category available

## Cost Information

Each quiz game makes **1 API call** to generate **20 questions**.

Typical costs (as of 2024):
- GPT-3.5-turbo: ~$0.001 - $0.002 per game
- Very affordable for personal use
- Monitor usage at [OpenAI Usage](https://platform.openai.com/usage)

## Environment Variables Explained

```env
PORT=3000                                    # Backend server port
FRONTEND_URL=http://localhost:5173          # Frontend URL (update for network play)
NODE_ENV=development                         # Environment (development/production)
OPENAI_API_KEY=sk-proj-your-key-here        # Your OpenAI API key
```

## Network Play Configuration

If you want to play across devices on your local network:

1. Find your local IP address:
   ```bash
   # On Mac/Linux
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. Update `FRONTEND_URL` in `.env`:
   ```env
   FRONTEND_URL=http://192.168.1.108:5173
   ```

3. Access the game from other devices using your IP:
   - Host: `http://192.168.1.108:5173/host`
   - Players: `http://192.168.1.108:5173/join`

## Need Help?

- Check the main [README.md](../README.md)
- Review [QUIZ_BATTLE.md](../QUIZ_BATTLE.md) for game details
- Create an issue on GitHub
- Verify your `.env` file is not tracked in git: `git status`

## Example: Complete Setup

```bash
# 1. Navigate to backend
cd v1_backend

# 2. Copy environment template
cp .env.example .env

# 3. Edit the .env file
nano .env

# 4. Paste your API key (the one you got from OpenAI)
# OPENAI_API_KEY=sk-proj-abcd1234efgh5678ijklmnop9012qrstuvwx3456...

# 5. Save and close

# 6. Install dependencies (if not done)
npm install

# 7. Start the server
npm start

# 8. In another terminal, start frontend
cd ../v1_frontend
npm install
npm run dev

# 9. Open browser and enjoy! 🎮
```

---

**Remember**: Your API key is like a password. Keep it safe! 🔐
