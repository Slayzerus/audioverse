# Autentykacja & OAuth — Frontend

System autentykacji oparty o JWT z refresh token flow, 7 providerów OAuth, custom CAPTCHA (8 typów), Google reCAPTCHA v3, TOTP 2FA, dynamiczne reguły hasła i route guards.

## Pliki

| Plik | Linii | Rola |
|------|------:|------|
| `apiUser.ts` | 398 | Core auth API (login, register, tokens, CAPTCHA, TOTP, audit) |
| `modelsAuth.ts` | 53 | DTOs: LoginResponse, TidalAuthTokens, reCaptcha |
| `audioverseApiClient.ts` | 127 | Axios instance, Bearer injection, 401 auto-logout, 429 retry |
| `authService.ts` | 15 | Facade re-export generateCaptcha/validateCaptcha/login |
| `apiTidalAuth.ts` | 85 | Tidal OAuth z PKCE |
| `apiGames.ts` (subset) | — | Generic `postOAuthCallback` + `fetchPlatformAuthUrl` |
| `UserContext.tsx` | 226 | React context: auth state, login/logout, device sync |
| `RequireAuth.tsx` | 32 | Guardy: RequireAuth + RequireAdmin |
| `AuthLayout.tsx` | 13 | Layout guard (wymaga auth) |
| `AdminLayout.tsx` | 16 | Layout guard (wymaga auth + admin) |
| `LoginForm.tsx` | 155 | Formularz logowania |
| `RegistrationForm.tsx` | 194 | Rejestracja z CAPTCHA + password rules |
| `ChangePasswordPage.tsx` × 2 | 300 + 166 | Zmiana hasła (2 warianty) |
| `FirstLoginPasswordChangePage.tsx` | 93 | Wymuszenie zmiany hasła po 1. logowaniu |
| `CaptchaComponent.tsx` | 48 | Renderowanie CAPTCHA (text/image/audio) |
| `PasswordStrengthIndicator.tsx` | 14 | Checklist reguł hasła |
| `*CallbackPage.tsx` × 7 | 65 each | Callbacki OAuth (Discord–YouTube) |

## Przepływ logowania

1. Użytkownik wpisuje username + hasło
2. `POST /api/user/login` → `LoginResponse`
3. Backend zwraca: `{ success, tokenPair: { accessToken, refreshToken }, requirePasswordChange? }`
4. `saveTokens()` → zmienne modułowe + `localStorage` (`audioverse_access_token` / `audioverse_refresh_token`)
5. `UserContext.login()` → `isAuthenticated = true`, ładuje `GET /api/user/me`
6. Jeśli `requirePasswordChange === true` → redirect do `/profile/change-password`

### Guest Login

`POST /api/user/guest-login` — anonimowy dostęp z tymi samymi tokenami.

### Rejestracja

1. Username, email, hasło
2. **Obowiązkowa CAPTCHA** (typ wybierany)
3. Walidacja hasła vs dynamiczne reguły z `GET /api/admin/password-requirements`
4. `POST /api/user/register` z `{ username, email, password, captchaId, captchaAnswer }`
5. Redirect do `/login` po 1.2s

## Token Management

### Przechowywanie

Dual storage: zmienne modułowe (`accessToken`, `refreshToken`) + `localStorage`.

### Kluczowe funkcje (apiUser.ts)

| Funkcja | Opis |
|---------|------|
| `saveTokens(access, refresh)` | Zapisuje in-memory + localStorage + ustawia header |
| `initTokensFromStorage()` | Hydratacja przy starcie app |
| `getAccessToken()` / `getRefreshToken()` | Publiczne gettery |
| `refreshTokenUser()` | `POST /api/user/refresh-token` — odświeża parę tokenów |

### Axios Interceptors (audioverseApiClient.ts)

**Request interceptor:**
- Odczyt tokena z localStorage
- Ustawienie `Authorization: Bearer {token}`
- Dodanie `X-Correlation-ID` (UUID) i `api-version: 1.0`

**Response interceptor (401):**
- Czyszczenie tokenów z localStorage
- Redirect do `/login` (jeśli bieżąca strona ≠ `/login`)

**Response interceptor (429):**
- Auto-retry z `Retry-After` header
- Max 2 retries, cap 30s
- Rate-limited error logging (2s cooldown per URL+status)

## OAuth — 7 providerów

Wszystkie używają identycznego callback pattern:

| Provider | Route | Kolor spinnera |
|----------|-------|----------------|
| Discord | `/discordCallback` | `#5865f2` |
| Google | `/googleCallback` | `#4285f4` |
| Microsoft | `/microsoftCallback` | `#00a4ef` |
| Spotify | `/spotifyCallback` | `#1db954` |
| Tidal | `/tidalCallback` | `#00ffff` |
| Twitch | `/twitchCallback` | `#9146ff` |
| YouTube | `/youtubeCallback` | `#ff0000` |

### Callback Flow

1. Provider redirectuje do `/{provider}Callback?code=...&state=...`
2. Callback page parsuje `code`, `state`, `error` z URL
3. Jeśli `error` → wyświetla błąd
4. `postOAuthCallback(platform, { code, redirectUri, state })` → `POST /api/user-connections/{platform}/callback`
5. Sukces → ✓ checkmark → redirect do `/settings` po 1.5s
6. Błąd → komunikat + link "Go to Settings"

### API

```typescript
fetchPlatformAuthUrl(platform, redirectUri?)  // GET /api/user-connections/{platform}/auth-url
postOAuthCallback(platform, body)             // POST /api/user-connections/{platform}/callback
fetchUserConnections()                        // GET /api/user-connections
```

### Tidal — dedykowany moduł (PKCE)

```typescript
fetchTidalAuthorizeUrl(params)                // GET /api/auth/tidal/url (z codeChallenge)
getTidalCallback(code, redirectUri)           // GET /api/auth/tidal/callback → TidalAuthTokens
postTidalRefresh(refreshToken)                // POST /api/auth/tidal/refresh
postTidalSetAccessToken(accessToken)          // POST /api/auth/tidal/set-token
```

React Query hooks: `useTidalAuthorizeUrlQuery`, `useTidalAuthenticateMutation`, `useTidalRefreshMutation`, `useTidalSetAccessTokenMutation`.

## Route Guards

### Layout-based

**AuthLayout** — wraps routes wymagające zalogowania:
- Sprawdza `useUser().isAuthenticated`
- Redirect do `/login` z `state.from`
- Routes: `/contacts`, `/create/*`, `/karaoke-editor/*`, `/dmx-editor/*`, `/profile/*`, `/dashboard`, `/my-audit-logs`

**AdminLayout** — wraps admin routes:
- Sprawdza `isAuthenticated` + `isAdmin`
- Routes: `/admin/*`, `/security-dashboard`

### Component-based

```typescript
<RequireAuth>
  <ProtectedContent />
</RequireAuth>

<RequireAdmin>
  <AdminOnlyContent />
</RequireAdmin>
```

## CAPTCHA

### Custom CAPTCHA (8 typów)

Backend generuje wyzwania `POST /api/user/captcha/generate?captchaType=N`:

1. Question Answer
2. Reverse String
3. Image Question
4. Math Problem
5. Image Selection
6. Image Region Selection
7. Puzzle Matching
8. Audio Question

Walidacja: `POST /api/user/captcha/validate { captchaId, answer }`.

`CaptchaComponent` renderuje text/images/audio. Base64 media parsowane z pipe-delimited challenge strings.

### Gdzie używane

| Kontekst | Custom CAPTCHA | reCAPTCHA v3 |
|----------|:-:|:-:|
| Login | ✗ | ✗ |
| Rejestracja | ✓ (obowiązkowa) | ✗ |
| Zmiana hasła (profile) | ✓ | ✓ |
| Zmiana hasła (auth) | ✓ | ✗ |

### Google reCAPTCHA v3

Używany w profilu ChangePasswordPage. Token z `window.grecaptcha.execute(siteKey, { action: 'changepassword' })` wysyłany do `changePasswordWithRecaptcha()`.

## Two-Factor Authentication (TOTP)

Pełny flow 2FA via TOTP:

```typescript
totpEnable()         // POST /api/user/totp/enable → QR code + secret
totpConfirm(code)    // POST /api/user/totp/confirm → aktywacja
totpVerify(uid, code)// POST /api/user/totp/verify → weryfikacja przy logowaniu
totpDisable()        // POST /api/user/totp/disable → wyłączenie
```

## Zmiana hasła — 3 flow

### 1. First Login (`/first-login-password-change`)
- Bez starego hasła (pusty string)
- Dynamiczne reguły z backendu
- Redirect do `/` po sukcesie

### 2. Profile Change (`/profile/change-password`)
- Stare hasło + nowe + potwierdzenie
- Custom CAPTCHA + Google reCAPTCHA v3 (podwójna ochrona)
- `PasswordStrengthIndicator`

### 3. Auth Change (`/auth/change-password`)
- Stare hasło + nowe + potwierdzenie
- Tylko Custom CAPTCHA
- Dynamiczne reguły

### Password Rules

`GET /api/admin/password-requirements` → `PasswordRequirementsDto`:
- `minLength`, `maxLength`
- `requireUppercase`, `requireLowercase`
- `requireDigit`, `requireSpecialChar`
- `active`

## UserContext

```typescript
const {
  isAuthenticated,     // boolean
  currentUser,         // { userId, username, roles[], isAdmin, requirePasswordChange? }
  userId,              // number | null
  username,            // string | null
  roles,               // string[]
  isAdmin,             // boolean
  login,               // () => Promise<void>
  logout,              // () => void
  loadCurrentUser,     // () => Promise<void>
  requirePasswordChange,
  systemConfig,        // { sessionTimeoutMinutes, captchaOption, maxMicrophonePlayers }
  userDevices,         // DeviceDto[]
  userMicrophones,     // MicrophoneDto[]
  syncUserDevices,     // () => Promise<void>
  gamepads,            // (Gamepad | null)[]
} = useUser();
```

Przy inicjalizacji UserContext: odczyt tokenów z localStorage → załadowanie currentUser → pobranie systemConfig → synchronizacja devices/microphones.

## API Endpoints

| Endpoint | Metoda | Rola |
|----------|--------|------|
| `/api/user/login` | POST | Logowanie |
| `/api/user/register` | POST | Rejestracja |
| `/api/user/guest-login` | POST | Guest access |
| `/api/user/me` | GET | Current user info |
| `/api/user/refresh-token` | POST | Token refresh |
| `/api/user/logout` | POST | Wylogowanie |
| `/api/user/change-password` | POST | Zmiana hasła |
| `/api/user/change-password-with-recaptcha` | POST | Zmiana z reCAPTCHA |
| `/api/user/first-login-password-change` | POST | 1. logowanie |
| `/api/user/captcha/generate` | POST | Generuj CAPTCHA |
| `/api/user/captcha/validate` | POST | Waliduj CAPTCHA |
| `/api/user/recaptcha/verify` | POST | Weryfikuj reCAPTCHA |
| `/api/user/totp/enable` | POST | Włącz 2FA |
| `/api/user/totp/confirm` | POST | Potwierdź 2FA |
| `/api/user/totp/verify` | POST | Weryfikuj 2FA |
| `/api/user/totp/disable` | POST | Wyłącz 2FA |
| `/api/user/audit-logs` | GET | Logi audytowe użytkownika |
| `/api/user/audit-logs/all` | GET | Wszystkie logi (admin) |
| `/api/user-connections` | GET | Połączenia OAuth |
| `/api/user-connections/{platform}/auth-url` | GET | URL autoryzacji OAuth |
| `/api/user-connections/{platform}/callback` | POST | Exchange OAuth code |
| `/api/auth/tidal/*` | Various | Tidal auth (PKCE) |

## Bezpieczeństwo

- Access token: krótkoterminowy (15 min)
- Refresh token: długoterminowy (7 dni)
- HTTPS wymagane w produkcji
- CORS skonfigurowany na backendzie
- Hasła nie przechowywane w localStorage (tokeny — tak)
- Auto-logout przy 401
- Auto-retry przy 429 (rate limiting)
- Correlation ID per request (X-Correlation-ID)
- TOTP 2FA opcjonalne
- Custom CAPTCHA + reCAPTCHA v3 (podwójna warstwa)
- Dynamiczne reguły haseł z backendu
