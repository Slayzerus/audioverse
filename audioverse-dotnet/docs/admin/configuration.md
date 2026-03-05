# ?? Konfiguracja systemu

Zarz?dzanie konfiguracj? systemu AudioVerse.

---

## System Configuration

### Encja SystemConfiguration

```
SystemConfiguration
??? Id: int
??? SessionTimeoutMinutes: int
??? CaptchaOption: CaptchaOption
??? MaxMicrophonePlayers: int
??? Active: bool
??? ModifiedAt: DateTime
??? ModifiedByUserId: int?
??? ModifiedByUsername: string
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/admin/system-config` | Pobierz konfiguracj? |
| `PUT` | `/api/admin/system-config` | Aktualizuj |

### Przyk?ad

```json
GET /api/admin/system-config

Response:
{
  "sessionTimeoutMinutes": 30,
  "captchaOption": "Type1",
  "maxMicrophonePlayers": 4,
  "active": true,
  "modifiedAt": "2026-02-15T10:00:00Z",
  "modifiedByUsername": "admin"
}
```

### Aktualizacja

```json
PUT /api/admin/system-config
{
  "sessionTimeoutMinutes": 60,
  "captchaOption": "Type2",
  "maxMicrophonePlayers": 8
}
```

---

## Scoring Presets

Presety konfiguracji systemu punktacji karaoke.

### Encja AdminScoringPreset

```
AdminScoringPreset
??? Id: int
??? DataJson: string
??? ModifiedAt: DateTime
??? ModifiedByUserId: int?
??? ModifiedByUsername: string
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/admin/scoring-presets` | Pobierz presety |
| `POST` | `/api/admin/scoring-presets` | Zapisz presety |

### Struktura DataJson

```json
{
  "easy": {
    "semitoneTolerance": 2,
    "preWindow": 0.25,
    "postExtra": 0.3,
    "difficultyMult": 0.9
  },
  "normal": {
    "semitoneTolerance": 1,
    "preWindow": 0.15,
    "postExtra": 0.2,
    "difficultyMult": 1.0
  },
  "hard": {
    "semitoneTolerance": 0,
    "preWindow": 0.08,
    "postExtra": 0.12,
    "difficultyMult": 1.05
  }
}
```

### Parametry

| Parametr | Opis |
|----------|------|
| `semitoneTolerance` | Tolerancja pó?tonów (0-2) |
| `preWindow` | Okno czasowe przed nut? (sekundy) |
| `postExtra` | Dodatkowy czas po nucie (sekundy) |
| `difficultyMult` | Mno?nik trudno?ci (0.9-1.1) |

---

## Dashboard

### API Endpoint

```json
GET /api/admin/dashboard

Response:
{
  "totalUsers": 150,
  "activeUsers": 45,
  "totalEvents": 23,
  "upcomingEvents": 5,
  "totalParties": 120,
  "activeParties": 3,
  "totalSongs": 5000,
  "recentLogins": [
    { "userId": 5, "username": "jan", "loginTime": "2026-02-15T10:00:00Z" }
  ],
  "recentAuditLogs": [
    { "action": "Login", "username": "jan", "timestamp": "2026-02-15T10:00:00Z" }
  ]
}
```

---

## OTP History

Historia wygenerowanych jednorazowych hase?.

### API Endpoint

```json
GET /api/admin/otp-history

Response:
{
  "success": true,
  "count": 15,
  "otps": [
    {
      "id": 1,
      "userId": 5,
      "createdAt": "2026-02-15T09:00:00Z",
      "expiresAt": "2026-02-15T09:15:00Z",
      "isUsed": true,
      "usedAt": "2026-02-15T09:05:00Z"
    }
  ]
}
```

---

## Konfiguracja appsettings.json

### Struktura

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=audioverse;Username=postgres;Password=postgres"
  },
  
  "Jwt": {
    "Key": "your-256-bit-secret-key",
    "Issuer": "AudioVerse",
    "Audience": "AudioVerseClients",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  
  "MinIO": {
    "Endpoint": "localhost:9000",
    "AccessKey": "minioadmin",
    "SecretKey": "minioadmin",
    "UseSSL": false
  },
  
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  
  "ArtNet": {
    "Enabled": true,
    "BroadcastAddress": "255.255.255.255",
    "Universe": 0
  },
  
  "Steam": {
    "ApiKey": "YOUR_STEAM_API_KEY"
  },
  
  "Email": {
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "Username": "noreply@audioverse.app",
    "Password": "password",
    "FromName": "AudioVerse",
    "FromEmail": "noreply@audioverse.app"
  },
  
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

---

## Zmienne ?rodowiskowe

| Zmienna | Opis |
|---------|------|
| `ASPNETCORE_ENVIRONMENT` | Development / Staging / Production |
| `ConnectionStrings__DefaultConnection` | Connection string do bazy |
| `Jwt__Key` | Klucz JWT |
| `MinIO__AccessKey` | MinIO access key |
| `MinIO__SecretKey` | MinIO secret key |
| `Steam__ApiKey` | Klucz API Steam |

### Przyk?ad Docker

```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  - ConnectionStrings__DefaultConnection=Host=db;Database=audioverse;Username=postgres;Password=secret
  - Jwt__Key=production-256-bit-secret-key
```

---

*Ostatnia aktualizacja: Luty 2026*
