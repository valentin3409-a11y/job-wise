# JobWise — Guide de déploiement

Application d'aide à la candidature propulsée par Claude (Anthropic).

---

## Stack

- **Framework** : Next.js 14 (App Router, TypeScript)
- **IA** : Claude claude-sonnet-4-5 via `@anthropic-ai/sdk`
- **Base de données** : Supabase (PostgreSQL + Auth)
- **Déploiement** : Vercel

---

## Déploiement en 15 minutes

### 1. Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. **SQL Editor** → coller et exécuter `supabase/schema.sql`
4. **Settings → API** → copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Anthropic API

1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key
2. Copier → `ANTHROPIC_API_KEY`

### 3. Déploiement Vercel

```bash
# 1. Pousser sur GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/TON-USER/jobwise.git
git push -u origin main

# 2. Sur vercel.com → New Project → Import repo
# 3. Ajouter les 4 variables d'environnement
# 4. Deploy ✓
```

**Variables d'environnement à ajouter sur Vercel :**

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Test local

```bash
cp .env.local.example .env.local
# Remplir les 4 variables
npm install
npm run dev
# → http://localhost:3000
```

---

## Fonctionnalités

### Recherche d'emploi IA
- Recherche sur LinkedIn, Indeed, Jobs.ch, JobUp, Glassdoor et plus
- Filtrage par pays, ville, niveau d'expérience
- 12 offres avec score de compatibilité estimé

### Analyse complète (5 modules en parallèle)
1. **Score 0–100** + forces/lacunes + points bloquants
2. **CV tailorisé** — bullets reformulés (aucune invention)
3. **Lettre de motivation** — ton humain, pas corporate
4. **3 messages LinkedIn** — soft / direct / fort impact (<300 chars)
5. **5 Q&A entretien** — réponses naturelles avec exemples concrets

### Mode batch
- Sélection multiple d'offres
- Analyse en parallèle (3 offres à la fois)
- Queue de validation : réviser, modifier, approuver ou rejeter
- Sauvegarde automatique dans le dashboard

### Dashboard
- Toutes les candidatures avec statut
- Scores, synthèse, historique complet
- Mise à jour du statut (Brouillon → Postulé → Entretien → Offre)

---

## Structure

```
jobwise/
├── app/
│   ├── api/
│   │   ├── search/route.ts    # Recherche d'offres (Claude)
│   │   ├── analyze/route.ts   # Analyse complète (5 modules)
│   │   └── cv/route.ts        # Upload/parse CV
│   ├── page.tsx               # Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── analyze/page.tsx       # Wizard 3 étapes
│   ├── results/[id]/page.tsx
│   └── globals.css
├── components/
│   └── Topbar.tsx
├── lib/
│   ├── claude.ts              # Client Anthropic
│   ├── prompts.ts             # Tous les prompts IA
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── types/index.ts
├── middleware.ts
├── supabase/schema.sql
└── vercel.json
```

---

## Coûts estimés

| Service    | Plan gratuit               | Coût prod (~100 users/mois) |
|------------|----------------------------|-----------------------------|
| Vercel     | Généreux, suffisant pour démarrer | $0–20/mois |
| Supabase   | 500MB DB, 2GB bandwidth    | $0–25/mois  |
| Anthropic  | Pay-as-you-go              | ~$0.015 par analyse complète |

---

## Problèmes connus

**Timeout Vercel (plan gratuit)** : limite 10s sur le plan Hobby.
Solution : passer au plan Pro ($20/mois) ou réduire `max_tokens` dans les prompts.
Le `vercel.json` inclus configure `maxDuration: 60` qui nécessite le plan Pro.

**Alternative gratuite** : déployer le backend sur Railway ou Render (gratuit, sans limite de timeout).
