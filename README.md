# Card scanner app

Mobile app (Expo/React Native) for scanning Yu-Gi-Oh cards and cataloging
them by type, rarity, and quantity.

## Setup

```bash
npx create-expo-app card-scanner-app   # or drop these files into an existing Expo project
cd card-scanner-app
npm install
npx expo start
```

## How it works

1. **Scan** (`src/screens/ScanScreen.js`) - opens the camera, captures a photo.
2. **Recognition** (`src/services/cardRecognition.js`) - sends the photo to a
   vision model to read the card name, then looks that name up on
   [YGOPRODeck](https://db.ygoprodeck.com/api-guide/) for the authoritative
   card data (type, artwork, every known printing/rarity).
3. **Confirm match** (`src/screens/ConfirmMatchScreen.js`) - shows the match,
   lets you pick the correct printing/rarity (a photo alone can't always
   tell foil rarities apart), and set quantity.
4. **Save** - written to a local SQLite database
   (`src/db/database.js`); if the exact card+rarity+set already exists,
   quantity is incremented instead of creating a duplicate row.
5. **Collection** (`src/screens/CollectionScreen.js`) - filterable list by
   card type, showing rarity and quantity.

## Building a real installable app (EAS Build)

This produces an actual APK file you install directly on your Android
phone - no App Store, no computer needed to run it once built.

**Before you build:** deploy `server/` somewhere public (see Backend setup
below) and put that public URL in `RECOGNITION_API_URL` in
`src/services/cardRecognition.js`. `localhost` and your computer's LAN IP
will NOT work once this is a standalone app off your home network.

Also open `app.json` and change `com.yourname.cardscanner` (in both
`ios.bundleIdentifier` and `android.package`) to something unique to you,
e.g. `com.janedoe.cardscanner`.

Then:

```bash
npm install -g eas-cli
cd card-scanner-app
npm install
eas login          # creates/logs into a free expo.dev account
eas build:configure
eas build --platform android --profile preview
```

The build runs on Expo's servers (~15-20 min). When it finishes, the
terminal prints a link (and shows a QR code) to download the `.apk`
directly - open that link on your phone, download it, and tap to install
(Android will ask you to allow "install from unknown sources" the first
time, since this isn't from the Play Store).

**iOS note:** installing on an iPhone requires enrolling in the Apple
Developer Program ($99/year) - that's an Apple requirement, not
something any tool can get around. With that, run
`eas build --platform ios --profile preview` and distribute via TestFlight
or an ad-hoc build. Without it, the fastest way to try this on iOS is
`npx expo start` + the free Expo Go app, which runs the real app without
needing a paid account (just no standalone installable file).

## Backend setup (keeps your API key off the device)

The app never talks to Claude directly. It calls `server/`, a small proxy
that holds your API key server-side:

```bash
cd server
npm install
cp .env.example .env    # then paste your real key into .env
npm start                # listens on port 3000
```

In `src/services/cardRecognition.js`, update `RECOGNITION_API_URL` to point
at that server - `localhost` only works in a simulator on the same machine;
from a physical device use your computer's LAN IP (e.g.
`http://192.168.1.23:3000/api/recognize-card`), or deploy `server/`
somewhere reachable and use that URL instead.

## Fuzzy name matching

`src/services/ygoApi.js` now has `searchCardsFuzzy()`, which handles OCR
noise from real photo scans: it normalizes punctuation/case, retries with
progressively looser queries (full guess -> normalized -> most distinctive
keyword) until something matches, then ranks whatever comes back by
similarity to the original guess.

Run the test suite (mocks the YGOPRODeck API with a small local dataset, so
it works offline):

```bash
npm test
```

This covers dropped hyphens, stray punctuation, "&" read as "and", and
ranking between similarly-named cards (e.g. the Elemental HERO archetype).
It does **not** replace testing against real photos - mocked OCR guesses are
a stand-in for what a vision model might output, not proof of what it
actually will. Before shipping, scan 15-20 real physical cards under normal
lighting, log the vision model's raw guess for each, and confirm
`searchCardsFuzzy()` puts the right card first every time. Cards with long
archetype names and special characters are worth targeting specifically,
since that's where misreads cluster.

The Confirm Match screen (`ConfirmMatchScreen.js`) now also shows the other
ranked candidates as selectable chips when the matcher returns more than
one, so a wrong top guess is a tap to fix rather than a dead end.

## Next steps to build out

- Card detail screen (tap a card for full stats/effect text)
- CSV export of the collection
- Deleting/editing existing entries (swipe-to-delete on the list)
- Offline queue for scans made without network access
