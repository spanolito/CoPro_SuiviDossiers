# CoPro Master - Suivi de Dossiers Copropriété

Application Web complète de gestion et de suivi des dossiers de copropriété (Infiltrations, Chauffage, Ascenseur, etc.).

## 🚀 Lancement Local Rapide

Cette application a été développée avec **Next.js (App Router)**, **Prisma** et **SQLite** pour être la plus simple possible à installer et lancer.

### 1. Prérequis
- Node.js (version 18+)
- npm installé

### 2. Installation des dépendances
Ouvrez votre terminal à la racine de l'application (`CoPro_SuiviDossiers`) et lancez :
```bash
npm install
```

### 3. Base de données
La base de données SQLite (`dev.db`) est déjà configurée. 
Pour recréer et insérer les données de démonstration (7 dossiers pré-remplis) :
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Démarrer le serveur
```bash
npm run dev
```

L'application est maintenant disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🔐 Identifiants de Démonstration

*   **Administrateur**
    *   Email : `admin@copro.com`
    *   Mot de passe : `password123`
*   **Conseil Syndical**
    *   Email : `conseil@copro.com`
    *   Mot de passe : `password123`

---

## 📦 Déploiement

Cette application peut être déployée très facilement sur des plateformes comme Vercel, Railway ou un VPS classique (avec Docker ou PM2).
Comme la base de données est un fichier SQLite, il convient d'utiliser un Volume Persistant en production, ou de migrer rapidement vers PostgreSQL (en changeant `provider = "postgresql"` dans `schema.prisma`).
