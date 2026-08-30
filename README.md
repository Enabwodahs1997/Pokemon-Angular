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

3. Add your Firebase config in `src/environments/environment.ts`.

4. Run locally:

```bash
npm start
```

5. Deploy to Firebase hosting:

```bash
npm run build
npm run firebase:deploy
```
