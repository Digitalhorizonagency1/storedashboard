# CONTEXTE — Dashboard Catalogue (projet séparé de Store Zoul)

## À qui s'adresse ce document
Autonome, pensé pour être collé dans une nouvelle conversation Claude. Ce chantier est un **outil livrable aux clients** de Digital Horizon Agency (DHA) — un dashboard web pour que le vendeur ajoute/modifie ses articles lui-même, sans passer par Airtable. Projet distinct du debug de `store_zoul` (qui a son propre fichier mémoire, `CONTEXTE_STORE_ZOUL_FIN_SESSION_01JUIL2026.md`).

---

## 1. Pourquoi ce projet existe

En creusant la latence du sync Airtable→Supabase (trigger par sondage périodique, traitement séquentiel), la question a évolué vers : plutôt que de rafistoler Airtable, autant donner au vendeur un outil pensé pour lui, qui écrit directement dans Supabase — la même base que lit le bot WhatsApp. Zéro synchronisation, zéro délai, zéro classe de bug liée à la désynchronisation.

Une alternative (NocoDB branché directement sur le Postgres de Supabase, éliminant toute duplication de données) a été évoquée et mise de côté pour plus tard — jugée trop de chantier en parallèle du reste. Le dashboard custom a été préféré : plus rapide à livrer, expérience sur mesure pour le vendeur, pas de nouvelle infra à maintenir sur le VPS.

---

## 2. Décisions prises (à ne pas remettre en question sans raison)

- **Mot de passe simple partagé** (pas de compte utilisateur individuel) — suffisant pour un seul vendeur par boutique
- **Upload de photo par glisser-déposer** directement dans le dashboard
- **Hébergement Vercel** (le client a déjà un compte Vercel + GitHub)
- **Architecture : frontend statique + fonctions serverless Vercel**, pas de framework (pas de Next.js) — plus simple, zéro build step
- **La clé `service_role` Supabase ne quitte jamais le serveur** — utilisée uniquement dans les fonctions `api/*.js`, jamais exposée au navigateur. C'est ce qui permet d'écrire dans Supabase sans avoir à configurer de règles RLS spécifiques pour ce dashboard (service_role bypass RLS par nature).
- **Un seul dépôt de code, réutilisable pour tous les futurs clients de l'agence** — chaque client obtient son propre déploiement Vercel du même dépôt, avec ses propres variables d'environnement (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, `SHOP_NAME`). Le nom de la boutique n'est jamais écrit en dur dans le code — il vient de la variable `SHOP_NAME`, récupérée via `api/config.js`.

---

## 3. État actuel — livré, pas encore testé en conditions réelles

### Fichiers livrés (dossier `dashboard/`)
```
dashboard/
├── index.html          — interface complète (connexion, liste, formulaire ajout/édition)
├── api/
│   ├── login.js         — vérifie le mot de passe
│   ├── articles.js      — GET (liste), POST (créer), PUT (modifier) un article
│   ├── upload.js        — upload photo vers Supabase Storage (bucket articles-photos)
│   ├── config.js        — retourne le nom de la boutique (SHOP_NAME) pour l'affichage
│   └── _shared.js       — utilitaires partagés (vérification mot de passe, client Supabase admin, nettoyage nom de fichier)
├── package.json         — dépendance unique : @supabase/supabase-js
├── .gitignore
├── .env.example
└── README.md            — guide de déploiement complet, y compris le processus multi-clients
```

### Champs gérés par le formulaire, mappés sur la table `articles` Supabase
- `nom`, `categorie` (homme/femme/enfant), `type` (texte libre avec suggestions : mocassins/sandales/escarpins/boots/sneakers/derby)
- `tags_occasion` — champ conditionnel, visible uniquement si catégorie = homme ou femme, valeurs limitées à "habillé"/"nu pied"/vide (reflète la règle produit décidée dans la session Store Zoul : plus d'occasion événementielle type mariage/sport en filtre de recherche)
- `couleur`, `prix`, `qualite` (optionnel, pour la suggestion d'upgrade du bot), `description`
- `photo_url` — géré via upload glisser-déposer, jamais saisi en texte
- `pointures_dispo` et `stock_par_pointure` — interface dynamique (ajouter/retirer des lignes pointure+stock), `stock_total` recalculé automatiquement côté serveur (jamais laissé à la saisie manuelle, pour éviter toute divergence — même logique que le sync Airtable)
- `actif` — interrupteur simple

### Pas encore fait
- **Aucun test réel** : le dashboard n'a jamais été déployé ni utilisé pour de vrai. Prochaine étape à faire en priorité dans la nouvelle conversation : déploiement complet (GitHub → Vercel → variables d'environnement), ajout d'un article de test, vérification qu'il apparaît bien dans Supabase, puis vérification que le bot WhatsApp le retrouve correctement.
- Pas de suppression d'article dans l'interface actuelle (seulement créer/modifier/désactiver via le toggle `actif`) — à ajouter si le besoin se confirme.
- Pas de recherche/filtre dans la liste d'articles (pertinent si le catalogue grossit beaucoup).

---

## 4. Points de vigilance pour la suite

- **Limite de taille des fonctions serverless Vercel** : le body est limité à 8 Mo (configuré explicitement dans `api/upload.js`) — largement suffisant pour une photo de chaussure compressée, mais à garder en tête si jamais un client essaie d'uploader une image non compressée en haute résolution.
- **Pas de vrai système de comptes** : convient pour un vendeur unique par boutique. Si un client a besoin de plusieurs personnes avec des accès différenciés un jour, il faudra passer à un vrai système d'authentification (Supabase Auth, par exemple) — pas fait maintenant, volontairement, pour rester simple.
- **Maintenance à l'échelle** : avec un seul dépôt partagé entre plusieurs déploiements Vercel indépendants, une correction de bug ou une amélioration nécessite de redéployer chaque projet client séparément (pas de mise à jour groupée automatique). Pas un problème avec 1-2 clients, à surveiller si le nombre de clients grossit significativement — architecture multi-tenant centralisée à reconsidérer à ce moment-là, pas avant.
- **Cohérence avec le bot** : le champ "Type" accepte n'importe quel texte libre (avec suggestions), mais seuls les types reconnus par le dictionnaire de détection du bot (`Detecter type article` dans `store_zoul`) seront trouvés par les clients qui cherchent par catégorie précise. Si un nouveau type de chaussure apparaît dans le catalogue (ex: une nouvelle forme non prévue), il faudra aussi penser à l'ajouter au dictionnaire de détection côté `store_zoul` — sinon le bot ne saura pas répondre "immédiatement" à une demande de ce type précis (il tombera sur le comportement générique).

---

## 5. Rappel de la table `articles` (Supabase) — pour référence rapide

Colonnes connues et utilisées : `id`, `nom`, `categorie`, `type`, `tags_occasion`, `couleur`, `prix`, `pointures_dispo`, `stock_total`, `stock_par_pointure` (jsonb), `description`, `photo_url`, `actif`, `qualite`, `created_at`. Bucket Supabase Storage pour les photos : `articles-photos`.

---

## 6. Méthode de travail (rappel)

- Incrémental et test-gated : déployer, tester un scénario complet avant d'ajouter une fonctionnalité de plus
- Ne jamais exposer la clé `service_role` côté client — toute écriture Supabase passe par une fonction serverless
- Le code reste générique (pas de nom de client en dur) pour permettre la réutilisation multi-clients sans divergence de code
