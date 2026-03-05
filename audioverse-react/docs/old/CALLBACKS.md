# Backend OAuth Callback Endpoints

Poniżej opisane są endpointy i obsługa callbacków dla integracji z zewnętrznymi serwisami (Spotify, Twitch, Google, YouTube, Tidal, Microsoft, Discord).

---

## Endpointy do dodania

### 1. Authorization URL

```
GET /api/user/connections/{platform}/auth-url?redirectUri=...&scopes=...
```
- Zwraca URL do przekierowania użytkownika na stronę autoryzacji danego serwisu.
- Obsługiwane platformy: `spotify`, `tidal`, `google`, `youtube`, `discord`, `twitch`, `microsoft`, `steam`, `bgg`

### 2. OAuth Callback

```
POST /api/user/connections/{platform}/callback
Body: {
  code: string,
  redirectUri: string,
  state?: string
}
```
- Wywoływany przez frontend po powrocie z autoryzacji (z parametrem `code`).
- Obsługuje wymianę kodu na token, pobranie profilu użytkownika i zapisanie połączenia.

---

## Obsługa platform

### Spotify
- Wymiana kodu na token przez `ISpotifyService.AuthenticateWithAuthCodeAsync()`
- Pobranie profilu przez `GetCurrentUserAsync()`
- Zapisanie połączenia w bazie

### Tidal
- Wymiana kodu na token przez `ITidalService.AuthenticateWithAuthCodeAsync()`
- Pobranie profilu przez `GetCurrentUserAsync()`
- Zapisanie połączenia w bazie

### Google / YouTube
- Wymiana kodu na token przez `POST https://oauth2.googleapis.com/token`
- Pobranie profilu przez `GET https://www.googleapis.com/oauth2/v2/userinfo`
- Zapisanie połączenia w bazie

### Discord
- Wymiana kodu na token przez `POST https://discord.com/api/oauth2/token`
- Pobranie profilu przez `GET https://discord.com/api/users/@me`
- Zapisanie połączenia w bazie

### Twitch
- Wymiana kodu na token przez `POST https://id.twitch.tv/oauth2/token`
- Pobranie profilu przez `GET https://api.twitch.tv/helix/users` (wymaga header `Client-Id`)
- Zapisanie połączenia w bazie

### Microsoft
- Wymiana kodu na token przez `POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- Pobranie profilu przez `GET https://graph.microsoft.com/v1.0/me`
- Zapisanie połączenia w bazie

---

## Wymagane zmienne środowiskowe

- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `TIDAL_CLIENT_ID`, `TIDAL_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`

---

## Przykład obsługi callbacka (pseudo-code)

```
POST /api/user/connections/{platform}/callback

switch(platform) {
  case 'spotify':
    // Wymiana kodu na token, pobranie profilu, zapis
    break;
  case 'tidal':
    // Analogicznie
    break;
  case 'google':
  case 'youtube':
    // Wymiana kodu na token, pobranie profilu, zapis
    break;
  case 'discord':
    // Wymiana kodu na token, pobranie profilu, zapis
    break;
  case 'twitch':
    // Wymiana kodu na token, pobranie profilu, zapis
    break;
  case 'microsoft':
    // Wymiana kodu na token, pobranie profilu, zapis
    break;
  // ...inne platformy
}
```

---

## Redirect URI do rejestracji w dev portalach

| Platform   | Redirect URI                                 |
|------------|----------------------------------------------|
| Spotify    | https://www.audioverse.io/spotifyCallback    |
| Twitch     | https://www.audioverse.io/twitchCallback     |
| Google     | https://www.audioverse.io/googleCallback     |
| YouTube    | https://www.audioverse.io/youtubeCallback    |
| Tidal      | https://www.audioverse.io/tidalCallback      |
| Microsoft  | https://www.audioverse.io/microsoftCallback  |
| Discord    | https://www.audioverse.io/discordCallback    |

---

## Dodatkowe uwagi
- Steam i BGG mają osobne flow (Steam: OpenID, BGG: username-based)
- Jeśli dodasz Apple, Facebook, BoardGameGeek, sprawdź czy mają OAuth i dodaj analogiczne endpointy
- Każdy callback powinien zapisywać/aktualizować połączenie w bazie (UserExternalAccount)
