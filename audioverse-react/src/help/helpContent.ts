/**
 * Help content per page — contextual wiki for the Help panel.
 * Routes map to help articles via prefix matching.
 */

export interface HelpArticle {
    title: string;
    /** Short description shown in the panel header */
    summary: string;
    /** Full content — Markdown-like, rendered as HTML */
    sections: HelpSection[];
    /** Related help article keys for cross-linking */
    related?: string[];
}

export interface HelpSection {
    heading: string;
    content: string;
}

export const helpArticles: Record<string, HelpArticle> = {
    home: {
        title: "Strona główna",
        summary: "Przegląd aplikacji AudioVerse",
        sections: [
            {
                heading: "Witaj w AudioVerse!",
                content:
                    "AudioVerse to kompleksowa platforma muzyczna łącząca karaoke, edycję audio, zarządzanie playlistami, " +
                    "minigierki muzyczne i organizację imprez (Parties). Z głównego menu nawiguj do interesujących Cię sekcji.",
            },
            {
                heading: "Nawigacja",
                content:
                    "Użyj paska nawigacji u góry aby przejść do sekcji: Play (karaoke i gry), Explore (biblioteka, gry planszowe), " +
                    "Music (odtwarzacz, playlisty), Create (studio, edytor), Settings (ustawienia konta i audio).",
            },
            {
                heading: "Gamepad",
                content:
                    "Aplikacja wspiera nawigację padem (Xbox/PlayStation). Podłącz pad i używaj D-Pada do poruszania się, " +
                    "A/X do potwierdzania, B/O do cofania. Fokus jest widoczny jako podświetlenie elementu.",
            },
        ],
        related: ["play", "music-player", "settings"],
    },
    play: {
        title: "Play — Karaoke & Gry",
        summary: "Uruchom sesję karaoke, minigierki lub hit-that-note",
        sections: [
            {
                heading: "Szybki start",
                content:
                    "Przejdź do /play aby zobaczyć listę dostępnych aktywności: Karaoke Parties, szybkie gry, minigierki " +
                    "muzyczne i tryb Hit That Note.",
            },
            {
                heading: "Karaoke Party",
                content:
                    "Stwórz Party z /parties → 'New Party'. Dodaj graczy, wybierz piosenki i rozpocznij rundy. " +
                    "Każdy gracz śpiewa po kolei lub jednocześnie (w zależności od trybu sesji).",
            },
        ],
        related: ["parties", "songs", "rounds"],
    },
    parties: {
        title: "Parties — Imprezy",
        summary: "Zarządzanie imprezami karaoke",
        sections: [
            {
                heading: "Tworzenie Party",
                content:
                    "Kliknij 'New Party', podaj nazwę i wybierz motyw kolorystyczny. Party to kontener na sesje karaoke, " +
                    "gry towarzyskie i atrakcje imprezowe.",
            },
            {
                heading: "Zapraszanie gości",
                content:
                    "Udostępnij link lub kod QR do party. Goście mogą dołączyć z telefonu skanując kod lub wpisując " +
                    "kod party na stronie /join.",
            },
            {
                heading: "Atrakcje",
                content:
                    "W ramach Party możesz tworzyć atrakcje: karaoke sessions, mini-gierki, quizy. " +
                    "Każda atrakcja ma własne ustawienia i punktację.",
            },
        ],
        related: ["play", "rounds", "songs", "gameSettings"],
    },
    gameSettings: {
        title: "Gry Karaoke — Ustawienia sesji",
        summary: "Konfiguracja gier: tryby, rundy, czas, motywy kolorystyczne i czcionki",
        sections: [
            {
                heading: "Tworzenie gry",
                content:
                    "W zakładce 'Games' na stronie Party kliknij 'New Game'. Wybierz tryb gry " +
                    "(Classic, Blind, Elimination, Relay, Freestyle), ilość rund i limit czasu na rundę.",
            },
            {
                heading: "Motyw kolorystyczny i czcionka",
                content:
                    "Każda gra może mieć własny motyw kolorystyczny (primary + secondary color), czcionkę " +
                    "i tło. Te ustawienia wpływają na wygląd interfejsu podczas gry.",
            },
            {
                heading: "Tryby gry",
                content:
                    "Classic — standardowe karaoke z punktacją. Blind — tekst jest ukryty. Elimination — " +
                    "najsłabszy gracz odpada po każdej rundzie. Relay — gracze śpiewają na zmianę. " +
                    "Freestyle — bez ograniczeń i punktacji.",
            },
        ],
        related: ["parties", "rounds", "play"],
    },
    songs: {
        title: "Piosenki Karaoke",
        summary: "Przeglądanie i zarządzanie biblioteką piosenek",
        sections: [
            {
                heading: "Biblioteka piosenek",
                content:
                    "Strona /songs wyświetla wszystkie dostępne piosenki w formacie UltraStar. " +
                    "Używaj filtrów (język, artysta, trudność) i wyszukiwania aby znaleźć piosenki.",
            },
            {
                heading: "Playlisty karaoke",
                content:
                    "Twórz playlisty karaoke z /karaoke-playlists. Playlisty można udostępniać innym użytkownikom " +
                    "i używać jako kolejkę w sesjach karaoke.",
            },
        ],
        related: ["play", "rounds"],
    },
    rounds: {
        title: "Rundy Karaoke",
        summary: "Śpiewanie i punktacja",
        sections: [
            {
                heading: "Timeline",
                content:
                    "Na ekranie śpiewania widzisz canvas z linią czasową: szare paski to nuty do trafienia, " +
                    "złote paski to nuty bonusowe (gold notes). Lecąca kulka w Twoim kolorze zamalowuje trafione nuty.",
            },
            {
                heading: "Punktacja",
                content:
                    "System punktacji oparty na regułach UltraStar: trafienie nuty (pitch ±2 semitony) daje punkty, " +
                    "combo mnoży punkty (x2 po 10, x3 po 25, x4 po 50), a złote nuty dają podwójne punkty. " +
                    "Każdy wers jest oceniany: Awful → Poor → OK → Good → Great → Perfect.",
            },
            {
                heading: "Ekran wyniku",
                content:
                    "Po zakończeniu rundy wyświetlany jest ekran z Twoim wynikiem, pozycją w rankingu top 10 " +
                    "i opcjami: zagraj ponownie lub przejdź do następnej piosenki.",
            },
        ],
        related: ["songs", "parties"],
    },
    "music-player": {
        title: "Odtwarzacz muzyki",
        summary: "Odtwarzanie i zarządzanie odtwarzaczem",
        sections: [
            {
                heading: "Odtwarzacz",
                content:
                    "Strona /music-player umożliwia odtwarzanie muzyki z biblioteki. Obsługuje pliki audio, " +
                    "streaming z YouTube i playlisty. Przed odtworzeniem wymagana jest aktywacja AudioContext (kliknij/spacja).",
            },
            {
                heading: "Sterowanie",
                content:
                    "Play/Pause, Previous/Next, głośność, odtwarzanie losowe i w pętli. " +
                    "Jeśli piosenka ma podkład karaoke, wyświetla się odliczanie 3...2...1... przed startem.",
            },
        ],
        related: ["playlists"],
    },
    playlists: {
        title: "Playlisty",
        summary: "Zarządzanie playlistami muzycznymi",
        sections: [
            {
                heading: "Przeglądanie",
                content: "Strona /playlists wyświetla Twoje playlisty. Możesz je tworzyć, edytować, usuwać i udostępniać.",
            },
            {
                heading: "Playlist Manager",
                content:
                    "Zaawansowane zarządzanie na /playlist-manager — import/export, budowanie playlist z wielu źródeł, " +
                    "tagi i katalogi.",
            },
        ],
        related: ["music-player"],
    },
    "create-studio": {
        title: "Studio Audio — Edytor",
        summary: "Tworzenie i edycja projektów audio",
        sections: [
            {
                heading: "Projekty",
                content:
                    "Przejdź do /create/projects aby zobaczyć swoje projekty. Kliknij projekt aby otworzyć go w edytorze " +
                    "z pełnym widokiem warstw, klipów audio, efektów Master FX i automatyki.",
            },
            {
                heading: "Edytor audio",
                content:
                    "Edytor obsługuje: wielowarstwową edycję, nagrywanie z mikrofonu, cięcie/kopiowanie/wklejanie, " +
                    "auto-save, undo/redo, zoom/snap, MIDI, soundfonty, i eksport do wielu formatów.",
            },
            {
                heading: "Tryby wyświetlania",
                content:
                    "Edytor oferuje tryby: Fun (uproszczony), Beginner, Mid, Expert, Master (pełny) — " +
                    "każdy tryb pokazuje odpowiedni zestaw narzędzi i opcji.",
            },
        ],
        related: ["karaoke-editor"],
    },
    "karaoke-editor": {
        title: "Edytor Karaoke",
        summary: "Tworzenie i edycja plików UltraStar",
        sections: [
            {
                heading: "Edytor UltraStar",
                content:
                    "Strona /karaoke-editor umożliwia tworzenie i edycję plików karaoke w formacie UltraStar. " +
                    "Importuj z YouTube, syncuj tekst z muzyką, ustaw nuty i gold notes.",
            },
        ],
        related: ["create-studio", "songs"],
    },
    settings: {
        title: "Ustawienia",
        summary: "Konfiguracja konta, motywu i audio",
        sections: [
            {
                heading: "Ustawienia ogólne",
                content:
                    "Na stronie /settings możesz zmienić motyw kolorystyczny (12+ motywów), język interfejsu (PL/EN), " +
                    "i preferencje wyświetlania.",
            },
            {
                heading: "Ustawienia audio",
                content:
                    "Przejdź do /settings/audio-input aby skonfigurować mikrofon i urządzenia wejściowe. " +
                    "Opcjonalnie skalibruj opóźnienie (latency) dla precyzyjnego scoringu karaoke.",
            },
            {
                heading: "Kontroler / Pad",
                content:
                    "Na /settings/controller skonfiguruj mapowanie przycisków kontrolera — przypisz akcje " +
                    "do przycisków gamepada i ustaw czułość analoga.",
            },
            {
                heading: "Ustawienia wyświetlania karaoke",
                content:
                    "Na /settings/display dostosuj kolory gradientu śpiewanego tekstu — wybierz jeden z 6 presetów " +
                    "(Cyan→Yellow→Amber, Neon Pink, Fire, Ocean, Forest, Retro) lub stwórz własny gradient. " +
                    "Tu też wybierzesz tryb animacji timeline (Ball & Trail, Wipe, Pulse, Bounce).",
            },
        ],
        related: ["home", "play"],
    },
    admin: {
        title: "Panel administracyjny",
        summary: "Zarządzanie użytkownikami, logami i ustawieniami systemu",
        sections: [
            {
                heading: "Zarządzanie użytkownikami",
                content: "Przeglądaj, edytuj i zarządzaj kontami użytkowników. Resetuj hasła, zmieniaj role.",
            },
            {
                heading: "Logi i audyt",
                content:
                    "Przeglądaj logi audytowe systemu, próby logowania, zdarzenia bezpieczeństwa. " +
                    "Eksportuj raporty do CSV.",
            },
            {
                heading: "Scoring Presets",
                content:
                    "Konfiguruj globalne presety punktacji karaoke (Easy/Normal/Hard) — tolerancja semitonów, " +
                    "okna czasowe, mnożniki trudności.",
            },
        ],
        related: ["settings"],
    },
    explore: {
        title: "Explore — Przeglądaj",
        summary: "Odkrywaj muzykę, gry planszowe i zasoby",
        sections: [
            {
                heading: "Biblioteka",
                content: "Strona /library udostępnia pliki audio, samplerów i preset soundfontów.",
            },
            {
                heading: "Gry planszowe",
                content: "Na /board-games przeglądaj kolekcję gier planszowych zintegrowaną z BoardGameGeek API.",
            },
        ],
        related: ["home"],
    },
    profile: {
        title: "Profil użytkownika",
        summary: "Zarządzanie profilem, hasłem i ustawieniami konta",
        sections: [
            {
                heading: "Profil",
                content:
                    "Edytuj swoje dane, avatar, zmiana hasła. Na /profile/settings zarządzaj graczami karaoke " +
                    "przypisanymi do Twojego konta.",
            },
        ],
        related: ["settings"],
    },
    "mini-games": {
        title: "Minigierki muzyczne",
        summary: "Gry muzyczne i wyzwania",
        sections: [
            {
                heading: "Dostępne gry",
                content:
                    "Minigierki muzyczne to proste gry oparte na rytmie i muzyce. Hit That Note — trafiaj nuty klawiaturą/padem. " +
                    "Jam Session — graj na wirtualnych instrumentach.",
            },
        ],
        related: ["play"],
    },
    "jam-session": {
        title: "Jam Session",
        summary: "Graj na wirtualnych instrumentach",
        sections: [
            {
                heading: "Instrumenty",
                content:
                    "Jam Session pozwala grać na wirtualnych instrumentach — klawiatura MIDI, pad jako perkusja, " +
                    "soundfonty SF2 jako presety. Możesz grać solo lub w trybie multiplayer.",
            },
        ],
        related: ["play", "mini-games"],
    },
    join: {
        title: "Dołącz do Party",
        summary: "Dołączanie do imprez przez kod lub QR",
        sections: [
            {
                heading: "Dołączanie",
                content:
                    "Wejdź na /join i wpisz kod party lub zeskanuj kod QR. Po dołączeniu możesz głosować " +
                    "na piosenki, śledzić wyniki i uczestniczyć w atrakcjach.",
            },
        ],
        related: ["parties"],
    },
    login: {
        title: "Logowanie",
        summary: "Logowanie do konta AudioVerse",
        sections: [
            {
                heading: "Logowanie",
                content:
                    "Zaloguj się za pomocą e-maila i hasła lub OAuth (Google, Microsoft, Discord, Spotify, Twitch). " +
                    "Przy pierwszym logowaniu z OAuth konto jest tworzone automatycznie.",
            },
        ],
        related: ["home"],
    },
    dashboard: {
        title: "Dashboard",
        summary: "Przegląd Twojej aktywności",
        sections: [
            {
                heading: "Dashboard",
                content:
                    "Twój osobisty pulpit z podsumowaniem: ostatnie sesje karaoke, statystyki śpiewania, " +
                    "nadchodzące eventy i powiadomienia.",
            },
        ],
        related: ["profile", "parties"],
    },
};

/**
 * Map a route path to its help article key.
 * Uses longest prefix match.
 */
const routeToHelpKey: [RegExp, string][] = [
    [/^\/admin/, "admin"],
    [/^\/parties/, "parties"],
    [/^\/rounds/, "rounds"],
    [/^\/songs/, "songs"],
    [/^\/karaoke-playlists/, "songs"],
    [/^\/play/, "play"],
    [/^\/music-player/, "music-player"],
    [/^\/playlists/, "playlists"],
    [/^\/playlist-manager/, "playlists"],
    [/^\/create\/studio/, "create-studio"],
    [/^\/create/, "create-studio"],
    [/^\/karaoke-editor/, "karaoke-editor"],
    [/^\/settings\/display/, "settings"],
    [/^\/settings/, "settings"],
    [/^\/profile/, "profile"],
    [/^\/explore/, "explore"],
    [/^\/library/, "explore"],
    [/^\/board-games/, "explore"],
    [/^\/mini-games/, "mini-games"],
    [/^\/hit-that-note/, "mini-games"],
    [/^\/jam-session/, "jam-session"],
    [/^\/join/, "join"],
    [/^\/login/, "login"],
    [/^\/register/, "login"],
    [/^\/dashboard/, "dashboard"],
    [/^\/dance/, "play"],
    [/^\/$/, "home"],
];

export function getHelpKeyForRoute(pathname: string): string {
    for (const [pattern, key] of routeToHelpKey) {
        if (pattern.test(pathname)) {
            return key;
        }
    }
    return "home";
}
