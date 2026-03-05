// generate-pl-translations.cjs — Generate Polish translations for all missing sections
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const pl = JSON.parse(fs.readFileSync(path.join(localesDir, 'pl.json'), 'utf8'));

// Polish translation dictionary for common English words/phrases
const dict = {
    // Actions
    'Save': 'Zapisz', 'Cancel': 'Anuluj', 'Close': 'Zamknij', 'Delete': 'Usuń',
    'Edit': 'Edytuj', 'Add': 'Dodaj', 'Create': 'Utwórz', 'Update': 'Aktualizuj',
    'Remove': 'Usuń', 'Search': 'Szukaj', 'Filter': 'Filtruj', 'Sort': 'Sortuj',
    'Reset': 'Resetuj', 'Refresh': 'Odśwież', 'Submit': 'Wyślij', 'Apply': 'Zastosuj',
    'Confirm': 'Potwierdź', 'Copy': 'Kopiuj', 'Paste': 'Wklej', 'Undo': 'Cofnij',
    'Redo': 'Ponów', 'Import': 'Importuj', 'Export': 'Eksportuj', 'Download': 'Pobierz',
    'Upload': 'Prześlij', 'Select': 'Wybierz', 'Deselect': 'Odznacz',
    'Enable': 'Włącz', 'Disable': 'Wyłącz', 'Start': 'Rozpocznij', 'Stop': 'Zatrzymaj',
    'Pause': 'Pauza', 'Resume': 'Wznów', 'Play': 'Odtwórz', 'Record': 'Nagrywaj',
    'Back': 'Wróć', 'Next': 'Dalej', 'Previous': 'Poprzedni', 'Skip': 'Pomiń',
    'Retry': 'Ponów próbę', 'Continue': 'Kontynuuj', 'Finish': 'Zakończ',
    'Generate': 'Generuj', 'Preview': 'Podgląd', 'Send': 'Wyślij', 'Load': 'Załaduj',
    'Clear': 'Wyczyść', 'Browse': 'Przeglądaj', 'Open': 'Otwórz', 'View': 'Widok',
    'Rename': 'Zmień nazwę', 'Move': 'Przenieś', 'Duplicate': 'Duplikuj',
    
    // Status
    'Loading...': 'Ładowanie...', 'Loading': 'Ładowanie', 'Saving...': 'Zapisywanie...',
    'Error': 'Błąd', 'Success': 'Sukces', 'Warning': 'Ostrzeżenie',
    'Enabled': 'Włączone', 'Disabled': 'Wyłączone', 'Active': 'Aktywne',
    'Inactive': 'Nieaktywne', 'Pending': 'Oczekujące', 'Completed': 'Zakończone',
    'Yes': 'Tak', 'No': 'Nie', 'None': 'Brak', 'All': 'Wszystko',
    'true': 'tak', 'false': 'nie',
    'OK': 'OK', 'N/A': 'Nie dotyczy',
    
    // Common labels
    'Title': 'Tytuł', 'Name': 'Nazwa', 'Description': 'Opis',
    'Date': 'Data', 'Time': 'Czas', 'Duration': 'Czas trwania',
    'Type': 'Typ', 'Status': 'Status', 'Category': 'Kategoria',
    'Tags': 'Tagi', 'Notes': 'Notatki', 'Comments': 'Komentarze',
    'Details': 'Szczegóły', 'Summary': 'Podsumowanie', 'Overview': 'Przegląd',
    'Settings': 'Ustawienia', 'Options': 'Opcje', 'Preferences': 'Preferencje',
    'General': 'Ogólne', 'Advanced': 'Zaawansowane', 'Basic': 'Podstawowe',
    'Actions': 'Akcje', 'Properties': 'Właściwości',
    'User': 'Użytkownik', 'Users': 'Użytkownicy', 'Admin': 'Admin',
    'Profile': 'Profil', 'Account': 'Konto',
    'Password': 'Hasło', 'Email': 'E-mail', 'Username': 'Nazwa użytkownika',
    'Score': 'Wynik', 'Points': 'Punkty', 'Level': 'Poziom',
    'Volume': 'Głośność', 'Track': 'Ścieżka', 'Tracks': 'Ścieżki',
    'Song': 'Utwór', 'Songs': 'Utwory', 'Artist': 'Artysta', 'Album': 'Album',
    'Genre': 'Gatunek', 'Year': 'Rok', 'Language': 'Język',
    'Playlist': 'Playlista', 'Playlists': 'Playlisty',
    'Project': 'Projekt', 'Projects': 'Projekty',
    'File': 'Plik', 'Files': 'Pliki', 'Folder': 'Folder',
    'Layer': 'Warstwa', 'Layers': 'Warstwy',
    'Channel': 'Kanał', 'Channels': 'Kanały',
    'Clip': 'Klip', 'Clips': 'Klipy',
    'Source': 'Źródło', 'Sources': 'Źródła',
    'Input': 'Wejście', 'Output': 'Wyjście',
    'Color': 'Kolor', 'Size': 'Rozmiar', 'Position': 'Pozycja',
    'Width': 'Szerokość', 'Height': 'Wysokość',
    'Min': 'Min', 'Max': 'Maks', 'Default': 'Domyślne',
    'Total': 'Łącznie', 'Count': 'Liczba', 'Average': 'Średnia',
    'Mic': 'Mikrofon', 'Microphone': 'Mikrofon',
    'Camera': 'Kamera', 'Speaker': 'Głośnik',
    'Tempo': 'Tempo', 'Key': 'Tonacja', 'BPM': 'BPM',
    'Pitch': 'Wysokość dźwięku', 'Gain': 'Wzmocnienie',
    'Preset': 'Preset', 'Presets': 'Presety',
    'Template': 'Szablon', 'Templates': 'Szablony',
    'Mode': 'Tryb', 'Theme': 'Motyw', 'Skin': 'Skórka',
    'Light': 'Jasny', 'Dark': 'Ciemny',
    'Result': 'Wynik', 'Results': 'Wyniki',
    'Round': 'Runda', 'Rounds': 'Rundy',
    'Player': 'Gracz', 'Players': 'Gracze',
    'Game': 'Gra', 'Games': 'Gry',
    'Board': 'Plansza', 'Card': 'Karta',
    'Team': 'Drużyna', 'Teams': 'Drużyny',
    'Winner': 'Zwycięzca', 'Loser': 'Przegrany',
    'Rank': 'Ranga', 'Ranking': 'Ranking',
    'History': 'Historia', 'Log': 'Dziennik', 'Logs': 'Dzienniki',
    'Audit': 'Audyt', 'Security': 'Bezpieczeństwo',
    'Dashboard': 'Panel główny', 'Home': 'Strona główna',
    'Page': 'Strona', 'Section': 'Sekcja',
    'Table': 'Tabela', 'List': 'Lista', 'Grid': 'Siatka',
    'Form': 'Formularz', 'Field': 'Pole', 'Label': 'Etykieta',
    'Button': 'Przycisk', 'Link': 'Link', 'Menu': 'Menu',
    'Header': 'Nagłówek', 'Footer': 'Stopka', 'Sidebar': 'Panel boczny',
    'Notification': 'Powiadomienie', 'Notifications': 'Powiadomienia',
    'Alert': 'Alert', 'Message': 'Wiadomość', 'Messages': 'Wiadomości',
    'Help': 'Pomoc', 'About': 'O programie', 'Info': 'Info',
    'Wiki': 'Wiki', 'Documentation': 'Dokumentacja',
    'Features': 'Funkcje', 'Feature': 'Funkcja',
};

// Section-specific translations (manually crafted for key pages)
const plTranslations = {
    "musicPlayer": {
        "title": "Odtwarzacz",
        "sourcesFound": "Znalezione źródła dla utworów",
        "noSources": "brak"
    },
    "playlistBrowser": {
        "playlists": "Playlisty",
        "library": "Biblioteka",
        "selected": "Wybrane",
        "tracks": "utwory",
        "searchAndAdd": "Szukaj i dodaj do playlisty...",
        "fullSearch": "Pełne wyszukiwanie (Enter nie dodaje, pełna lista poniżej)"
    },
    "changePassword": {
        "title": "Zmień hasło",
        "currentPassword": "Obecne hasło",
        "newPassword": "Nowe hasło",
        "confirmPassword": "Potwierdź hasło",
        "minChars": "Minimum 12 znaków",
        "atLeastDigit": "Przynajmniej 1 cyfra",
        "atLeastUpper": "Przynajmniej 1 wielka litera",
        "atLeastLower": "Przynajmniej 1 mała litera",
        "atLeastSpecial": "Przynajmniej 1 znak specjalny",
        "submit": "Zmień hasło",
        "success": "Hasło zmienione pomyślnie",
        "error": "Nie udało się zmienić hasła"
    },
    "loginPage": {
        "title": "Logowanie",
        "username": "Nazwa użytkownika",
        "password": "Hasło",
        "loginButton": "Zaloguj się",
        "forgotPassword": "Zapomniałeś hasła?",
        "noAccount": "Nie masz konta?",
        "signUp": "Zarejestruj się"
    },
    "adminDashboard": {
        "title": "Panel administracyjny",
        "subtitle": "Zarządzanie systemem",
        "users": "Użytkownicy",
        "totalUsers": "Łączna liczba użytkowników",
        "activeUsers": "Aktywni użytkownicy",
        "newUsersToday": "Nowi użytkownicy dziś",
        "systemHealth": "Stan systemu",
        "recentActivity": "Ostatnia aktywność",
        "quickActions": "Szybkie akcje",
        "manageUsers": "Zarządzaj użytkownikami",
        "viewLogs": "Zobacz logi",
        "settings": "Ustawienia",
        "security": "Bezpieczeństwo"
    },
    "adminSettings": {
        "title": "Ustawienia administracyjne",
        "general": "Ogólne",
        "security": "Bezpieczeństwo",
        "notifications": "Powiadomienia",
        "save": "Zapisz ustawienia",
        "saved": "Ustawienia zapisane",
        "error": "Błąd zapisu ustawień"
    },
    "securityDashboard": {
        "title": "Panel bezpieczeństwa",
        "overview": "Przegląd",
        "threats": "Zagrożenia",
        "loginAttempts": "Próby logowania",
        "failedLogins": "Nieudane logowania",
        "activeTokens": "Aktywne tokeny",
        "honeyTokens": "HoneyTokeny",
        "auditLogs": "Logi audytu",
        "lastScan": "Ostatnie skanowanie",
        "status": "Status",
        "secure": "Bezpieczny",
        "warning": "Ostrzeżenie",
        "critical": "Krytyczny"
    },
    "scoringPresets": {
        "title": "Punktacja",
        "subtitle": "Zarządzanie presetami punktacji",
        "name": "Nazwa presetu",
        "description": "Opis",
        "create": "Utwórz preset",
        "edit": "Edytuj preset",
        "delete": "Usuń preset",
        "deleteConfirm": "Czy na pewno chcesz usunąć ten preset?",
        "saved": "Preset zapisany",
        "deleted": "Preset usunięty",
        "default": "Domyślny",
        "setDefault": "Ustaw jako domyślny",
        "pitchWeight": "Waga wysokości",
        "rhythmWeight": "Waga rytmu",
        "bonusNotes": "Bonusowe nuty",
        "goldenNotes": "Złote nuty",
        "freestyle": "Freestyle"
    },
    "featuresPage": {
        "title": "Funkcje BibaCafe",
        "subtitle": "Odkryj wszystkie możliwości naszej platformy",
        "karaoke": "Karaoke",
        "karaokeDesc": "Śpiewaj z przyjaciółmi, rywalizuj i zdobywaj punkty",
        "musicPlayer": "Odtwarzacz muzyki",
        "musicPlayerDesc": "Słuchaj muzyki z wielu źródeł w jednym miejscu",
        "games": "Gry",
        "gamesDesc": "Kolekcja gier planszowych i wideo do wspólnej zabawy",
        "editor": "Edytor audio",
        "editorDesc": "Profesjonalny edytor audio z wieloma ścieżkami",
        "social": "Społeczność",
        "socialDesc": "Organizuj imprezy i spotykaj się z przyjaciółmi",
        "customization": "Personalizacja",
        "customizationDesc": "Dostosuj wygląd i zachowanie aplikacji",
        "security": "Bezpieczeństwo",
        "securityDesc": "Zaawansowane zabezpieczenia i kontrola dostępu",
        "multiLanguage": "Wielojęzyczność",
        "multiLanguageDesc": "Interfejs dostępny w 7 językach"
    },
    "dancePage": {
        "title": "Taniec",
        "subtitle": "Taneczne wyzwania z rozpoznawaniem ruchów",
        "startDance": "Rozpocznij taniec",
        "selectSong": "Wybierz utwór",
        "poses": "Pozy",
        "score": "Wynik",
        "combo": "Combo",
        "perfect": "Idealnie!",
        "good": "Dobrze!",
        "miss": "Pudło!",
        "calibrate": "Kalibracja",
        "cameraRequired": "Wymagana kamera",
        "noCameraAccess": "Brak dostępu do kamery",
        "enableCamera": "Włącz kamerę, aby korzystać z funkcji tańca"
    },
    "miniGames": {
        "title": "Minigry",
        "subtitle": "Szybkie gry muzyczne",
        "rhythmTap": "Klepanie w rytm",
        "pitchMatch": "Dopasowanie wysokości",
        "lyricFill": "Uzupełnianie tekstu",
        "melodyMemory": "Pamięć melodii",
        "noteDrop": "Spadające nuty",
        "play": "Graj",
        "highScore": "Najlepszy wynik",
        "level": "Poziom",
        "lives": "Życia",
        "gameOver": "Koniec gry",
        "tryAgain": "Spróbuj ponownie",
        "newRecord": "Nowy rekord!"
    },
    "karaokeProjects": {
        "title": "Projekty karaoke",
        "newProject": "Nowy projekt",
        "importFile": "Importuj plik",
        "noProjects": "Brak projektów",
        "createFirst": "Utwórz swój pierwszy projekt karaoke",
        "lastModified": "Ostatnia modyfikacja",
        "songs": "Utwory"
    },
    "karaokeEditor": {
        "title": "Edytor karaoke",
        "timeline": "Oś czasu",
        "lyrics": "Tekst",
        "notes": "Nuty",
        "preview": "Podgląd",
        "save": "Zapisz",
        "export": "Eksportuj",
        "import": "Importuj",
        "undo": "Cofnij",
        "redo": "Ponów",
        "zoom": "Powiększenie",
        "snap": "Przyciąganie",
        "quantize": "Kwantyzacja",
        "addNote": "Dodaj nutę",
        "deleteNote": "Usuń nutę",
        "splitNote": "Podziel nutę",
        "mergeNotes": "Połącz nuty",
        "golden": "Złota nuta",
        "freestyle": "Freestyle",
        "bonus": "Bonus"
    },
    "dmxEditor": {
        "title": "Edytor DMX",
        "channels": "Kanały",
        "scenes": "Sceny",
        "fixtures": "Urządzenia",
        "timeline": "Oś czasu",
        "addFixture": "Dodaj urządzenie",
        "addScene": "Dodaj scenę",
        "save": "Zapisz",
        "preview": "Podgląd"
    },
    "dmxProjects": {
        "title": "Projekty DMX",
        "newProject": "Nowy projekt",
        "noProjects": "Brak projektów",
        "createFirst": "Utwórz swój pierwszy projekt DMX"
    },
    "honeyTokenDashboard": {
        "title": "Panel HoneyTokenów",
        "active": "Aktywne",
        "triggered": "Uruchomione",
        "create": "Utwórz HoneyToken",
        "type": "Typ",
        "createdAt": "Utworzono",
        "lastTriggered": "Ostatnio uruchomiono",
        "triggerCount": "Liczba uruchomień",
        "status": "Status",
        "delete": "Usuń",
        "noTokens": "Brak HoneyTokenów"
    },
    "honeyTokens": {
        "title": "HoneyTokeny",
        "manage": "Zarządzaj"
    },
    "admin": {
        "title": "Administracja",
        "users": "Użytkownicy",
        "audit": "Audyt",
        "settings": "Ustawienia"
    },
    "songFilter": {
        "title": "Filtr utworów",
        "genre": "Gatunek",
        "language": "Język",
        "year": "Rok",
        "artist": "Artysta",
        "bpm": "BPM",
        "difficulty": "Trudność",
        "all": "Wszystko",
        "apply": "Zastosuj",
        "clear": "Wyczyść"
    },
    "myAuditLogs": {
        "title": "Moje logi audytu",
        "date": "Data",
        "action": "Akcja",
        "ip": "Adres IP",
        "noLogs": "Brak logów"
    },
    "activeTokens": {
        "title": "Aktywne tokeny",
        "token": "Token",
        "device": "Urządzenie",
        "createdAt": "Utworzono",
        "expiresAt": "Wygasa",
        "revoke": "Unieważnij",
        "revokeAll": "Unieważnij wszystkie"
    },
    "pagination": {
        "first": "Pierwsza",
        "last": "Ostatnia",
        "next": "Następna",
        "prev": "Poprzednia",
        "page": "Strona",
        "of": "z",
        "showing": "Wyświetlanie",
        "results": "wyników"
    },
    "auditLog": {
        "title": "Log audytu",
        "user": "Użytkownik",
        "action": "Akcja",
        "date": "Data",
        "ip": "IP",
        "details": "Szczegóły"
    },
    "partyForm": {
        "title": "Utwórz wydarzenie",
        "name": "Nazwa",
        "date": "Data",
        "description": "Opis",
        "maxPlayers": "Maks. graczy",
        "isPublic": "Publiczne",
        "create": "Utwórz",
        "update": "Aktualizuj"
    },
    "adminPasswordReqs": {
        "title": "Wymagania hasła",
        "minLength": "Min. długość",
        "requireUppercase": "Wymagaj dużych liter",
        "requireLowercase": "Wymagaj małych liter",
        "requireDigit": "Wymagaj cyfr",
        "requireSpecial": "Wymagaj znaków specjalnych",
        "save": "Zapisz",
        "saved": "Zapisano"
    },
    "audioProjectForm": {
        "title": "Projekt audio",
        "name": "Nazwa projektu",
        "tempo": "Tempo (BPM)",
        "sampleRate": "Częstotliwość próbkowania",
        "create": "Utwórz projekt"
    },
    "datePresets": {
        "today": "Dziś",
        "yesterday": "Wczoraj",
        "last7days": "Ostatnie 7 dni",
        "last30days": "Ostatnie 30 dni",
        "thisMonth": "Ten miesiąc",
        "lastMonth": "Poprzedni miesiąc",
        "custom": "Niestandardowy"
    },
    "collaborators": {
        "title": "Współpracownicy",
        "add": "Dodaj współpracownika",
        "remove": "Usuń",
        "role": "Rola",
        "owner": "Właściciel",
        "editor": "Edytor",
        "viewer": "Widz",
        "invited": "Zaproszony"
    },
    "librarySearch": {
        "title": "Wyszukiwanie w bibliotece",
        "placeholder": "Szukaj utworów, artystów...",
        "noResults": "Brak wyników",
        "results": "Wyniki wyszukiwania"
    },
    "libraryExplorer": {
        "title": "Eksplorator biblioteki",
        "folders": "Foldery",
        "files": "Pliki",
        "recentlyAdded": "Ostatnio dodane"
    },
    "adminAudit": {
        "title": "Audyt administracyjny",
        "allActions": "Wszystkie akcje",
        "userFilter": "Filtr użytkownika",
        "dateRange": "Zakres dat",
        "export": "Eksportuj"
    },
    "explorePageInner": {
        "title": "Odkrywaj",
        "trending": "Popularne",
        "newReleases": "Nowości",
        "topRated": "Najwyżej oceniane",
        "forYou": "Dla Ciebie"
    },
    "projectsPage": {
        "title": "Projekty",
        "newProject": "Nowy projekt",
        "recent": "Ostatnie",
        "all": "Wszystkie",
        "noProjects": "Brak projektów"
    },
    "karaokeManager": {
        "title": "Menedżer karaoke"
    },
    "songBrowser": {
        "title": "Przeglądarka utworów",
        "search": "Szukaj",
        "filter": "Filtruj"
    },
    "latencyCalibrator": {
        "title": "Kalibracja opóźnienia",
        "start": "Rozpocznij kalibrację",
        "instruction": "Stukaj w rytm kliknięć",
        "result": "Wykryte opóźnienie",
        "apply": "Zastosuj",
        "retry": "Powtórz"
    },
    "karaokeBrowser": {
        "title": "Przeglądarka karaoke"
    },
    "speechSynth": {
        "title": "Syntezator mowy",
        "placeholder": "Wprowadź tekst...",
        "autoPlay": "Autoodtwarzanie",
        "generate": "Generuj"
    },
    "gamepad": {
        "title": "Gamepad",
        "connected": "Podłączony",
        "disconnected": "Odłączony",
        "noGamepad": "Nie wykryto gamepada",
        "mapping": "Mapowanie",
        "testButtons": "Testuj przyciski",
        "axes": "Osie",
        "buttons": "Przyciski",
        "vibration": "Wibracja"
    },
    "profilePlayer": {
        "title": "Profil gracza",
        "stats": "Statystyki",
        "history": "Historia",
        "achievements": "Osiągnięcia"
    },
    "captcha": {
        "title": "CAPTCHA",
        "instructions": "Rozwiąż zagadkę",
        "refresh": "Odśwież",
        "submit": "Sprawdź"
    },
    "passwordRules": {
        "title": "Zasady hasła",
        "minLength": "Min. {{count}} znaków",
        "uppercase": "Wielka litera",
        "lowercase": "Mała litera",
        "digit": "Cyfra",
        "special": "Znak specjalny"
    },
    "passwordRulesList": {
        "title": "Lista zasad haseł"
    },
    "youtubePlayer": {
        "title": "Odtwarzacz YouTube"
    },
    "playerControls": {
        "play": "Odtwórz",
        "pause": "Pauza",
        "stop": "Stop",
        "next": "Następny",
        "previous": "Poprzedni",
        "shuffle": "Losowo",
        "repeat": "Powtarzaj",
        "volume": "Głośność",
        "mute": "Wycisz"
    },
    "clipUpload": {
        "title": "Przesyłanie klipu",
        "dragDrop": "Przeciągnij i upuść plik",
        "or": "lub",
        "browse": "Przeglądaj",
        "uploading": "Przesyłanie...",
        "uploaded": "Przesłano"
    },
    "projectList": {
        "title": "Lista projektów",
        "new": "Nowy projekt",
        "open": "Otwórz",
        "delete": "Usuń",
        "rename": "Zmień nazwę"
    },
    "genericPlaylist": {
        "title": "Playlista",
        "addTrack": "Dodaj utwór",
        "removeTrack": "Usuń utwór",
        "clear": "Wyczyść",
        "shuffle": "Tasuj"
    },
    "playlistList": {
        "title": "Lista playlist",
        "create": "Utwórz playlistę",
        "noPlaylists": "Brak playlist"
    },
    "ultrastarRow": {
        "title": "Wiersz Ultrastar"
    },
    "libraryList": {
        "title": "Lista biblioteki"
    },
    "libraryActions": {
        "addToPlaylist": "Dodaj do playlisty",
        "addToQueue": "Dodaj do kolejki",
        "showDetails": "Pokaż szczegóły"
    },
    "libraryTabs": {
        "songs": "Utwory",
        "albums": "Albumy",
        "artists": "Artyści",
        "playlists": "Playlisty"
    },
    "songSelection": {
        "title": "Wybór utworu",
        "search": "Szukaj utworu",
        "noResults": "Brak wyników"
    },
    "clipList": {
        "title": "Lista klipów",
        "empty": "Brak klipów"
    },
    "karaokeUploader": {
        "title": "Przesyłanie karaoke",
        "upload": "Prześlij",
        "format": "Format",
        "encoding": "Kodowanie"
    },
    "userInfo": {
        "title": "Informacje o użytkowniku",
        "username": "Nazwa",
        "email": "E-mail",
        "role": "Rola",
        "joinDate": "Data dołączenia"
    },
    "animatedPerson": {
        "title": "Animowana postać",
        "name": "Nazwa",
        "avatar": "Awatar",
        "create": "Utwórz postać",
        "edit": "Edytuj postać"
    },
    "attractionPicker": {
        "title": "Wybór atrakcji"
    },
    "logFilter": {
        "title": "Filtr logów",
        "user": "Użytkownik",
        "action": "Akcja",
        "dateFrom": "Od",
        "dateTo": "Do",
        "apply": "Zastosuj",
        "clear": "Wyczyść"
    },
    "gameSettings": {
        "title": "Ustawienia gry",
        "difficulty": "Trudność",
        "easy": "Łatwy",
        "medium": "Średni",
        "hard": "Trudny",
        "expert": "Ekspert",
        "roundDuration": "Czas rundy",
        "maxPlayers": "Maks. graczy"
    },
    "roleNav": {
        "admin": "Admin",
        "user": "Użytkownik",
        "moderator": "Moderator"
    },
    "explorePage": {
        "title": "Odkrywaj"
    }
};

// Now handle more complex sections by auto-translating from EN using the dictionary
function autoTranslate(value) {
    if (typeof value === 'string') {
        // Check exact match first
        if (dict[value]) return dict[value];
        // Check case-insensitive exact match
        const lower = value.toLowerCase();
        for (const [k, v] of Object.entries(dict)) {
            if (k.toLowerCase() === lower) return v;
        }
        return value; // Return English as fallback
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const result = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = autoTranslate(v);
        }
        return result;
    }
    return value;
}

// Add all manual translations
let addedCount = 0;
for (const [key, translations] of Object.entries(plTranslations)) {
    if (!pl[key]) {
        pl[key] = translations;
        addedCount++;
    }
}

// For remaining missing sections, use auto-translate with dictionary fallback
const enKeys = Object.keys(en);
const plKeys = Object.keys(pl);
const stillMissing = enKeys.filter(k => !plKeys.includes(k));

for (const key of stillMissing) {
    pl[key] = autoTranslate(en[key]);
    addedCount++;
}

// Write PL file
fs.writeFileSync(path.join(localesDir, 'pl.json'), JSON.stringify(pl, null, 2), 'utf8');

// Validate
try {
    JSON.parse(fs.readFileSync(path.join(localesDir, 'pl.json'), 'utf8'));
    console.log('pl.json: VALID');
} catch (e) {
    console.log('pl.json: INVALID - ' + e.message);
}

console.log(`Added ${addedCount} sections to pl.json`);
const newPlKeys = Object.keys(pl);
console.log(`PL now has ${newPlKeys.length} top-level keys (was ${plKeys.length})`);
