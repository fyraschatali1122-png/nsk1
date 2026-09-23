# Déploiement du backend (Google Apps Script)

Ce dossier contient `Code.gs`, le backend qui gère :
- les demandes d'échange de service (créer / lister / accepter)
- les notifications (envoyées aux deux collègues + à toute la station lors d'une acceptation)
- l'import d'un planning Excel par l'admin (écrit dans le Google Sheet)

## Étapes

1. Ouvre ton Google Sheet (celui déjà publié en CSV pour `CSV_URL`).
2. Ajoute une colonne **Station** si elle n'existe pas déjà, à côté de Name/Code, sur l'onglet utilisé par le site (par défaut nommé `Planning` — adapte `SHEET_PLANNING` dans `Code.gs` si ton onglet a un autre nom).
3. Dans le Sheet : **Extensions → Apps Script**.
4. Supprime le contenu par défaut et colle celui de `Code.gs`.
5. En haut du fichier, remplis :
   - `SPREADSHEET_ID` : l'ID du Google Sheet (dans l'URL, entre `/d/` et `/edit`).
   - `SHEET_PLANNING` : le nom exact de l'onglet du planning (si différent de `Planning`).
   - `ADMIN_KEY` : choisis une clé secrète, et remets **exactement la même** dans `config.js` (`CONFIG.ADMIN_KEY`) côté site.
6. **Déployer → Nouveau déploiement** :
   - Type : *Application Web*
   - Exécuter en tant que : *Moi*
   - Qui a accès : *Tout le monde*
7. Autorise les permissions demandées (accès à ta feuille de calcul).
8. Copie l'URL `.../exec` obtenue et colle-la dans `config.js` → `CONFIG.WEBAPP_URL`.

## Onglets créés automatiquement

- `Echanges` : historique des demandes d'échange (statut `open`/`accepted`).
- `Notifications` : une ligne par notification, avec `Type` = `user` (nom exact) ou `station` (nom de station), lue par le site au chargement (pas de push en temps réel — la personne doit ouvrir/recharger la page).

## Sécurité — à savoir

- Le lien `/exec` est accessible publiquement dès qu'on le connaît : c'est le fonctionnement standard d'Apps Script. L'import de planning est protégé par `ADMIN_KEY`, mais ce n'est qu'une protection légère (clé partagée dans le code front) — ne partage pas ce lien publiquement.
- Le login "admin" (nom `firas` / station `007`) côté site n'est qu'un filtre d'écran : c'est bien `ADMIN_KEY` côté Apps Script qui protège réellement l'écriture dans le Sheet.
- Pour une vraie authentification (mot de passe par utilisateur, etc.), il faudrait passer à un backend avec comptes utilisateurs — au-delà de ce que Google Sheets + Apps Script permet simplement.

## Limite des notifications

Comme il n'y a pas de serveur qui pousse des notifications en temps réel (pas de web push), la cloche 🔔 du site se met à jour **quand la page est chargée ou rechargée**, pas instantanément quand un collègue accepte un échange.
