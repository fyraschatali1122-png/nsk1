/**
 * Code.gs — backend du site Dienstplan (Google Apps Script)
 *
 * À déployer en "Application Web" (Exécuter en tant que : Moi,
 * Accès : Tout le monde), puis coller l'URL /exec obtenue dans
 * config.js (WEBAPP_URL) côté site.
 *
 * Voir README.md dans ce dossier pour les étapes complètes.
 */

// ====== À CONFIGURER ======
const SPREADSHEET_ID = "COLLE_ICI_L_ID_DE_TON_GOOGLE_SHEET";
const SHEET_PLANNING = "Planning";        // onglet contenant Date, Start, End, Name, Code, Station
const SHEET_ECHANGES = "Echanges";        // créé automatiquement si absent
const SHEET_NOTIFICATIONS = "Notifications"; // créé automatiquement si absent

// Doit être identique à CONFIG.ADMIN_KEY dans config.js
const ADMIN_KEY = "change-moi-cette-cle";
// ===========================

function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase();
  try {
    if (action === "requests") return respond(listOpenRequests());
    if (action === "notifications") return respond(listNotifications(e.parameter.name || "", e.parameter.station || ""));
    return respond({ ok: false, error: "Action inconnue." });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || "{}"); } catch (err) {}
  const action = (body.action || "").toLowerCase();
  try {
    if (action === "create") return respond(createRequest(body));
    if (action === "accept") return respond(acceptRequest(body));
    if (action === "uploadplanning") return respond(uploadPlanning(body));
    return respond({ ok: false, error: "Action inconnue." });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getOrCreateSheet(name, headers) {
  const s = ss();
  let sheet = s.getSheetByName(name);
  if (!sheet) {
    sheet = s.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

/* ---------------- Échanges ---------------- */

function echangesSheet() {
  return getOrCreateSheet(SHEET_ECHANGES,
    ["ID", "Date création", "Nom", "Station", "Date service", "Note", "Statut", "Accepté par", "Date acceptation"]);
}

function createRequest(body) {
  const name = String(body.name || "").trim();
  const station = String(body.station || "").trim();
  const date = String(body.date || "").trim();
  const note = String(body.note || "").trim();
  if (!name || !date) return { ok: false, error: "Nom et date requis." };

  const sheet = echangesSheet();
  const id = Utilities.getUuid();
  sheet.appendRow([id, new Date().toISOString(), name, station, date, note, "open", "", ""]);
  return { ok: true, id };
}

function listOpenRequests() {
  const sheet = echangesSheet();
  const rows = sheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    items.push({
      id: r[0], createdAt: r[1], name: r[2], station: r[3],
      date: r[4], note: r[5], status: r[6], accepterName: r[7], acceptedAt: r[8]
    });
  }
  return { ok: true, items };
}

function acceptRequest(body) {
  const id = String(body.id || "").trim();
  const accepterName = String(body.accepterName || "").trim();
  const accepterStation = String(body.accepterStation || "").trim();
  if (!id || !accepterName) return { ok: false, error: "id et accepterName requis." };

  const sheet = echangesSheet();
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1, requesterName = "", requesterStation = "", shiftDate = "";
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      rowIndex = i + 1; // 1-based, +1 pour header
      requesterName = data[i][2];
      requesterStation = data[i][3];
      shiftDate = data[i][4];
      if (String(data[i][6]).toLowerCase() !== "open") return { ok: false, error: "Cette demande n'est plus ouverte." };
      break;
    }
  }
  if (rowIndex === -1) return { ok: false, error: "Demande introuvable." };

  sheet.getRange(rowIndex, 7).setValue("accepted");       // Statut
  sheet.getRange(rowIndex, 8).setValue(accepterName);      // Accepté par
  sheet.getRange(rowIndex, 9).setValue(new Date().toISOString()); // Date acceptation

  // Notifications : les deux collègues + toute la station du demandeur
  const msg = `Échange accepté : ${requesterName} ↔ ${accepterName} pour le service du ${shiftDate}.`;
  addNotification("user", requesterName, msg);
  addNotification("user", accepterName, msg);
  addNotification("station", requesterStation, msg);
  if (accepterStation && normalize(accepterStation) !== normalize(requesterStation)) {
    addNotification("station", accepterStation, msg);
  }

  return { ok: true };
}

/* ---------------- Notifications ---------------- */

function notificationsSheet() {
  return getOrCreateSheet(SHEET_NOTIFICATIONS,
    ["ID", "Type", "Cible", "Message", "Créée le"]);
}

function addNotification(type, target, message) {
  if (!target) return;
  const sheet = notificationsSheet();
  sheet.appendRow([Utilities.getUuid(), type, target, message, new Date().toISOString()]);
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function listNotifications(name, station) {
  const sheet = notificationsSheet();
  const rows = sheet.getDataRange().getValues();
  const nName = normalize(name), nStation = normalize(station);
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const type = normalize(r[1]), target = normalize(r[2]);
    const isForUser = type === "user" && target === nName;
    const isForStation = type === "station" && target === nStation;
    if (isForUser || isForStation) {
      items.push({ id: r[0], type: r[1], target: r[2], message: r[3], createdAt: r[4] });
    }
  }
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { ok: true, items: items.slice(0, 50) };
}

/* ---------------- Import planning (admin) ---------------- */

function uploadPlanning(body) {
  if (String(body.adminKey || "") !== ADMIN_KEY) {
    return { ok: false, error: "Clé admin invalide." };
  }
  const station = String(body.station || "").trim();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!station) return { ok: false, error: "Station cible requise." };
  if (!rows.length) return { ok: false, error: "Aucune ligne à importer." };

  const sheet = getOrCreateSheet(SHEET_PLANNING, ["Date", "Start", "End", "Name", "Code", "Station"]);
  const data = sheet.getDataRange().getValues();
  const header = data[0].map(h => String(h).toLowerCase().trim());
  const stationCol = header.indexOf("station");

  // Supprime les anciennes lignes de cette station (en partant de la fin pour ne pas décaler les index)
  if (stationCol !== -1) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (normalize(data[i][stationCol]) === normalize(station)) {
        sheet.deleteRow(i + 1);
      }
    }
  }

  // Ajoute les nouvelles lignes
  rows.forEach(r => {
    sheet.appendRow([r.date || "", r.start || "", r.end || "", r.name || "", r.code || "", r.station || station]);
  });

  return { ok: true, written: rows.length };
}
