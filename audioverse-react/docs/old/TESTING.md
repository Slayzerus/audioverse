# TESTING.md

## Spis funkcjonalności i ścieżki testowania manualnego (Frontend)

---

## 1. Nawigacja i dostępność

- **Nawigacja gamepadem/klawiaturą**
  - Ścieżka: Dowolna strona → Użyj strzałek/gamepada → Przemieszczaj się po navbarze i dropdownach
- **Dropdowny w navbarze (Karaoke, Admin, Profile, Settings)**
  - Ścieżka: Home → Przejdź do wybranego dropdownu → Otwórz Enter/A → Przemieszczaj się po itemach → Sprawdź zamykanie po utracie focusa
- **Zmiana motywu (ThemeToggle)**
  - Ścieżka: Home → Przejdź do ikony zębatki → Kliknij → Przełącz motyw

---

## 2. Autoryzacja i użytkownik

- **Logowanie**
  - Ścieżka: Home → Sign In → Wprowadź dane → Zaloguj
- **Rejestracja**
  - Ścieżka: Home → Sign Up → Wprowadź dane → Zarejestruj
- **Wylogowanie**
  - Ścieżka: Dowolna strona → Sign Out
- **Zmiana hasła**
  - Ścieżka: Profile → Change Password
- **Wymuszenie zmiany hasła**
  - Ścieżka: Zaloguj się jako użytkownik z wymuszoną zmianą hasła → Sprawdź ograniczony navbar

---

## 3. Karaoke

- **Lista piosenek**
  - Ścieżka: Home → Karaoke → Sing → Wybierz piosenkę
- **Odtwarzanie karaoke**
  - Ścieżka: Karaoke → Sing → Wybierz piosenkę → Sprawdź synchronizację tekstu i audio

---

## 4. Panel administratora

- **Dashboard**
  - Ścieżka: Admin → Dashboard
- **Audit**
  - Ścieżka: Admin → Audit
- **Users**
  - Ścieżka: Admin → Users
- **Settings**
  - Ścieżka: Admin → Settings
- **Password Requirements**
  - Ścieżka: Admin → Password Requirements
- **HoneyTokens**
  - Ścieżka: Admin → HoneyTokens
- **OTP**
  - Ścieżka: Admin → OTP
- **Logi aktywności**
  - Ścieżka: Admin → Logi aktywności
- **Próby logowania**
  - Ścieżka: Admin → Próby logowania

---

## 5. Ustawienia

- **Controller**
  - Ścieżka: Settings → Controller
- **Audio Input**
  - Ścieżka: Settings → Audio Input
- **Reset tutoriali**
  - Ścieżka: Settings → Reset Tutorials → Potwierdź

---

## 6. Tutoriale

- **Wyświetlanie tutoriali**
  - Ścieżka: Home/Features/itd. → Sprawdź pojawienie się tutoriala na stronie
- **Resetowanie tutoriali**
  - Ścieżka: Settings → Reset Tutorials → Potwierdź → Przejdź na stronę z tutorialem

---

## 7. Strony główne i dodatkowe

- **Home**
  - Ścieżka: Home
- **Features**
  - Ścieżka: Features
- **Profile**
  - Ścieżka: Profile

---

## 8. Inne

- **Responsywność**
  - Ścieżka: Dowolna strona → Zmień rozmiar okna → Sprawdź układ
- **Obsługa błędów**
  - Ścieżka: Wprowadź błędne dane logowania/rejestracji → Sprawdź komunikaty

---

> Uwaga: Każdą funkcjonalność testuj zarówno myszką, jak i klawiaturą/gamepadem, jeśli dotyczy.

---

## Ultrastar Editor — szybkie scenariusze testowe (funkcjonalność -> ścieżka)

- Audio: Edytor -> AudioTab -> Wgraj plik audio -> Odtwórz / przewiń -> Sprawdź podgląd i ukryty player
- Text: Edytor -> TextTab -> Wklej/Załaduj Ultrastar .txt -> Przejdź do NotesTab -> Sprawdź parsowanie nut i sylab
- Notes (piano-roll): Edytor -> NotesTab -> Dodaj nutę (klik) -> Przesuń (przeciągnij) -> Zmień długość (uchwyty) -> Split (dwuklik) -> Eksportuj do Ultrastar
- Playhead i trafienia: Edytor -> NotesTab -> Odtwórz audio -> Obserwuj playhead na canvas -> Sprawdź, że przy przekroczeniu start pojawia się flash trafienia (kolor gracza)
- Undo/Redo: Edytor -> NotesTab -> Wykonaj edycję -> Ctrl/Cmd+Z (cofnij) -> Ctrl/Cmd+Y lub Shift+Z (przywróć)
- Export/Animacje: Edytor -> ExportTab -> Zmień ustawienia animacji / wybierz preset -> Podgląd -> Sprawdź reset i pamięć ustawień
- Backup / Restore: Edytor -> Restore backup -> Wybierz plik -> Przywróć audio / tekst / nuty OR Edytor -> Save full backup -> Pobierz JSON i sprawdź przywracanie
- Wersje i współpracownicy: Edytor -> ExportTab -> Version History / Collaborators -> Sprawdź widoczność akcji wg ACL -> Dodaj/usuń współpracownika / Przywróć wersję (jeśli backend)
- Długie pliki: Edytor -> NotesTab -> Załaduj długi Ultrastar -> Przewijanie i virtualizacja listy (płynność)
