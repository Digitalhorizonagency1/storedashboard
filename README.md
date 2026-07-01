# Dashboard Catalogue — Souliers Prestige

Interface simple pour ajouter et modifier les articles du catalogue, directement dans la base Supabase utilisée par le bot WhatsApp. Pas de synchronisation, pas de délai — ce que le vendeur enregistre ici est immédiatement visible par Aria.

## Comment ça marche

- **`index.html`** : l'interface (page unique, aucune installation nécessaire pour le vendeur, juste un lien à ouvrir dans un navigateur)
- **`api/login.js`** : vérifie le mot de passe
- **`api/articles.js`** : liste, crée et modifie les articles dans Supabase
- **`api/upload.js`** : envoie les photos vers Supabase Storage

**Point de sécurité important** : la clé `service_role` Supabase (celle qui a tous les droits) ne vit que dans les variables d'environnement Vercel, jamais dans le code envoyé au navigateur. Le navigateur du vendeur ne voit que le mot de passe qu'il tape — toutes les écritures vers Supabase passent par les fonctions serveur (`api/*.js`).

## Déploiement — étape par étape

### 1. Créer le dépôt GitHub

Crée un nouveau dépôt (public ou privé, peu importe) sur GitHub, et pousse-y tous les fichiers de ce dossier :

```bash
cd dashboard
git init
git add .
git commit -m "Dashboard catalogue Souliers Prestige"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/souliers-dashboard.git
git push -u origin main
```

### 2. Importer le projet dans Vercel

1. Va sur vercel.com → **Add New** → **Project**
2. Choisis le dépôt GitHub que tu viens de créer
3. Laisse les réglages par défaut (Vercel détecte automatiquement le dossier `api/` comme des fonctions serverless)
4. **Avant de cliquer sur Deploy**, ajoute les 3 variables d'environnement (section "Environment Variables") :
   - `DASHBOARD_PASSWORD` → le mot de passe que le vendeur utilisera
   - `SUPABASE_URL` → `https://gzbfuzwtrakljqcibqyc.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` → la clé service_role Supabase (Project Settings → API dans Supabase)
5. Clique sur **Deploy**

### 3. Vérifier le bucket Supabase Storage

Le dashboard uploade les photos dans le bucket `articles-photos` (le même que celui déjà utilisé par le sync Airtable). Rien à créer si ce bucket existe déjà — c'est le cas normalement.

### 4. Donner l'accès au vendeur

Une fois déployé, Vercel te donne une URL du type `https://souliers-dashboard.vercel.app`. Donne cette URL et le mot de passe au vendeur — c'est tout ce dont il a besoin.

## Déployer pour un nouveau client (agence, plusieurs boutiques)

Ce code est générique — aucune information propre à Souliers Prestige n'est écrite en dur. Pour un nouveau client :

1. Dans Vercel, **Add New → Project**, et choisis **le même dépôt GitHub** (pas besoin de le dupliquer)
2. Donne un nom de projet différent (ex: `dashboard-client-b`)
3. Renseigne 4 variables d'environnement propres à ce client :
   - `DASHBOARD_PASSWORD` → son mot de passe à lui
   - `SHOP_NAME` → le nom affiché dans le dashboard (ex: "Boutique Chic")
   - `SUPABASE_URL` → l'URL de **son** projet Supabase (pas celui de Souliers Prestige)
   - `SUPABASE_SERVICE_ROLE_KEY` → **sa** clé service_role à lui
4. Déploie

Chaque client obtient sa propre URL Vercel, son propre mot de passe, ses propres données — complètement isolé des autres, sans jamais partager de base. Le code ne change jamais d'un client à l'autre, seules les variables d'environnement changent.

## Mettre à jour le mot de passe plus tard

Vercel → ton projet → Settings → Environment Variables → modifie `DASHBOARD_PASSWORD` → redéploie (Vercel le fait automatiquement, ou clique sur "Redeploy" dans l'onglet Deployments).

## Limites connues (pour info, pas bloquant)

- Une seule "session" à la fois n'est pas gérée de façon stricte (pas de vrai système de comptes) — convient pour un usage à un seul vendeur. Si plusieurs personnes doivent avoir des accès distincts un jour, il faudra passer à un vrai système de comptes (Supabase Auth par exemple).
- Les photos sont limitées à 8 Mo par upload (limite du corps de requête Vercel) — largement suffisant pour une photo de chaussure, mais à savoir si jamais un fichier refuse de partir.
- Le champ "Type" propose des suggestions (mocassins, sandales, escarpins, boots, sneakers, derby) mais accepte n'importe quel texte — cohérent avec le fonctionnement actuel du bot, qui reconnaît ces catégories précises. Éviter d'inventer un type qui ne correspond à rien de connu du bot, sinon les clients ne le trouveront jamais en cherchant par catégorie.
