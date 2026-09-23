// Minimal backend proxy so the API key never ships inside the mobile app.
// The app calls this server; this server calls Anthropic with the key
// pulled from an environment variable.
//
// Run with: npm install && npm start
// (requires ANTHROPIC_API_KEY set in the environment or a .env file)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // base64 images need a larger body limit

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in environment. Set it in a .env file.');
  process.exit(1);
}

app.post('/api/recognize-card', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
              },
              {
                type: 'text',
                text:
                  'This is a photo of a Yu-Gi-Oh trading card. Reply with ONLY the exact card name as printed on the card, nothing else. If you cannot read it clearly, reply with your best guess anyway.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(502).json({ error: 'Vision provider request failed' });
    }

    const data = await response.json();
    const guessedName = data.content?.[0]?.text?.trim();

    if (!guessedName) {
      return res.status(422).json({ error: 'Could not read a card name from the photo' });
    }

    res.json({ guessedName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Card recognition proxy listening on port ${PORT}`));
