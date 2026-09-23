# Dienstplan — planning des infirmiers

## Fichiers

- `index.html` — page principale : connexion (nom + station) puis planning filtré, calendrier, échange de service et notifications.
- `admin.html` — page réservée (login `firas` / station `007`) pour importer un planning Excel vers le Google Sheet.
- `config.js` — à remplir : `CSV_URL` (Google Sheet publié en CSV), `WEBAPP_URL` (Apps Script), `ADMIN_KEY`.
- `style.css` — styles partagés.
- `apps-script/Code.gs` + `apps-script/README.md` — backend Google Apps Script (échanges, notifications, import Excel). **À déployer séparément**, voir le README de ce dossier.

## Ce qui a changé par rapport à la version précédente

1. **Page de connexion** : l'infirmier entre prénom, nom et station → il est directement redirigé vers son planning filtré. Si aucune correspondance n'est trouvée dans le Google Sheet, un message l'invite à vérifier son nom et sa station.
2. **Login admin** : nom `firas` + station `007` ouvre `admin.html`, la page d'import de planning Excel (les lignes sont écrites dans le Google Sheet pour la station choisie, en remplaçant les anciennes lignes de cette station).
3. **Échange de service** : chaque infirmier peut proposer un de ses services à l'échange ; ses collègues de la même station voient la demande et peuvent l'accepter.
4. **Notifications** : à chaque acceptation d'échange, une notification est envoyée aux deux collègues concernés et à tous les utilisateurs de la station (visible via la cloche 🔔 au chargement de la page — voir la limite expliquée dans `apps-script/README.md`).

## Prérequis côté Google Sheet

Le Google Sheet source doit avoir une colonne **Station** (ou **Service**) à côté des colonnes Date/Start/End/Name/Code déjà utilisées, pour que la station de chaque service soit connue.

## Mise en route

1. Déployer `apps-script/Code.gs` (voir `apps-script/README.md`) → récupérer l'URL `/exec`.
2. Remplir `config.js` : `CSV_URL`, `WEBAPP_URL`, `ADMIN_KEY` (même valeur que dans `Code.gs`).
3. Héberger les fichiers (GitHub Pages, Netlify, etc.) — pas de serveur nécessaire côté front.
