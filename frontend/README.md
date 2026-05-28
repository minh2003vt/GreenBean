# GreenBean

Frontend-only agricultural diagnostic app (mobile-first layout).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Project structure

```
src/
├── app/              # Router + root App
├── components/
│   ├── layout/     # TopBar, BottomNav, AppShell
│   └── ui/           # Shared UI primitives
├── constants/        # Static config (nav, problems)
├── features/         # Feature modules (problems, voice)
├── pages/            # Route-level screens
├── styles/           # Global CSS + design tokens
└── types/            # Shared TypeScript types
```

## Navigation

- **Top bar** — branding, language (stub), audio (stub)
- **Bottom bar** — Home, History, Saved, Profile
- **Problem cards** — link to `/problems/:slug` detail stubs

## Next steps (when you extend)

- Wire **Language** and **audio** buttons in `TopBar.tsx`
- Add Web Speech API in `VoiceInputSection.tsx`
- Replace `PROBLEM_CATEGORIES` with API data
- Fill `ProblemDetailPage` with real solution content
- Add i18n (e.g. `react-i18next`) under `src/i18n/`
