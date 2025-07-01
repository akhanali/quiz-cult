# OpenAI Setup Guide for Quiz Cult

## 🤖 AI-Powered Question Generation

Quiz Cult uses **backend-based AI generation** for secure, unlimited quiz content using OpenAI's API.

## 📋 Prerequisites

1. **OpenAI Account**: Sign up at [https://platform.openai.com](https://platform.openai.com)
2. **API Key**: Generate an API key from your OpenAI dashboard
3. **Credits**: Ensure you have sufficient API credits (very low cost - ~$0.01-0.05 per quiz)

## 🔧 Setup Instructions

### Step 1: Get Your OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the generated key (it starts with `sk-`)

### Step 2: Configure Backend Environment
Create a `.env` file in the `backend/` directory:

```bash
# Navigate to backend directory
cd backend

# Create the environment file
touch .env
```

Add your API key to `backend/.env`:
```env
# OpenAI Configuration (for AI question generation)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Uncomment to override default model
# OPENAI_MODEL=gpt-3.5-turbo
```

**⚠️ Important Security Notes:**
- Never commit your API key to version control
- The `.env` file is already in `.gitignore`
- Replace `sk-your-actual-api-key-here` with your real API key

### Step 3: Restart Development Server
```bash
# From project root
npm run dev
```

## ✅ Testing the Setup

1. **Start the app**: `npm run dev` (from project root)
2. **Check backend logs**: Look for "✅ OpenAI client initialized successfully"
3. **Create a room** with any topic (e.g., "Space Science", "Quantum Physics")
4. **Verify AI generation**: Frontend will show "AI Question Generation Active"

## 🔍 Troubleshooting

### Backend Shows "⚠️ OPENAI_API_KEY environment variable not set"
- Check that `backend/.env` exists in the backend directory
- Verify the variable name is exactly `OPENAI_API_KEY` 
- Restart the development server after creating the file

### Frontend Shows "AI Unavailable - Using sample questions"
- This means the backend OpenAI is not configured
- The app works perfectly with sample questions
- Follow Step 2 above to enable AI generation

### API Generation Failed
- Check your OpenAI account has available credits
- Verify your API key is valid and active
- Backend automatically falls back to sample questions

### Rate Limits
- OpenAI has rate limits for API usage
- The backend handles rate limit errors gracefully
- Consider upgrading your OpenAI plan for higher limits

## 💰 Cost Information

**Typical Usage:**
- ~$0.01-0.05 per 5-10 question set
- Based on GPT-3.5-turbo pricing (~$0.002 per 1K tokens)
- 100 quizzes per day ≈ $5/day ≈ $150/month

**Cost Optimization:**
- Backend uses efficient prompts to minimize token usage
- Intelligent fallback system prevents overuse
- Questions are optimized for quality and cost

## 🚀 Features Enabled

**With OpenAI configured:**
- ✅ **Unlimited Topics**: Any subject you can think of
- ✅ **Difficulty Matching**: AI generates appropriate complexity  
- ✅ **Quality Questions**: Factual, verifiable, well-structured
- ✅ **Time Optimization**: Smart time limits based on difficulty
- ✅ **Server-Side Security**: API key never exposed to frontend

**Without OpenAI (current default):**
- ✅ **High-Quality Sample Questions**: Curated questions across difficulties
- ✅ **Multiple Topics**: Science, History, Sports, Technology, and more
- ✅ **Full Functionality**: Complete quiz experience without AI
- ✅ **Zero Cost**: No API charges

## 🔐 Architecture Notes

**Backend-Based Generation (Current):**
- OpenAI API calls happen on the server
- API key is securely stored in backend environment
- Frontend receives generated questions via API
- More secure and cost-controllable

**Why Backend Instead of Frontend:**
- 🔒 **Security**: API key never exposed to browser
- 💰 **Cost Control**: Server-side rate limiting
- 🎯 **Reliability**: Better error handling and fallbacks
- 📊 **Monitoring**: Centralized usage tracking

## 📞 Support

If you encounter issues:
1. Check the backend console for OpenAI-related messages
2. Verify your OpenAI account status and credits
3. Test with different topics and difficulties
4. Check network connectivity for API calls

**The app works perfectly with or without OpenAI** - you'll always have a functional quiz experience with high-quality questions! 🎯 