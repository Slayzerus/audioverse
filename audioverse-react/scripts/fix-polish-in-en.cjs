/**
 * Translate Polish strings in en.json to English.
 * Run: node scripts/fix-polish-in-en.cjs
 */
const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const json = JSON.parse(fs.readFileSync(fp, 'utf8'));

// Polish → English mapping for all 100 identified strings
const translations = {
  // addRound
  "addRound.changeSong": "Change song",

  // admin.moderation
  "admin.moderation.title": "Moderation — Reports",
  "admin.moderation.pending": "Pending",
  "admin.moderation.resolved": "Resolved",
  "admin.moderation.results": "results",
  "admin.moderation.empty": "No reports to display.",
  "admin.moderation.reason": "Reason",
  "admin.moderation.reportedBy": "Reported by",
  "admin.moderation.resolve": "Resolve",

  // adminDashboard
  "adminDashboard.sectionManagement": "Management",
  "adminDashboard.featureVisibilityDesc": "Enable / disable application features",
  "adminDashboard.newsFeedsDesc": "Manage news feeds",
  "adminDashboard.sectionSecurity": "Security",
  "adminDashboard.otpDesc": "Manage one-time passwords",
  "adminDashboard.auditLogsDesc": "System event log",
  "adminDashboard.loginAttemptsDesc": "User login attempts",
  "adminDashboard.auditDashboardDesc": "Security audit overview",
  "adminDashboard.honeytokensDesc": "Honeytokens for breach detection",
  "adminDashboard.securityDashboardDesc": "Central security dashboard",

  // adminNotifications
  "adminNotifications.subtitle": "Send a test SMS (SMSAPI.pl) or email from the backend.",
  "adminNotifications.message": "Message",
  "adminNotifications.sending": "Sending…",
  "adminNotifications.sendSms": "Send SMS",
  "adminNotifications.emailBody": "Body (optional)",
  "adminNotifications.sendEmail": "Send e-mail",

  // common
  "common.sending": "Sending...",
  "common.deleteConfirm": "Are you sure you want to delete?",

  // eventMedia
  "eventMedia.photos": "Photos",
  "eventMedia.chooseCollection": "Choose a collection...",
  "eventMedia.noCollections": "No collections. Add the first one!",
  "eventMedia.deleteTag": "Delete tag",
  "eventMedia.clickToTag": "Click on the photo to tag",
  "eventMedia.tagLabel": "Name / label...",
  "eventMedia.tagPerson": "Tag person",
  "eventMedia.editPhoto": "Edit photo",
  "eventMedia.clickToTagVideo": "Click on the video to tag",

  // eventVideos
  "eventVideos.confirmDelete": "Delete this video?",
  "eventVideos.uploading": "Uploading...",

  // joinParty
  "joinParty.scanQR": "Scan the QR code to join:",

  // locations
  "locations.placeDetails": "Place details",
  "locations.noSelection": "Select a place from the search or enter coordinates.",
  "locations.nearbyTitle": "Events nearby",
  "locations.useSelected": "Use selected",
  "locations.reverseDesc": "Enter coordinates → get an address.",
  "locations.reverse": "Find address",
  "locations.travelMode": "Travel mode",
  "locations.getDirections": "Get directions",

  // lookup (ExternalMediaLookup)
  "lookup.browseBy": "Browse by",
  "lookup.items": "items",
  "lookup.loading": "Loading...",
  "lookup.noResults": "No results matching the criteria",
  "lookup.total": "total",
  "lookup.back": "Back",

  // nav
  "nav.themePicker": "Change skin",
  "nav.noteSound": "Note sound",
  "nav.previewSound": "Preview sound",

  // party
  "party.joinRound": "Join round",
  "party.join": "Join",
  "party.noAssignments": "Click a player to add",
  "party.noMicsDetected": "No microphones detected",
  "party.joinAndPlay": "Join and play",
  "party.showQR": "Show QR",
  "party.qrEnlarge": "Enlarge ×2",
  "party.qrFullscreen": "Full screen",
  "party.votes": "votes",
  "party.reject": "Reject",
  "party.approve": "Approve",
  "party.sessionStartTime": "Start time",
  "party.sessionEndTime": "End time",
  "party.teamMode": "Team mode",
  "party.teams": "Teams",
  "party.noTeamsYet": "No teams yet. Add the first one.",
  "party.removeTeam": "Remove team",
  "party.teamNamePlaceholder": "E.g. Team A",
  "party.addTeam": "Add team",
  "party.deleteSession": "Delete session",
  "party.sessionSave": "Save session",
  "party.addRound": "Add round",
  "party.noRoundsYet": "No rounds yet. Add the first one by clicking the button above.",
  "party.startRound": "Start round",
  "party.proposalRejected": "This proposal has been rejected.",
  "party.suggestedBy": "Suggested by",
  "party.restore": "Restore",
  "party.voteUp": "Vote",
  "party.accessCode": "Access code",
  "party.noMatchingParties": "No parties matching the filters",
  "party.tryDifferentFilters": "Try changing or resetting the filters",
  "party.createFirstParty": "Create your first party by clicking + above",

  // photoEditor
  "photoEditor.title": "Photo editor",

  // playerForm
  "playerForm.photo": "Photo",
  "playerForm.clickToEdit": "Click to edit",
  "playerForm.clickToUpload": "Click to choose a photo",

  // report
  "report.title": "Report",
  "report.sent": "Report has been sent. Thank you!",
  "report.subtitle": "Choose a reason for reporting:",
  "report.submit": "Submit report",

  // songLookup
  "songLookup.byLanguage": "By language",
  "songLookup.allLanguages": "Language: All",
  "songLookup.title": "Choose a song",
  "songLookup.searchPlaceholder": "Search title, artist...",
};

// Apply translations
function setNested(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

let count = 0;
for (const [key, val] of Object.entries(translations)) {
  setNested(json, key, val);
  count++;
}

fs.writeFileSync(fp, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(`Fixed ${count} Polish strings in en.json`);
