# ?? Bezpiecze?stwo

Funkcje bezpiecze?stwa i audytu w AudioVerse.

---

## Przegl?d funkcji

| Funkcja | Opis |
|---------|------|
| **Audit Log** | Historia wszystkich dzia?a? |
| **Captcha** | Ochrona przed botami |
| **Honey Tokens** | Wykrywanie w?ama? |
| **Session Timeout** | Automatyczne wylogowanie |
| **Profanity Filter** | Filtr wulgaryzmów |
| **Rate Limiting** | Ograniczanie ??da? |

---

## Audit Log

### Encja AuditLog

```
AuditLog
??? Id: int
??? UserId: int?
??? Username: string
??? Action: string
??? Description: string
??? Success: bool
??? ErrorMessage: string?
??? DetailsJson: string?
??? IpAddress: string?
??? Timestamp: DateTime
??? User: UserProfile?
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/admin/audit-logs` | Lista logów |
| `GET` | `/api/admin/audit-logs?userId={id}` | Logi u?ytkownika |
| `GET` | `/api/admin/audit-logs?action={action}` | Filtr po akcji |

### Przyk?ad logu

```json
{
  "id": 123,
  "userId": 5,
  "username": "jan.kowalski",
  "action": "DeleteUser",
  "description": "Admin usun?? u?ytkownika ID: 10",
  "success": true,
  "timestamp": "2026-02-15T10:30:00Z",
  "ipAddress": "192.168.1.100"
}
```

### Logowane akcje

| Akcja | Opis |
|-------|------|
| `Login` | Logowanie |
| `Logout` | Wylogowanie |
| `PasswordChange` | Zmiana has?a |
| `CreateUser` | Utworzenie u?ytkownika |
| `DeleteUser` | Usuni?cie u?ytkownika |
| `BanUser` | Zbanowanie |
| `GenerateOTP` | Wygenerowanie OTP |
| `SaveScoringPresets` | Zmiana presetów punktacji |
| `SystemConfigUpdate` | Zmiana konfiguracji |

---

## Captcha

### Typy captcha

| Typ | Opis |
|-----|------|
| `Type1` | Przepisz tekst z obrazka |
| `Type2` | Rozwi?? równanie matematyczne |
| `Type3` | Wybierz pasuj?ce obrazki |
| `Disabled` | Wy??czona |

### Konfiguracja

```json
PUT /api/admin/system-config
{
  "captchaOption": "Type1"
}
```

### Encja Captcha

```
Captcha
??? Id: int
??? Code: string
??? ImageBase64: string
??? CreatedAt: DateTime
??? ExpiresAt: DateTime
??? IsUsed: bool
```

---

## Honey Tokens

### Opis

Honey tokens to fa?szywe tokeny umieszczone w systemie, które przy próbie u?ycia sygnalizuj? w?amanie.

### Encja HoneyToken

```
HoneyToken
??? Id: int
??? Token: string
??? Type: string (API_KEY, SESSION, etc.)
??? Description: string
??? CreatedAt: DateTime
??? LastAccessedAt: DateTime?
??? AccessCount: int
??? IsTriggered: bool
```

### Reakcja na trigger

Gdy honey token zostanie u?yty:
1. Zapis do audit log
2. Alert email do administratora
3. Opcjonalne zablokowanie IP

---

## Session Timeout

### Konfiguracja

```json
PUT /api/admin/system-config
{
  "sessionTimeoutMinutes": 30
}
```

### Middleware

```csharp
public class SessionTimeoutMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var lastActivity = GetLastActivity(context);
        var timeout = GetSessionTimeout();
        
        if (DateTime.UtcNow - lastActivity > timeout)
        {
            // Wymu? ponowne logowanie
            context.Response.StatusCode = 401;
            return;
        }
        
        UpdateLastActivity(context);
        await _next(context);
    }
}
```

---

## Profanity Filter

### Middleware

```csharp
public class ProfanityMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method == "POST" || context.Request.Method == "PUT")
        {
            var body = await ReadBody(context);
            if (ContainsProfanity(body))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsJsonAsync(new 
                { 
                    error = "Content contains inappropriate language" 
                });
                return;
            }
        }
        
        await _next(context);
    }
}
```

### S?ownik

S?ownik wulgaryzmów jest konfigurowalny i wspiera:
- Polskie wulgaryzmy
- Angielskie wulgaryzmy
- Warianty z literami zamienionymi (np. @ zamiast a)

---

## Próby logowania

### Encja LoginAttempt

```
LoginAttempt
??? Id: int
??? UserId: int?
??? Username: string
??? Success: bool
??? AttemptTime: DateTime
??? IpAddress: string
```

### Wykrywanie brute force

```json
GET /api/admin/login-attempts/recent-failed?minutes=15

Response:
{
  "timeWindowMinutes": 15,
  "totalFailedAttempts": 47,
  "uniqueUsersAffected": 3,
  "suspiciousActivity": [
    {
      "username": "admin",
      "failedAttempts": 25,
      "lastAttempt": "2026-02-15T10:45:00Z",
      "ipAddresses": ["192.168.1.50", "10.0.0.5"]
    }
  ]
}
```

### Automatyczne blokowanie

Po 5 nieudanych próbach w ci?gu 15 minut:
- Konto blokowane na 15 minut
- Alert do administratora
- Log w audit log

---

## JWT Configuration

### appsettings.json

```json
{
  "Jwt": {
    "Key": "your-256-bit-secret-key-here",
    "Issuer": "AudioVerse",
    "Audience": "AudioVerseClients",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Token Claims

```json
{
  "sub": "5",
  "id": "5",
  "username": "jan.kowalski",
  "email": "jan@example.com",
  "role": "User",
  "iat": 1739500000,
  "exp": 1739500900
}
```

---

## Historia hase?

### Encja PasswordHistory

```
PasswordHistory
??? Id: int
??? UserProfileId: int
??? PasswordHash: string
??? CreatedAt: DateTime
```

### Polityka

- Ostatnie 5 hase? jest zapami?tywanych
- U?ytkownik nie mo?e u?y? tego samego has?a ponownie

---

## Zg?oszenia nadu?y?

### Encja AbuseReport

```
AbuseReport
??? Id: int
??? ReporterId: int
??? ReportedUserId: int?
??? ReportedContentId: int?
??? ContentType: string
??? Reason: string
??? Description: string
??? Status: ReportStatus (Pending, Reviewed, Resolved, Dismissed)
??? ResolvedByUserId: int?
??? Resolution: string?
??? CreatedAt: DateTime
??? ResolvedAt: DateTime?
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/moderation/reports` | Zg?o? nadu?ycie |
| `GET` | `/api/moderation/reports` | Lista zg?osze? (admin) |
| `PUT` | `/api/moderation/reports/{id}/resolve` | Rozwi?? zg?oszenie |

---

*Ostatnia aktualizacja: Luty 2026*
