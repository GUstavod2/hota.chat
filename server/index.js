const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI API
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY is not defined in the environment variables.");
}

// Instantiate OpenAI client only if we have a key (or pass undefined and it throws, but we handle it in the route)
const openai = new OpenAI({
  apiKey: apiKey,
});

// Route to handle chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!apiKey) {
       return res.status(500).json({ error: "OpenAI API key is not configured on the server." });
    }

    // Format history for OpenAI API
    // OpenAI expects messages array with format: { role: 'system' | 'user' | 'assistant', content: '...' }
    // Our frontend history sends { role: 'user' | 'model', content: '...' }
    const formattedHistory = (history || []).map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content,
    }));

    // Add the new user message
    const messages = [
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // using gpt-4o as a great default, you can change to gpt-3.5-turbo if you prefer
      messages: messages,
    });

    const reply = response.choices[0].message.content;

    res.json({ reply: reply });
  } catch (error) {
    console.error("Error communicating with OpenAI API:", error);
    res.status(500).json({ error: "Ocorreu um erro ao processar sua solicitação com a IA.", details: error.message });
  }
});

// Export the app for Vercel Serverless Functions
module.exports = app;

// Start the server locally (Vercel bypasses this)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Hota.chat Backend running on http://localhost:${port}`);
  });
}
