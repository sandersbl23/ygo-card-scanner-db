// Sends a captured card photo to your backend proxy (server/index.js), which
// holds the vision API key server-side and forwards the request to Claude.
// The app itself never sees or ships an API key.
//
// IMPORTANT once you build a real installable app (EAS build): localhost
// and your computer's LAN IP will NOT be reachable from a standalone app
// running on your phone off your home network. Deploy server/ somewhere
// public first (Render, Railway, Fly.io all have free tiers) and put that
// public URL here before running `eas build` - otherwise scanning will fail
// with a network error for anyone using the installed app away from your
// dev machine.

import { searchCardsFuzzy } from './ygoApi';

const RECOGNITION_API_URL = 'https://ygo-card-scanner-db.onrender.com';

export async function recognizeCardFromPhoto(base64Image) {
  const response = await fetch(RECOGNITION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Recognition request failed: ${response.status}`);
  }

  const { guessedName } = await response.json();

  if (!guessedName) {
    throw new Error('Could not read a card name from the photo.');
  }

  // Confirm the guess against the real database. searchCardsFuzzy handles
  // OCR noise (typos, misread punctuation, partial reads) and falls back
  // through progressively looser matching until it finds candidates.
  const matches = await searchCardsFuzzy(guessedName);

  return {
    guessedName,
    matches, // ranked array of full card objects from YGOPRODeck, best match first
  };
}
