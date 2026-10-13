# King Scales Digitals / TMC FX Academia — merged site

## Site files
- `index.html`, `styles.css`, `script.js`: landing page and its interactions.
- `signup.html`, `signup.css`, `signup.js`: Google sign-up, username and consent flow.
- `login.html`, `login.css`, `login.js`: Google login with the existing puzzle interaction.
- `dashboard.html`, `dashboard.css`, `dashboard.js`: member dashboard, account deletion flow, plan status and expiration countdown UI.
- `firebase-config.js`: **the single place** to enter the Firebase Web App configuration.
- `assets/tmc-fx-academia-logo.png` and `assets/tmc-fx-academia-logo.webp`: existing logo assets used by the landing page and member pages.

## Navigation
1. Landing page `Get started` buttons open `signup.html`.
2. The landing page `Login` link opens `login.html`.
3. Sign-up and login links let users move between those pages.
4. Successful sign-up/login redirects to `dashboard.html`.
5. The logo and `Home` button on the dashboard return to `index.html`.
6. The dashboard redirects signed-out visitors to `login.html`.

## Before live use
1. Open `firebase-config.js` and paste the config for the same Firebase Web App.
2. Enable Google under Firebase Authentication and add the deployed domain to Authorized domains.
3. Enable Firestore and install reviewed, restrictive production rules. Do not use open test-mode rules.
4. Test signup, login, existing-user login, username collision, consent flow, dashboard access, account deletion, and mobile layouts on HTTPS or localhost.
5. Verify the displayed bank account number and fill in the correct bank name and account-holder name in `dashboard.html` before accepting payments. The bank name and account holder remain deliberately marked for confirmation; do not launch while those fields are unresolved.
6. Payment confirmation is **not yet a secure production workflow**. The current member UI can show pending verification, but a real owner/representative panel and trusted backend function must verify receipt of funds, assign staff roles, update the plan, and create audit records before paid access can be considered secure.
7. Plan expiry countdown reads the user's `expiresAt` field and updates the display. A client-side countdown is only a display; enforce expiry on the trusted backend and/or Firestore rules for protected resources.

## Security notes
- Firebase web config is expected to be visible in browser code. Never put service-account keys or private secrets in `firebase-config.js`.
- Client-side username uniqueness checks alone do not prevent races; use a trusted transaction/function and restrictive rules for username reservations.
- The dashboard's account deletion code uses Google reauthentication, but production should also account for related data and use a trusted deletion flow where appropriate.
- The login puzzle is a UI friction check, not a substitute for Firebase App Check, rate limiting, or server-side abuse protection.
- Course prices and durations remain as they appeared in the provided project. Confirm business pricing and all bank details before launch.
