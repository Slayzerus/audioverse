# Bezpieczeństwo, audyt i honeytokeny

System bezpieczeństwa: logowanie audytowe, panel debugowania nawigacji, system honeytokenów (tworzenie/monitorowanie/alerty), śledzenie prób logowania, zarządzanie OTP, wymagania haseł i dashboard bezpieczeństwa.

## Architektura

```
components/audit/
 ├─ AuditLogTable.tsx          — tabela logów audytu
 ├─ AuditLogDetail.tsx         — szczegóły wpisu
 └─ LogFilterPanel.tsx         — panel filtrów

components/honeytokens/
 ├─ ActiveTokensList.tsx       — lista aktywnych tokenów
 ├─ CreateHoneyTokenForm.tsx   — tworzenie nowego tokena
 └─ TriggeredTokensAlert.tsx   — alert wyzwolonych tokenów

components/debug/
 └─ NavigationDebugPanel.tsx   — panel debugowania routingu

components/auth/
 ├─ PasswordStrengthIndicator.tsx  — wskaźnik siły hasła
 ├─ PasswordRulesList.tsx          — lista reguł hasła
 ├─ CaptchaComponent.tsx           — komponent CAPTCHA
 ├─ RequireAuth.tsx                — route guard (auth)
 └─ RequireAdmin.tsx               — route guard (admin)

services/
 ├─ auditService.ts            — serwis audytu
 ├─ honeyTokenService.ts       — serwis honeytokenów
 └─ navigationLogger.ts        — logger nawigacji

pages/admin/
 ├─ AdminAuditDashboard.tsx    — dashboard audytu
 ├─ AuditLogsPage.tsx          — strona logów
 ├─ HoneyTokenDashboard.tsx    — dashboard honeytokenów
 ├─ LoginAttemptsPage.tsx      — próby logowania
 ├─ OtpManagementPage.tsx      — zarządzanie OTP
 └─ AdminPasswordRequirementsPage.tsx — wymagania haseł

pages/dashboard/
 ├─ SecurityDashboard.tsx      — dashboard bezpieczeństwa użytkownika
 └─ MyAuditLogsPage.tsx        — moje logi audytu

types/
 └─ securityTypes.ts           — typy bezpieczeństwa

scripts/api/
 ├─ apiAdmin.ts                — endpointy admin (audyt, OTP, honeytokeny)
 └─ apiModeration.ts           — endpointy moderacji
```

## Audyt

### Tabela logów

`AuditLogTable.tsx` — interaktywna tabela:
- Kolumny: timestamp, użytkownik, akcja, zasób, IP, user-agent
- Sortowanie po kolumnach
- Paginacja
- Kliknięcie → szczegóły w `AuditLogDetail.tsx`

### Filtry

`LogFilterPanel.tsx`:
- Zakres dat (od/do)
- Typ akcji (login/logout/create/update/delete/access)
- Użytkownik (wyszukiwanie)
- Zasób (typ + ID)
- Adres IP

### Serwis

`auditService.ts`:
- Pobieranie logów z paginacją i filtrami
- Eksport (CSV/JSON)
- Statystyki (top akcje, top użytkownicy)

## System honeytokenów

Honeytokeny to fałszywe zasoby zaprojektowane do wykriwania nieautoryzowanego dostępu.

### Tworzenie

`CreateHoneyTokenForm.tsx`:
- Typ tokena (URL, endpoint, plik, rekord DB)
- Nazwa i opis
- Ważność/wygaśnięcie
- Konfiguracja alertów

### Monitorowanie

`ActiveTokensList.tsx`:
- Lista aktywnych tokenów z statusem
- Timestamp ostatniego sprawdzenia
- Licznik wyzwoleń

### Alerty

`TriggeredTokensAlert.tsx`:
- Powiadomienie o wyzwoleniu tokena
- Szczegóły: kto, kiedy, skąd (IP, user-agent)
- Akcje: potwierdź, zignoruj, eskaluj

### Dashboard

`HoneyTokenDashboard.tsx`:
- Przegląd wszystkich tokenów
- Statystyki wyzwoleń
- Tworzenie nowych tokenów
- Dezaktywacja istniejących

## Próby logowania

`LoginAttemptsPage.tsx`:
- Tabela prób logowania (udane/nieudane)
- Filtrowanie po użytkowniku, IP, statusie
- Wykrywanie brute-force (wielokrotne nieudane próby)
- Blokowanie IP / użytkownika

## OTP (One-Time Password)

`OtpManagementPage.tsx`:
- Lista użytkowników z włączonym 2FA
- Generowanie kodów zapasowych
- Reset 2FA
- Statystyki użycia

## Wymagania haseł

`AdminPasswordRequirementsPage.tsx`:
- Konfiguracja reguł haseł:
  - Minimalna długość
  - Wielkie/małe litery
  - Cyfry
  - Znaki specjalne
  - Historia haseł (ile unikalnych)
  - Czas wygaśnięcia

`PasswordStrengthIndicator.tsx`:
- Wizualny wskaźnik siły hasła (pasek)
- Kolory: czerwony → pomarańczowy → zielony
- Procent siły

`PasswordRulesList.tsx`:
- Lista reguł z checkmarkami (spełnione/niespełnione)
- Dynamiczna aktualizacja przy wpisywaniu

## Route Guards

### RequireAuth

```typescript
// Opakowuje route'y wymagające zalogowania
<RequireAuth>
  <ProtectedPage />
</RequireAuth>
```

Przekierowuje na `/login` gdy brak sesji. Sprawdza `UserContext.isAuthenticated`.

### RequireAdmin

```typescript
// Opakowuje route'y wymagające roli admin
<RequireAdmin>
  <AdminPage />
</RequireAdmin>
```

Sprawdza `UserContext.roles.includes('Admin')`. Przekierowuje na `/403`.

## CAPTCHA

`CaptchaComponent.tsx`:
- Integracja z systemem CAPTCHA
- Wymagane przy logowaniu po wielokrotnych nieudanych próbach
- Wymagane przy rejestracji

## Panel debugowania nawigacji

`NavigationDebugPanel.tsx`:
- Śledzenie zmian route'ów
- Logowanie nawigacji z timestampami
- Widoczne tylko w trybie deweloperskim
- `navigationLogger.ts` — serwis logowania

## Dashboard bezpieczeństwa (użytkownik)

`SecurityDashboard.tsx`:
- Aktywne sesje
- Historia logowań
- Zmiana hasła
- Konfiguracja 2FA
- Podgląd moich logów audytu (`MyAuditLogsPage.tsx`)

## Typy

```typescript
// securityTypes.ts
interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId?: number;
  userName?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

interface HoneyToken {
  id: number;
  type: 'url' | 'endpoint' | 'file' | 'record';
  name: string;
  description?: string;
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
}
```

## Routing

| Ścieżka | Komponent |
|---|---|
| `/admin/audit` | `AdminAuditDashboard.tsx` |
| `/admin/audit/logs` | `AuditLogsPage.tsx` |
| `/admin/honeytokens` | `HoneyTokenDashboard.tsx` |
| `/admin/login-attempts` | `LoginAttemptsPage.tsx` |
| `/admin/otp` | `OtpManagementPage.tsx` |
| `/admin/password-requirements` | `AdminPasswordRequirementsPage.tsx` |
| `/dashboard/security` | `SecurityDashboard.tsx` |
| `/dashboard/audit` | `MyAuditLogsPage.tsx` |
