# Portfolio Advanced — Clément Cochod

Portfolio immersif (IA · 3D · animations), FR par défaut + EN.

## Stack
Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · three.js / React Three Fiber / drei · déploiement Vercel.

## Développement
```bash
npm install
npm run dev     # http://localhost:3000 → redirige vers /fr
npm run lint
npm run build
```

## Structure
- `src/app/[lang]/` : layout racine et pages, une route par langue (`/fr`, `/en`)
- `src/dictionaries/{fr,en}.json` : textes traduits
- `src/proxy.ts` : redirige les URLs sans langue vers `/fr`
- `src/components/` : composants partagés (`SmoothScroll`, `LangSwitch`)
