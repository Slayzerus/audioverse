# ?? Autoryzacja

System autoryzacji w AudioVerse oparty na JWT i OpenIddict.

---

## Przegl?d

| Mechanizm | Opis |
|-----------|------|
| **JWT** | Access tokens i refresh tokens |
| **OpenIddict** | OAuth2 / OpenID Connect |
| **Role-based** | Autoryzacja na podstawie ról |
| **Policy-based** | Niestandardowe polityki |

---

## Logowanie

### Standardowe logowanie

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jan@example.com",
  "password": "SecurePass123!"
}
```

### Odpowied?

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 900,
  "user": {
    "id": 5,
    "userName": "jan.kowalski",
    "email": "jan@example.com",
    "roles": ["User"]
  }
}
```

---

## Od?wie?anie tokenu

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

### Odpowied?

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "bmV3IHJlZnJlc2ggdG9r...",
  "expiresIn": 900
}
```

---

## Struktura JWT

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload

```json
{
  "sub": "5",
  "id": "5",
  "username": "jan.kowalski",
  "email": "jan@example.com",
  "role": "User",
  "iat": 1739500000,
  "exp": 1739500900,
  "iss": "AudioVerse",
  "aud": "AudioVerseClients"
}
```

---

## U?ycie tokenu

### Nag?ówek HTTP

```http
GET /api/karaoke/parties
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### SignalR

```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/karaoke", {
    accessTokenFactory: () => accessToken
  })
  .build();
```

---

## Role

| Rola | Opis | Uprawnienia |
|------|------|-------------|
| `User` | Podstawowy u?ytkownik | Tworzenie imprez, do??czanie |
| `Organizer` | Organizator wydarze? | Zarz?dzanie wydarzeniami |
| `Moderator` | Moderator | Zarz?dzanie tre?ciami |
| `Admin` | Administrator | Pe?ny dost?p |

### Hierarchia

```
Admin > Moderator > Organizer > User
```

---

## Atrybuty autoryzacji

### W kontrolerach

```csharp
// Wymaga zalogowanego u?ytkownika
[Authorize]
public class KaraokeController : ControllerBase

// Wymaga konkretnej roli
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase

// Wymaga jednej z ról
[Authorize(Roles = "Admin,Moderator")]
public IActionResult ModerateContent()

// Polityka niestandardowa
[Authorize(Policy = "CanManageEvents")]
public IActionResult ManageEvent()
```

---

## Polityki

### Konfiguracja

```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageEvents", policy =>
        policy.RequireRole("Admin", "Organizer"));
    
    options.AddPolicy("CanModerate", policy =>
        policy.RequireRole("Admin", "Moderator"));
    
    options.AddPolicy("MustBeEventOwner", policy =>
        policy.Requirements.Add(new EventOwnerRequirement()));
});
```

### Custom Requirement

```csharp
public class EventOwnerRequirement : IAuthorizationRequirement { }

public class EventOwnerHandler : AuthorizationHandler<EventOwnerRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        EventOwnerRequirement requirement)
    {
        var userId = context.User.FindFirst("id")?.Value;
        var eventId = // pobierz z kontekstu
        
        if (IsEventOwner(userId, eventId))
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}
```

---

## OTP (Jednorazowe has?o)

### Wygenerowanie przez admina

```http
POST /api/admin/users/5/generate-otp
Authorization: Bearer {admin_token}
```

### Odpowied?

```json
{
  "success": true,
  "otp": "A1B2C3D4",
  "expiresAt": "2026-02-15T12:00:00Z"
}
```

### Logowanie z OTP

```http
POST /api/auth/login-otp
Content-Type: application/json

{
  "userId": 5,
  "otp": "A1B2C3D4"
}
```

---

## Logowanie jako go??

```http
POST /api/auth/guest
Content-Type: application/json

{
  "displayName": "Go??123"
}
```

### Odpowied?

```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "guestId": "guest_abc123",
  "expiresIn": 86400
}
```

Tokeny go?ci:
- Wa?ne 24h
- Ograniczone uprawnienia
- Nie mog? tworzy? wydarze?

---

## OpenIddict (OAuth2)

### Konfiguracja

```csharp
services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
            .UseDbContext<AudioVerseDbContext>();
    })
    .AddServer(options =>
    {
        options.SetTokenEndpointUris("/connect/token")
            .SetAuthorizationEndpointUris("/connect/authorize");
        
        options.AllowPasswordFlow()
            .AllowRefreshTokenFlow();
        
        options.RegisterScopes(
            OpenIddictConstants.Scopes.Email,
            OpenIddictConstants.Scopes.Profile,
            OpenIddictConstants.Scopes.Roles);
    });
```

### Token endpoint

```http
POST /connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&
username=jan@example.com&
password=SecurePass123!&
scope=openid profile email
```

---

## Zewn?trzni dostawcy

### Spotify

```http
GET /api/auth/external/spotify
```

Przekierowuje do Spotify OAuth. Po autoryzacji wraca z tokenem.

### Obs?ugiwani dostawcy

| Dostawca | Scope |
|----------|-------|
| Spotify | user-read-email, user-library-read |
| Tidal | (w przygotowaniu) |
| Google | email, profile |

---

## Middleware JWT

```csharp
public class JwtMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();
        
        if (token != null)
        {
            await AttachUserToContext(context, token);
        }
        
        await _next(context);
    }
}
```

---

## B??dy autoryzacji

| Kod | Opis |
|-----|------|
| `401` | Brak tokenu lub token niewa?ny |
| `403` | Brak uprawnie? do zasobu |

### Przyk?ad odpowiedzi

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": ["Token expired"]
}
```

---

## Konfiguracja

### appsettings.json

```json
{
  "Jwt": {
    "Key": "your-256-bit-secret-key-minimum-32-characters",
    "Issuer": "AudioVerse",
    "Audience": "AudioVerseClients",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Zalecenia bezpiecze?stwa

1. **Klucz JWT** — minimum 256 bitów (32 znaki)
2. **HTTPS** — zawsze u?ywaj HTTPS w produkcji
3. **Krótki czas ?ycia** — access token 15-30 minut
4. **Secure cookies** — dla refresh token
5. **Token rotation** — nowy refresh token przy od?wie?eniu

---

*Ostatnia aktualizacja: Luty 2026*
