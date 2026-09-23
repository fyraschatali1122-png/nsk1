// config.js — paramètres partagés par index.html et admin.html

const CONFIG = {
  // Lien CSV publié de ton Google Sheet (Fichier > Partager > Publier sur le web > CSV)
  CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuHwb0HGELAZhFI3d4vrmWxevqbwwzPgTIOD8TIGII_x7oSsJleuGLdX4cYb5V373IX_Rn1RPrh_Q/pub?gid=569786249&single=true&output=csv",

  // Lien /exec de ton Google Apps Script (voir apps-script/Code.gs + apps-script/README.md)
  WEBAPP_URL: "https://script.google.com/macros/s/AKfycbzjLpFTbPsrye8ZbxS0Wiqgyusw9FWYcVk3hM6buVBnuTMsBR36pTfyXurRFUK1I0iK2w/exec",

  // Identifiants du login spécial admin (Firas). La vraie protection se fait côté
  // Apps Script via ADMIN_KEY (voir Code.gs) — ceci n'est qu'un filtre côté écran.
  ADMIN_NAME: "firas",
  ADMIN_STATION: "007",

  // Doit être identique à ADMIN_KEY dans apps-script/Code.gs.
  // Change cette valeur avant de déployer !
  ADMIN_KEY: "change-moi-cette-cle"
};
