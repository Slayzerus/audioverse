/**
 * sync-pl-json.cjs
 * -----------------
 * Adds missing i18n keys from en.json to pl.json with Polish translations.
 * Run: node scripts/sync-pl-json.cjs
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const plPath = path.join(localesDir, 'pl.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const pl = JSON.parse(fs.readFileSync(plPath, 'utf-8'));

/* ── helpers ─────────────────────────────────────────────────── */

function getLeafPaths(obj, prefix = '') {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getLeafPaths(value, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

function getByPath(obj, p) {
  return p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

function setByPath(obj, p, val) {
  const parts = p.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== 'object') {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

/* ── Polish translation map for every missing key ────────────── */

const translations = {
  // activeTokens
  "activeTokens.type": "Typ",
  "activeTokens.description": "Opis",
  "activeTokens.tokenId": "ID tokena",

  // admin — user management
  "admin.createUser": "Utwórz użytkownika",
  "admin.cancel": "Anuluj",
  "admin.usernamePlaceholder": "Nazwa użytkownika",
  "admin.emailPlaceholder": "E-mail",
  "admin.fullNamePlaceholder": "Imię i nazwisko",
  "admin.tempPasswordPlaceholder": "Tymczasowe hasło",
  "admin.loadingUsers": "Ładowanie użytkowników...",
  "admin.tableId": "ID",
  "admin.tableUsername": "Użytkownik",
  "admin.tableEmail": "E-mail",
  "admin.tableName": "Nazwa",
  "admin.tablePasswordChange": "Zmiana hasła",
  "admin.tablePasswordExpiry": "Termin ważności hasła",
  "admin.tableStatus": "Status",
  "admin.tableActions": "Akcje",
  "admin.deleteConfirm": "Czy na pewno chcesz usunąć tego użytkownika?",
  "admin.otpError": "Błąd generowania OTP",
  "admin.blocked": "🚫 Zablokowany",
  "admin.activeStatus": "✓ Aktywny",
  "admin.unblock": "Odblokuj",
  "admin.block": "Zablokuj",
  "admin.deleteBtn": "Usuń",
  "admin.otpBtn": "OTP",
  "admin.generatedOtp": "Wygenerowane OTP",
  "admin.validUntil": "Ważne do: {{date}}",
  "admin.loadError": "Nie udało się załadować użytkowników",
  "admin.createError": "Nie udało się utworzyć użytkownika",
  "admin.deleteError": "Nie udało się usunąć użytkownika",
  "admin.blockError": "Nie udało się zablokować użytkownika",
  "admin.updateError": "Nie udało się zaktualizować użytkownika",

  // admin.honeyToken
  "admin.honeyToken.descriptionPlaceholder": "Opis",
  "admin.honeyToken.creating": "Tworzenie...",
  "admin.honeyToken.createToken": "Utwórz token",
  "admin.honeyToken.createFailed": "Nie udało się utworzyć tokena",

  // admin.skins
  "admin.skins.title": "Skórki",
  "admin.skins.description": "Zarządzaj dostępnymi skórkami UI używanymi przez selektor motywów.",
  "admin.skins.saved": "Skórki zapisane",
  "admin.skins.reset": "Skórki przywrócone do domyślnych",
  "admin.skins.resetButton": "Przywróć domyślne",
  "admin.skins.invalidJson": "Nieprawidłowy JSON",
  "admin.skins.invalidFormat": "Nieprawidłowy format. Oczekiwano niepustej tablicy obiektów motywów.",
  "admin.skins.noteTitle": "Uwaga:",
  "admin.skins.note": "Każda skórka musi zawierać id, name, emoji, isDark oraz vars (mapa zmiennych CSS).",

  // admin.skins.vars
  "admin.skins.vars.bgPrimary.label": "Tło (główne)",
  "admin.skins.vars.bgPrimary.desc": "Główny kolor tła aplikacji.",
  "admin.skins.vars.bgSecondary.label": "Tło (drugorzędne)",
  "admin.skins.vars.bgSecondary.desc": "Drugorzędne tło dla paneli i pasków bocznych.",
  "admin.skins.vars.bgTertiary.label": "Tło (trzeciorzędne)",
  "admin.skins.vars.bgTertiary.desc": "Trzeciorzędne tło dla subtelnych powierzchni.",
  "admin.skins.vars.bgElevated.label": "Tło (wyniesione)",
  "admin.skins.vars.bgElevated.desc": "Tło dla kart, okienek i wyniesionych powierzchni.",
  "admin.skins.vars.textPrimary.label": "Tekst (główny)",
  "admin.skins.vars.textPrimary.desc": "Główny kolor tekstu.",
  "admin.skins.vars.textSecondary.label": "Tekst (drugorzędny)",
  "admin.skins.vars.textSecondary.desc": "Drugorzędny tekst, np. opisy.",
  "admin.skins.vars.textTertiary.label": "Tekst (trzeciorzędny)",
  "admin.skins.vars.textTertiary.desc": "Trzeciorzędny / pomocniczy kolor tekstu.",
  "admin.skins.vars.textDisabled.label": "Tekst (wyłączony)",
  "admin.skins.vars.textDisabled.desc": "Wyłączony / przytłumiony kolor tekstu.",
  "admin.skins.vars.borderPrimary.label": "Obramowanie (główne)",
  "admin.skins.vars.borderPrimary.desc": "Główny kolor obramowania.",
  "admin.skins.vars.borderSecondary.label": "Obramowanie (drugorzędne)",
  "admin.skins.vars.borderSecondary.desc": "Drugorzędny kolor obramowania.",
  "admin.skins.vars.accentPrimary.label": "Akcent (główny)",
  "admin.skins.vars.accentPrimary.desc": "Główny kolor akcentu (przyciski, wyróżnienia).",
  "admin.skins.vars.accentSecondary.label": "Akcent (drugorzędny)",
  "admin.skins.vars.accentSecondary.desc": "Drugorzędny kolor akcentu.",
  "admin.skins.vars.accentHover.label": "Akcent (najechanie)",
  "admin.skins.vars.accentHover.desc": "Kolor akcentu przy najechaniu.",
  "admin.skins.vars.linkColor.label": "Kolor linku",
  "admin.skins.vars.linkColor.desc": "Kolor linków.",
  "admin.skins.vars.linkHover.label": "Link (najechanie)",
  "admin.skins.vars.linkHover.desc": "Kolor linku przy najechaniu.",
  "admin.skins.vars.success.label": "Sukces",
  "admin.skins.vars.success.desc": "Kolor komunikatów / odznak sukcesu.",
  "admin.skins.vars.warning.label": "Ostrzeżenie",
  "admin.skins.vars.warning.desc": "Kolor komunikatów / odznak ostrzeżenia.",
  "admin.skins.vars.error.label": "Błąd",
  "admin.skins.vars.error.desc": "Kolor komunikatów / odznak błędu.",
  "admin.skins.vars.info.label": "Informacja",
  "admin.skins.vars.info.desc": "Kolor komunikatów / odznak informacyjnych.",
  "admin.skins.vars.shadowSm.label": "Cień (mały)",
  "admin.skins.vars.shadowSm.desc": "Mały cień dla subtelnej głębi.",
  "admin.skins.vars.shadowMd.label": "Cień (średni)",
  "admin.skins.vars.shadowMd.desc": "Średni cień dla kart.",
  "admin.skins.vars.shadowLg.label": "Cień (duży)",
  "admin.skins.vars.shadowLg.desc": "Duży cień dla nakładek.",
  "admin.skins.vars.navBg.label": "Tło nawigacji",
  "admin.skins.vars.navBg.desc": "Kolor tła paska nawigacji.",
  "admin.skins.vars.navText.label": "Tekst nawigacji",
  "admin.skins.vars.navText.desc": "Kolor tekstu nawigacji.",
  "admin.skins.vars.navActive.label": "Nawigacja (aktywna)",
  "admin.skins.vars.navActive.desc": "Kolor aktywnego elementu nawigacji.",
  "admin.skins.vars.navHover.label": "Nawigacja (najechanie)",
  "admin.skins.vars.navHover.desc": "Kolor nawigacji przy najechaniu.",
  "admin.skins.vars.dropdownBg.label": "Tło menu",
  "admin.skins.vars.dropdownBg.desc": "Tło menu rozwijanych.",
  "admin.skins.vars.dropdownText.label": "Tekst menu",
  "admin.skins.vars.dropdownText.desc": "Kolor tekstu w menu rozwijanych.",
  "admin.skins.vars.dropdownHoverBg.label": "Menu (najechanie)",
  "admin.skins.vars.dropdownHoverBg.desc": "Kolor tła najechanych elementów menu.",
  "admin.skins.vars.inputBg.label": "Tło pola tekstowego",
  "admin.skins.vars.inputBg.desc": "Kolor tła pól tekstowych.",
  "admin.skins.vars.inputText.label": "Tekst pola",
  "admin.skins.vars.inputText.desc": "Kolor tekstu w polach.",
  "admin.skins.vars.inputBorder.label": "Obramowanie pola",
  "admin.skins.vars.inputBorder.desc": "Kolor obramowania pól.",
  "admin.skins.vars.inputFocusBorder.label": "Obramowanie (fokus)",
  "admin.skins.vars.inputFocusBorder.desc": "Kolor obramowania pola po kliknięciu.",
  "admin.skins.vars.cardBg.label": "Tło karty",
  "admin.skins.vars.cardBg.desc": "Kolor tła kart i paneli.",
  "admin.skins.vars.cardBorder.label": "Obramowanie karty",
  "admin.skins.vars.cardBorder.desc": "Kolor obramowania kart.",
  "admin.skins.vars.btnBg.label": "Tło przycisku",
  "admin.skins.vars.btnBg.desc": "Domyślny kolor tła przycisku.",
  "admin.skins.vars.btnText.label": "Tekst przycisku",
  "admin.skins.vars.btnText.desc": "Kolor tekstu przycisków.",
  "admin.skins.vars.btnBorder.label": "Obramowanie przycisku",
  "admin.skins.vars.btnBorder.desc": "Kolor obramowania przycisków.",
  "admin.skins.vars.btnHoverBg.label": "Przycisk (najechanie)",
  "admin.skins.vars.btnHoverBg.desc": "Tło przycisku przy najechaniu.",
  "admin.skins.vars.scrollbarTrack.label": "Tor paska przewijania",
  "admin.skins.vars.scrollbarTrack.desc": "Kolor toru paska przewijania.",
  "admin.skins.vars.scrollbarThumb.label": "Suwak paska przewijania",
  "admin.skins.vars.scrollbarThumb.desc": "Kolor suwaka paska przewijania.",

  // admin.skins.catalog
  "admin.skins.catalog.velvet-night.name": "Aksamitna Noc",
  "admin.skins.catalog.velvet-night.description": "Gładkie, aksamitne odcienie dla luksusowego ciemnego interfejsu.",
  "admin.skins.catalog.saffron-glow.name": "Szafranowy Blask",
  "admin.skins.catalog.saffron-glow.description": "Ciepła paleta z korzennymi tonami i bursztynowymi akcentami.",
  "admin.skins.catalog.crimson-silk.name": "Karmazynowy Jedwab",
  "admin.skins.catalog.crimson-silk.description": "Zmysłowe głębokie czerwienie z jedwabistymi kontrastami.",
  "admin.skins.catalog.amber-kiss.name": "Bursztynowy Pocałunek",
  "admin.skins.catalog.amber-kiss.description": "Miodowe, przytulne kolory z ciepłymi akcentami.",
  "admin.skins.catalog.velvet-plum.name": "Aksamitna Śliwka",
  "admin.skins.catalog.velvet-plum.description": "Głębokie fiolety i bogate śliwkowe tony.",
  "admin.skins.catalog.rose-whisper.name": "Szept Róży",
  "admin.skins.catalog.rose-whisper.description": "Subtelne różowe i beżowe tony dla delikatnego wyglądu.",
  "admin.skins.catalog.midnight-bloom.name": "Nocny Kwiat",
  "admin.skins.catalog.midnight-bloom.description": "Kwiatowa paleta nocna z nastrojowymi kontrastami.",
  "admin.skins.catalog.moonlit-amber.name": "Księżycowy Bursztyn",
  "admin.skins.catalog.moonlit-amber.description": "Ciepłe księżycowe tony z bursztynowymi akcentami.",
  "admin.skins.catalog.silk-noir.name": "Jedwabny Noir",
  "admin.skins.catalog.silk-noir.description": "Elegancka czerń z wyrafinowanymi, kontrastowymi akcentami.",
  "admin.skins.catalog.cocoa-mist.name": "Kakaowa Mgła",
  "admin.skins.catalog.cocoa-mist.description": "Ciepłe brązy i kremy inspirowane czekoladą.",
  "admin.skins.catalog.opal-dusk.name": "Opalowy Zmierzch",
  "admin.skins.catalog.opal-dusk.description": "Migoczące, chłodne zmierzchowe tony z opalizującymi akcentami.",
  "admin.skins.catalog.desert-rose.name": "Pustynna Róża",
  "admin.skins.catalog.desert-rose.description": "Ziemiste, ciepłe tony inspirowane pustynią.",
  "admin.skins.catalog.moonshadow.name": "Cień Księżyca",
  "admin.skins.catalog.moonshadow.description": "Chłodne, delikatne cieniste odcienie dla spokojnego interfejsu.",
  "admin.skins.catalog.rosewood.name": "Palisander",
  "admin.skins.catalog.rosewood.description": "Leśne, ciepłe odcienie inspirowane naturalnym drewnem.",
  "admin.skins.catalog.silken-azure.name": "Jedwabny Lazur",
  "admin.skins.catalog.silken-azure.description": "Delikatne lazurowe i błękitne tony z lekkim klimatem.",
  "admin.skins.catalog.nocturne.name": "Nokturn",
  "admin.skins.catalog.nocturne.description": "Muzyczna, nastrojowa nocna paleta z głębokimi kontrastami.",
  "admin.skins.catalog.lavender-haze.name": "Lawendowa Mgiełka",
  "admin.skins.catalog.lavender-haze.description": "Delikatne lawendowe pastele z łagodną atmosferą.",
  "admin.skins.catalog.seduction.name": "Uwodzenie",
  "admin.skins.catalog.seduction.description": "Intensywna, zmysłowa paleta z wyrazistymi akcentami.",
  "admin.skins.catalog.coral-veil.name": "Koralowa Zasłona",
  "admin.skins.catalog.coral-veil.description": "Delikatne koralowe i różowe tony z ciepłem.",
  "admin.skins.catalog.garnet.name": "Granat",
  "admin.skins.catalog.garnet.description": "Bogate, klejnotowe tony czerwieni dla dramatycznego efektu.",
  "admin.skins.catalog.opaline.name": "Opalina",
  "admin.skins.catalog.opaline.description": "Perłowe, półprzezroczyste delikatne odcienie.",
  "admin.skins.catalog.silhouette.name": "Sylwetka",
  "admin.skins.catalog.silhouette.description": "Minimalistyczna, kontrastowa monochromatyczna stylizacja.",
  "admin.skins.catalog.honeyed.name": "Miodowy",
  "admin.skins.catalog.honeyed.description": "Słodkie, ciepłe pastele z przytulnymi akcentami.",
  "admin.skins.catalog.eclipse.name": "Zaćmienie",
  "admin.skins.catalog.eclipse.description": "Głębokie, kontrastowe tony przypominające zaćmienie.",
  "admin.skins.catalog.amber-night.name": "Bursztynowa Noc",
  "admin.skins.catalog.amber-night.description": "Ciepłe nocne światła i bursztynowe blaski.",
  "admin.skins.catalog.pearl-veil.name": "Perłowa Zasłona",
  "admin.skins.catalog.pearl-veil.description": "Subtelne perłowe akcenty i delikatne błękity.",
  "admin.skins.catalog.scarlet-lace.name": "Szkarłatna Koronka",
  "admin.skins.catalog.scarlet-lace.description": "Koronkowe szkarłatne czerwienie z wyrafinowanym kontrastem.",
  "admin.skins.catalog.velour.name": "Welur",
  "admin.skins.catalog.velour.description": "Miękkie, otulające kolory o pluszowych tonach.",
  "admin.skins.catalog.silk-rose.name": "Jedwabna Róża",
  "admin.skins.catalog.silk-rose.description": "Delikatne, różane odcienie inspirowane płatkami.",
  "admin.skins.catalog.twilight-silk.name": "Zmierzchowy Jedwab",
  "admin.skins.catalog.twilight-silk.description": "Nocne jedwabiste tony z akcentami zmierzchu.",

  // adminDashboard
  "adminDashboard.userManagement": "Zarządzanie użytkownikami",
  "adminDashboard.userManagementDesc": "Zarządzaj użytkownikami, twórz nowe konta, blokuj/odblokowuj",
  "adminDashboard.passwordRequirements": "Wymagania hasła",
  "adminDashboard.passwordRequirementsDesc": "Konfiguruj polityki haseł i wymagania bezpieczeństwa",
  "adminDashboard.adminSettings": "Ustawienia administracyjne",
  "adminDashboard.adminSettingsDesc": "Zmień hasło admina i inne ustawienia",
  "adminDashboard.scoringPresets": "Presety oceniania",
  "adminDashboard.scoringPresetsDesc": "Edytuj presety oceniania karaoke używane przez harnes parytetowy i ocenianie na żywo",
  "adminDashboard.skins": "Skórki",
  "adminDashboard.skinsDesc": "Zarządzaj dostępnymi skórkami UI w selektorze motywów",

  // adminPasswordReqs
  "adminPasswordReqs.loading": "Ładowanie wymagań hasła...",
  "adminPasswordReqs.errorLoad": "Nie udało się załadować wymagań hasła",
  "adminPasswordReqs.errorSave": "Nie udało się zapisać wymagań hasła",
  "adminPasswordReqs.successSaved": "Wymagania hasła zaktualizowane pomyślnie!",
  "adminPasswordReqs.colId": "ID",
  "adminPasswordReqs.colActive": "Aktywne",
  "adminPasswordReqs.colDescription": "Opis",
  "adminPasswordReqs.colMin": "Min",
  "adminPasswordReqs.colMax": "Maks",
  "adminPasswordReqs.colUpper": "Wielkie",
  "adminPasswordReqs.colLower": "Małe",
  "adminPasswordReqs.colDigit": "Cyfra",
  "adminPasswordReqs.colSpecial": "Specjalne",
  "adminPasswordReqs.noData": "Nie znaleziono wymagań hasła",
  "adminPasswordReqs.saving": "Zapisywanie...",
  "adminPasswordReqs.saveChanges": "Zapisz zmiany",

  // adminSettings
  "adminSettings.changePassword": "Zmień hasło",
  "adminSettings.currentPassword": "Obecne hasło",
  "adminSettings.newPassword": "Nowe hasło",
  "adminSettings.confirmPassword": "Potwierdź hasło",
  "adminSettings.placeholderCurrentPassword": "Wpisz obecne hasło",
  "adminSettings.placeholderNewPassword": "Wpisz nowe hasło",
  "adminSettings.placeholderConfirmPassword": "Potwierdź nowe hasło",
  "adminSettings.changePasswordBtn": "Zmień hasło",
  "adminSettings.changing": "Zmiana...",
  "adminSettings.errorPasswordsMismatch": "Hasła nie pasują do siebie",
  "adminSettings.errorPasswordTooShort": "Nowe hasło musi mieć co najmniej 6 znaków",
  "adminSettings.successPasswordChanged": "Hasło zmienione pomyślnie!",
  "adminSettings.errorChangeFailed": "Nie udało się zmienić hasła",

  // attractionPicker
  "attractionPicker.typeToSearch": "Wpisz, aby wyszukać piosenki...",
  "attractionPicker.searching": "Wyszukiwanie...",
  "attractionPicker.add": "+ Dodaj",
  "attractionPicker.noVideoGames": "Nie znaleziono gier wideo",
  "attractionPicker.noBoardGames": "Nie znaleziono gier planszowych",
  "attractionPicker.cancel": "Anuluj",

  // audioProjectForm
  "audioProjectForm.placeholderName": "Nazwa projektu",
  "audioProjectForm.cancel": "Anuluj",

  // auditLog
  "auditLog.timestamp": "Znacznik czasu",

  // changePassword
  "changePassword.captchaLoadError": "Błąd ładowania CAPTCHA",
  "changePassword.captchaInvalid": "Nieprawidłowa odpowiedź CAPTCHA",
  "changePassword.captchaValidationError": "Błąd walidacji CAPTCHA",

  // characterEditor
  "characterEditor.jsonSection": "JSON",
  "characterEditor.applyJson": "Załaduj z JSON",
  "characterEditor.copyToClipboard": "Kopiuj do schowka",
  "characterEditor.invalidJson": "Nieprawidłowy JSON",
  "characterEditor.preview": "Podgląd",
  "characterEditor.namePlaceholder": "np. Juror #1",
  "characterEditor.name": "Nazwa",

  // collaborators
  "collaborators.searchPlaceholder": "Szukaj użytkowników (min. 3 znaki)",
  "collaborators.search": "Szukaj",
  "collaborators.addWrite": "Dodaj (zapis)",
  "collaborators.noPermission": "Brak uprawnień",

  // datePresets
  "datePresets.label": "Presety",
  "datePresets.thisWeekend": "Ten weekend",
  "datePresets.nextWeek": "Następny tydzień",
  "datePresets.next7Days": "Następne 7 dni",

  // dmxProjects
  "dmxProjects.subtitle": "Wybierz projekt DMX przed otwarciem edytora.",
  "dmxProjects.createNew": "Utwórz nowy",
  "dmxProjects.noApiYet": "API listy projektów nie jest jeszcze dostępne. Otwórz Edytor DMX, aby rozpocząć nową konfigurację.",

  // editor
  "editor.sectionNameRequired": "Nazwa sekcji nie może być pusta",
  "editor.orderMustBeNumber": "Kolejność musi być liczbą",
  "editor.sectionSaved": "Sekcja zapisana",
  "editor.selectLayerToRecord": "Wybierz warstwę do nagrywania.",
  "editor.selectLayerBeforeRecording": "Wybierz warstwę przed nagrywaniem",
  "editor.presetSaved": "Preset \"{{name}}\" zapisany",
  "editor.eqPresets.flat": "Płaski",
  "editor.eqPresets.bassBoost": "Wzmocnienie basów",
  "editor.eqPresets.vocalPresence": "Obecność wokalu",
  "editor.eqPresets.bright": "Jasny",
  "editor.eqPresets.deEsser": "De-Esser",
  "editor.project": "Projekt",
  "editor.projectName": "Nazwa",
  "editor.isTemplate": "Jest szablonem",
  "editor.volume": "Głośność",
  "editor.volumePlaceholder": "np. 0.8",
  "editor.saveProjectPut": "Zapisz projekt (PUT)",
  "editor.section": "Sekcja",
  "editor.sectionName": "Nazwa",
  "editor.sectionOrder": "Kolejność",
  "editor.saveSectionPut": "Zapisz sekcję (PUT)",
  "editor.themeLight": "☀️ Jasny",
  "editor.themeDark": "🌙 Ciemny",
  "editor.switchToLight": "Przełącz na jasny motyw",
  "editor.switchToDark": "Przełącz na ciemny motyw",
  "editor.shortcutUndo": "Cofnij",
  "editor.shortcutRedo": "Ponów",
  "editor.shortcutSave": "Zapisz projekt",
  "editor.shortcutPlayPause": "Odtwarzaj/Pauza",
  "editor.shortcutHelp": "Pokaż/ukryj tę pomoc",
  "editor.showEditorTutorial": "Pokaż samouczek edytora",
  "editor.selectLayerToEdit": "Wybierz warstwę do edycji",
  "editor.addClipToLayer": "Dodaj nowy klip do warstwy",
  "editor.deleteLayerFromProject": "Usuń warstwę z projektu",
  "editor.solo": "Solo",
  "editor.soloTitle": "Solo: wycisz wszystkie inne warstwy",
  "editor.mute": "Wycisz",
  "editor.muteTitle": "Wycisz: wycisz tę warstwę",
  "editor.vol": "Gł.",
  "editor.volumeLayerTitle": "Głośność warstwy",
  "editor.pan": "Pan",
  "editor.panTitle": "Pan (lewo/prawo)",
  "editor.track": "Ścieżka",
  "editor.trackTypeTitle": "Typ ścieżki: audio lub MIDI",
  "editor.trackAudio": "Audio",
  "editor.trackMidi": "MIDI",
  "editor.instrument": "Instrument",
  "editor.instrumentTitle": "Instrument MIDI dla tej warstwy",
  "editor.instrumentSine": "Sinusoida",
  "editor.instrumentSquare": "Prostokątna",
  "editor.instrumentSaw": "Piłokształtna",
  "editor.instrumentTriangle": "Trójkątna",
  "editor.color": "Kolor",
  "editor.colorTitle": "Kolor ścieżki",
  "editor.lock": "Blokada",
  "editor.lockTitle": "Zablokuj warstwę przed edycją",
  "editor.group": "Grupa",
  "editor.groupTitle": "Grupa warstwy (np. A/B/1)",
  "editor.groupPlaceholder": "A/B/1",
  "editor.mutedViaSoloMute": "Wyciszono przez Solo/Mute",
  "editor.lockedDragDisabled": "Zablokowano (przeciąganie wyłączone)",
  "editor.fxChain": "Łańcuch FX:",
  "editor.bypassed": "Ominięty",
  "editor.active": "Aktywny",
  "editor.remove": "Usuń",
  "editor.addEQ3": "+ EQ3",
  "editor.addComp": "+ Kompresor",
  "editor.addDelay": "+ Delay",
  "editor.addReverb": "+ Reverb",
  "editor.addDistortion": "+ Distortion",
  "editor.addEffectTitle": "Dodaj efekt {{effect}} do tej warstwy",
  "editor.advancedEditing": "Zaawansowana edycja",
  "editor.clipsSelected": "{{count}} klip(ów) zaznaczono",
  "editor.noClipsSelected": "Brak zaznaczonych klipów",
  "editor.clearSelection": "Wyczyść zaznaczenie",
  "editor.rippleMode": "Tryb ripple",
  "editor.quantize": "⚡ Kwantyzuj",
  "editor.quantizeTitle": "Kwantyzuj: wyrównaj zaznaczone klipy do siatki (Q)",
  "editor.deleteSelected": "🗑️ Usuń zaznaczone",
  "editor.timeStretch": "Rozciągnięcie czasu:",
  "editor.advancedTip": "💡 Wskazówka: Ctrl+klik aby zaznaczyć wiele klipów | Del aby usunąć | Q aby kwantyzować",
  "editor.selectedClip": "Zaznaczony klip",
  "editor.noSelectedClip": "Nie zaznaczono klipu",
  "editor.splitAtPlayhead": "Podziel (w miejscu kursora)",
  "editor.cutDelete": "Wytnij/Usuń",
  "editor.pasteToActiveLayer": "Wklej → aktywna warstwa",
  "editor.reverse": "Odwróć",
  "editor.fadeIn": "Fade In",
  "editor.fadeOut": "Fade Out",
  "editor.ccLane": "Ścieżka CC:",
  "editor.resizeSidebar": "Przeciągnij, aby zmienić rozmiar paska bocznego",
  "editor.newProject": "Nowy projekt",
  "editor.projectNamePlaceholder": "Nazwa projektu",
  "editor.addClip": "+ Klip",
  "editor.deleteSelectedTitle": "Usuń zaznaczone klipy",
  "editor.transportTooltip": "Transport: Odtwarzaj, Stop, Pętla, Nagrywaj, nawigacja osi czasu",
  "editor.minimapTooltip": "Mini-mapa projektu (podgląd osi czasu)",
  "editor.timelineTooltip": "Oś czasu: przeciągaj klipy, edytuj, zmieniaj rozmiar, używaj siatki i zoomu",
  "editor.halfSpeed": "Połowa prędkości",
  "editor.75speed": "75% prędkości",
  "editor.normalSpeed": "Normalna prędkość",
  "editor.150speed": "150% prędkości",
  "editor.doubleSpeed": "Podwójna prędkość",
  "editor.songLoaded": "Piosenka załadowana",
  "editor.songLoadFailed": "Nie udało się załadować piosenki",
  "editor.restoreBackup": "Przywróć kopię zapasową",
  "editor.saveFullBackup": "Zapisz pełną kopię zapasową",
  "editor.browseSongs": "Przeglądaj piosenki",
  "editor.songBrowserTitle": "Wybierz piosenkę",
  "editor.songBrowserSearch": "Szukaj po tytule lub artyście...",
  "editor.songBrowserLoad": "Załaduj",
  "editor.songBrowserClose": "Zamknij",
  "editor.songBrowserEmpty": "Nie znaleziono piosenek",
  "editor.youtubePreview": "Podgląd YouTube",
  "editor.youtubeNotFound": "Nie znaleziono filmu YouTube",
  "editor.editInEditor": "Edytuj",

  // gameSettings
  "gameSettings.modes.classic": "Klasyczny",
  "gameSettings.modes.blind": "Na ślepo",
  "gameSettings.modes.elimination": "Eliminacja",
  "gameSettings.modes.relay": "Sztafeta",
  "gameSettings.modes.freestyle": "Dowolny",

  // honeyTokenDashboard
  "honeyTokenDashboard.loading": "Ładowanie...",
  "honeyTokenDashboard.errorFetch": "Nie udało się pobrać honeytokenów",

  // honeyTokens
  "honeyTokens.tokenTriggered": "Token #{{id}} wyzwolony o {{time}}",

  // karaoke
  "karaoke.gameModes.normal": "Normalny",
  "karaoke.gameModes.demo": "Demo (12s)",
  "karaoke.gameModes.pad": "Pad / Gamepad",
  "karaoke.difficulties.easy": "Łatwy",
  "karaoke.difficulties.normal": "Normalny",
  "karaoke.difficulties.hard": "Trudny",
  "karaoke.padModeActivate": "Tryb Pad — Aktywuj dźwięk",
  "karaoke.padModeDescription": "Trafiaj nuty klawiszami lub gamepadem!\nWyższy poziom trudności = więcej klawiszy.",
  "karaoke.browserAudioRequired": "Przeglądarka wymaga kliknięcia, aby odblokować\nmikrofon i odtwarzanie dźwięku.",
  "karaoke.clickToStart": "🎶 Kliknij, aby rozpocząć",
  "karaoke.ytSearching": "🔍 Wyszukiwanie YouTube...",
  "karaoke.ytFound": "✅ Znaleziono: {{id}}",
  "karaoke.ytNotFound": "❌ Nie znaleziono na YouTube",
  "karaoke.ytSearchError": "❌ Błąd wyszukiwania",
  "karaoke.ytNoData": "⚠️ Brak danych artysty/tytułu do wyszukania",
  "karaoke.sorting": "Sortowanie:",

  // karaokeEditor
  "karaokeEditor.editHint": "Przeciągnij krawędzie sylab, aby dostosować czas; przytrzymaj Shift, aby przyciągać do siatki rytmu.",

  // karaokeManager
  "karaokeManager.playerN": "Gracz {{id}}",
  "karaokeManager.player": "Gracz",
  "karaokeManager.score": "Wynik",

  // karaokeProjects
  "karaokeProjects.subtitle": "Wybierz istniejący plik karaoke lub utwórz nowy.",
  "karaokeProjects.createNew": "Utwórz nowy",
  "karaokeProjects.empty": "Nie znaleziono plików karaoke.",

  // libraryExplorer
  "libraryExplorer.noFiles": "Brak plików.",
  "libraryExplorer.colFile": "Plik",
  "libraryExplorer.colType": "Typ",
  "libraryExplorer.colActions": "Akcje",

  // myAuditLogs
  "myAuditLogs.loading": "Ładowanie...",
  "myAuditLogs.errorFetch": "Nie udało się pobrać logów audytu.",

  // nav
  "nav.signUp": "Zarejestruj się",
  "nav.externalRadio": "Radio online",
  "nav.wishlists": "Listy życzeń",
  "nav.gifts": "Rejestr prezentów",
  "nav.youtubeSubs": "Subskrypcje YouTube",

  // pagination
  "pagination.pageSize": "Rozmiar strony",

  // party.round
  "party.round.winner": "Zwycięzca:",
  "party.round.manageAssignments": "Zarządzaj przypisaniami",
  "party.round.manageParts": "Zarządzaj częściami",
  "party.round.start": "Start",
  "party.round.addRound": "Dodaj rundę",
  "party.round.joinRound": "Dołącz do rundy",
  "party.round.joinAndPlay": "Dołącz i graj",
  "party.round.assignments": "Przypisania",
  "party.round.noAssignments": "Kliknij gracza, aby przypisać",
  "party.round.autoAssign": "Przypisz automatycznie",
  "party.round.microphones": "Mikrofony",
  "party.round.noMicsDetected": "Nie wykryto mikrofonów",
  "party.round.gamepads": "Gamepady",
  "party.round.players": "Gracze",
  "party.round.selectSong": "Wybierz piosenkę",
  "party.round.loadingSongs": "Ładowanie piosenek...",
  "party.round.noSongs": "Brak piosenek",
  "party.round.sessionOptional": "Sesja (opcjonalnie)",
  "party.round.newSessionName": "Nazwa nowej sesji",
  "party.round.createSession": "Utwórz sesję",
  "party.round.selectedSession": "Wybrana sesja #{{id}}",
  "party.round.noSession": "Nie wybrano sesji",
  "party.round.coverAlt": "okładka",
  "party.round.songFallback": "Piosenka #{{id}}",
  "party.round.score": "{{score}} pkt",

  // party.roundPlayers
  "party.roundPlayers.title": "Przypisania rundy #{{id}}",
  "party.roundPlayers.waiting": "Oczekujące",
  "party.roundPlayers.approved": "Zatwierdzone",
  "party.roundPlayers.approve": "Zatwierdź",
  "party.roundPlayers.approveSelected": "Zatwierdź zaznaczone",
  "party.roundPlayers.noWaiting": "Brak oczekujących",
  "party.roundPlayers.noApproved": "Brak zatwierdzonych",
  "party.roundPlayers.addAssignment": "Dodaj przypisanie",
  "party.roundPlayers.selectPlayer": "Wybierz z graczy...",
  "party.roundPlayers.orTypePlayerId": "lub wpisz playerId",
  "party.roundPlayers.slotOptional": "slot (opcjonalnie)",
  "party.roundPlayers.editSlot": "Edytuj slot",
  "party.roundPlayers.slotNumber": "Numer slotu do zatwierdzenia",
  "party.roundPlayers.selectPlayerOrId": "Wybierz gracza lub podaj playerId",
  "party.roundPlayers.addError": "Błąd dodawania przypisania",
  "party.roundPlayers.selectToApprove": "Zaznacz wpisy do zatwierdzenia",
  "party.roundPlayers.provideSlotNumber": "Podaj numer slotu",
  "party.roundPlayers.approveError": "Błąd zatwierdzania",
  "party.roundPlayers.removeConfirm": "Usunąć przypisanie?",
  "party.roundPlayers.removeError": "Błąd usuwania",
  "party.roundPlayers.slotPlaceholder": "slot do zatwierdzania...",
  "party.roundPlayers.slotUpdateError": "Błąd aktualizacji slotu",
  "party.roundPlayers.slotPrompt": "Numer slotu do zatwierdzenia (liczba):",

  // party.parts
  "party.parts.title": "Części rundy #{{id}}",
  "party.parts.noParts": "Brak części dla tej rundy.",
  "party.parts.existing": "Istniejące części:",
  "party.parts.sortNumber": "Numer",
  "party.parts.sortPlayer": "Gracz",
  "party.parts.partNumber": "Część #{{number}}",
  "party.parts.reserve": "Rezerwuj",
  "party.parts.addNew": "Dodaj nową część",
  "party.parts.partNumberLabel": "Numer części",
  "party.parts.playerIdOptional": "PlayerId (opcjonalnie)",
  "party.parts.addPart": "Dodaj część",
  "party.parts.removeConfirm": "Usunąć przypisanie dla tej części?",

  // party.permissions
  "party.permissions.bulkAction": "Akcja zbiorcza",
  "party.permissions.working": "Przetwarzanie...",
  "party.permissions.grantSelected": "Nadaj zaznaczonym",
  "party.permissions.revokeSelected": "Odbierz zaznaczonym",
  "party.permissions.granted": "Uprawnienie nadane",
  "party.permissions.grantFailed": "Nadanie nie powiodło się",
  "party.permissions.revoked": "Uprawnienie odebrane",
  "party.permissions.revokeFailed": "Odebranie nie powiodło się",
  "party.permissions.noPlayersSelected": "Nie wybrano graczy",
  "party.permissions.bulkGrantDone": "Zbiorcze nadanie zakończone",
  "party.permissions.bulkRevokeDone": "Zbiorcze odebranie zakończone",
  "party.permissions.bulkFailed": "Operacja zbiorcza nie powiodła się",
  "party.permissions.history": "Historia uprawnień",
  "party.permissions.loadingHistory": "Ładowanie historii...",
  "party.permissions.total": "Łącznie: {{count}}",
  "party.permissions.when": "Kiedy",
  "party.permissions.user": "Użytkownik",
  "party.permissions.action": "Akcja",
  "party.permissions.details": "Szczegóły",
  "party.permissions.pageSize": "Rozmiar strony",
  "party.permissions.requiresOrganizer": "Wymaga organizatora/moderatora",
  "party.permissions.updated": "Zaktualizowano",
  "party.permissions.updateFailed": "Aktualizacja nie powiodła się",
  "party.permissions.player": "Gracz",

  // party.addAttraction
  "party.addAttraction": "Dodaj atrakcję",

  // partyForm
  "partyForm.partyName": "Nazwa imprezy",
  "partyForm.placeholderPartyName": "Wpisz nazwę imprezy",
  "partyForm.placeholderDescription": "Wpisz opis",
  "partyForm.organizerId": "ID organizatora",
  "partyForm.placeholderOrganizerId": "Wpisz ID organizatora",
  "partyForm.allFieldsRequired": "Wszystkie pola są wymagane!",
  "partyForm.createdSuccess": "Impreza utworzona pomyślnie!",

  // passwordRules
  "passwordRules.maxLength": "Maks. {{count}} znaków",

  // playlistList
  "playlistList.itemCount": "{{count}} piosenek",

  // playlistManager
  "playlistManager.disconnect": "Rozłącz",
  "playlistManager.connectDesc": "Połącz konto, aby importować playlisty",
  "playlistManager.connectBtn": "Połącz konto",
  "playlistManager.loadPlaylists": "Załaduj playlisty",
  "playlistManager.loadingPlaylists": "Ładowanie playlist...",
  "playlistManager.noExternalPlaylists": "Nie znaleziono zewnętrznych playlist",
  "playlistManager.playlistsFound": "znalezionych playlist",
  "playlistManager.importSelected": "Importuj zaznaczone",
  "playlistManager.importAll": "Importuj wszystkie",
  "playlistManager.tracks": "utworów",
  "playlistManager.selected": "zaznaczono",
  "playlistManager.filterTracks": "Filtruj utwory...",
  "playlistManager.colTitle": "Tytuł",
  "playlistManager.colArtist": "Artysta",
  "playlistManager.colAlbum": "Album",
  "playlistManager.colDuration": "Czas trwania",
  "playlistManager.colYear": "Rok",
  "playlistManager.emptyPlaylist": "Ta playlista jest pusta",
  "playlistManager.noMatchingTracks": "Brak pasujących utworów",
  "playlistManager.assignTag": "Przypisz tag",
  "playlistManager.moreActions": "Więcej akcji",
  "playlistManager.selectPlaylist": "Wybierz playlistę...",
  "playlistManager.selectPlaylistPrompt": "Wybierz playlistę, aby zobaczyć jej utwory",
  "playlistManager.copyToOther": "Kopiuj do drugiego panelu",
  "playlistManager.moveToOther": "Przenieś do drugiego panelu",
  "playlistManager.copy": "Kopiuj",
  "playlistManager.move": "Przenieś",
  "playlistManager.paste": "Wklej",
  "playlistManager.search": "Szukaj",
  "playlistManager.searchPlaceholder": "Szukaj utworów we wszystkich źródłach...",
  "playlistManager.selectAll": "Zaznacz wszystkie",
  "playlistManager.results": "wyników",
  "playlistManager.addSelected": "Dodaj zaznaczone",
  "playlistManager.preview": "Podgląd",
  "playlistManager.searching": "Wyszukiwanie",
  "playlistManager.noResults": "Brak wyników",
  "playlistManager.tagManager": "Menedżer tagów",
  "playlistManager.newTag": "Nowy tag",
  "playlistManager.tagName": "Nazwa tagu",
  "playlistManager.color": "Kolor",
  "playlistManager.icon": "Ikona",
  "playlistManager.editTag": "Edytuj tag",
  "playlistManager.deleteTag": "Usuń tag",
  "playlistManager.confirmDelete": "Kliknij ponownie, aby potwierdzić",
  "playlistManager.bulkTagHint": "{{count}} utworów zaznaczono — przełącz tagi poniżej",
  "playlistManager.noTags": "Brak tagów. Utwórz tag, aby rozpocząć!",
  "playlistManager.playlists": "playlisty",
  "playlistManager.emptyState": "Brak playlist. Utwórz playlistę, aby rozpocząć!",
  "playlistManager.duplicate": "Duplikuj",
  "playlistManager.delete": "Usuń",
  "playlistManager.viewList": "Widok listy",
  "playlistManager.viewGrid": "Widok siatki",
  "playlistManager.viewCompact": "Widok kompaktowy",
  "playlistManager.viewDual": "Podwójny panel (Norton Commander)",
  "playlistManager.export": "Eksportuj",
  "playlistManager.import": "Importuj",
  "playlistManager.exportAll": "Eksportuj wszystkie",
  "playlistManager.exportSelected": "Eksportuj zaznaczone",
  "playlistManager.importSuccess": "Playlisty zaimportowane pomyślnie!",
  "playlistManager.exportSuccess": "Playlisty wyeksportowane pomyślnie!",
  "playlistManager.confirmOverwrite": "Ten import może nadpisać istniejące playlisty. Kontynuować?",
  "playlistManager.importOptions": "Opcje importu",
  "playlistManager.mergeTags": "Scal tagi",
  "playlistManager.mergeFolders": "Scal foldery",
  "playlistManager.overwriteExisting": "Nadpisz istniejące",

  // scoringPresets
  "scoringPresets.loading": "Ładowanie...",
  "scoringPresets.save": "Zapisz",
  "scoringPresets.resetDefaults": "Przywróć domyślne",
  "scoringPresets.colDifficulty": "Trudność",

  // securityDashboard
  "securityDashboard.loading": "Ładowanie analityki...",
  "securityDashboard.auditEventsTrend": "Trend zdarzeń audytu",
  "securityDashboard.honeytokensTrend": "Trend wyzwolonych honeytokenów",
  "securityDashboard.comingSoon": "Więcej metryk i analityki bezpieczeństwa wkrótce...",

  // songFilter
  "songFilter.header": "Filtruj piosenki",
  "songFilter.labelTitle": "Tytuł",
  "songFilter.labelArtist": "Artysta",
  "songFilter.placeholderTitle": "Wpisz tytuł",
  "songFilter.placeholderArtist": "Wpisz artystę",
  "songFilter.search": "Szukaj",

  // userInfo
  "userInfo.welcome": "Witaj, {{username}}"
};

/* ── main ─────────────────────────────────────────────────────── */

const enPaths = getLeafPaths(en);
const plPaths = new Set(getLeafPaths(pl));
const missing = enPaths.filter(p => !plPaths.has(p));

let added = 0;
const noTranslation = [];

for (const key of missing) {
  if (key in translations) {
    setByPath(pl, key, translations[key]);
    added++;
  } else {
    // Fall back to English value so we don't lose keys
    const enVal = getByPath(en, key);
    setByPath(pl, key, enVal);
    added++;
    noTranslation.push(key);
  }
}

fs.writeFileSync(plPath, JSON.stringify(pl, null, 2) + '\n', 'utf-8');

// Validate
try {
  JSON.parse(fs.readFileSync(plPath, 'utf-8'));
  console.log('✅ pl.json parses clean.');
} catch (e) {
  console.error('❌ pl.json parse error:', e.message);
}

console.log(`\nTotal missing keys: ${missing.length}`);
console.log(`Keys added with PL translation: ${added - noTranslation.length}`);
console.log(`Keys added with EN fallback: ${noTranslation.length}`);
console.log(`Total keys added: ${added}`);

if (noTranslation.length > 0) {
  console.log('\n⚠️  Keys that used English fallback (no Polish translation in map):');
  for (const k of noTranslation) {
    console.log(`  - ${k}`);
  }
}
