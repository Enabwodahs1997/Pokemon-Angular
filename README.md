# Pokemon-Angular

Angular + Firebase starter scaffold for a Pokemon card game project.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Set up Firebase (you need the Firebase CLI and a Firebase project):

```bash
npm i -g firebase-tools
firebase login
firebase init
```

Choose `Hosting` and `Firestore` (optional). When asked for build output, use `dist/`.

3. Create a local Firebase override file that is not tracked by Git:

```ts
// src/environments/environment.local.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
};
```

This project automatically merges the local file over the safe placeholder values in `src/environments/environment.ts`.

4. Run locally:

```bash
npm start
```

5. Deploy to Firebase hosting:

```bash
npm run build
firebase deploy
```

Important:

- Never commit real Firebase config values to source control.
- Keep `src/environments/environment.local.ts` untracked and local to your machine.
- The repository includes a `.gitignore` entry for local environment files to prevent accidental commits.
