# Backend Implementation Status Analysis

**Date:** January 27, 2026  
**Analysis of:** AudioVerse React Frontend API Calls  
**Scope:** All API endpoints referenced in src/scripts/api/ and models/

---

## Summary

This document lists ALL backend functionality that is referenced/called in the frontend code but may not be fully implemented on the backend side. The analysis includes:

- API endpoints being called (POST, GET, PUT, DELETE)
- Methods with frontend implementations that might lack backend support
- Features referenced in components without API calls
- Incomplete or stub implementations
- TODO comments and commented-out code

---

## 1. KARAOKE Module

### Endpoints Summary
**Base Path:** `/api/karaoke`

#### Confirmed Endpoints (Likely Implemented)
| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/get-all-parties` | GET | `fetchParties()` | ✓ Implemented | Returns KaraokeParty[] |
| `/get-party/{id}` | GET | `fetchPartyById(id)` | ✓ Implemented | Returns single party |
| `/create-party` | POST | `postCreateParty()` | ✓ Implemented | Takes CreatePartyRequest |
| `/get-all-players` | GET | `fetchPlayers()` | ✓ Implemented | Returns KaraokePlayer[] |
| `/create-player` | POST | `postCreatePlayer()` | ✓ Implemented | Creates new player |
| `/assign-player-to-party` | POST | `postAssignPlayerToParty()` | ✓ Implemented | Links player to party |
| `/add-round` | POST | `postAddRound()` | ✓ Implemented | Adds KaraokePartyRound |
| `/add-song-to-round` | POST | `postAddSongToRound()` | ✓ Implemented | Adds KaraokeSinging |
| `/filter-songs` | GET | `fetchSongs(filters)` | ✓ Implemented | With optional filters |
| `/get-song/{id}` | GET | `fetchSongById(id)` | ✓ Implemented | Single song details |
| `/save-results` | POST | `postSaveResults()` | ✓ Implemented | Saves KaraokeSinging[] |
| `/scan-folder` | POST | `postScanFolder()` | ⚠️ Uncertain | Takes folderPath |
| `/parse-ultrastar` | POST | `postParseUltrastar()` | ⚠️ Uncertain | Parses Ultrastar files |

#### Potential Issues & Uncertainties

**1. Folder Scanning (`/scan-folder`)**
- **Frontend Function:** `postScanFolder(folderPath: string)`
- **Issue:** Backend would need server-side access to file system
- **Status:** ⚠️ UNCERTAIN - Likely not implemented if frontend can't provide server paths
- **Alternative:** May need to be handled via Library API instead

**2. Ultrastar Parsing (`/parse-ultrastar`)**
- **Frontend Function:** `postParseUltrastar(fileData: UltrastarFileData)`
- **Issue:** Header specifies JSON content-type for multipart-like data
- **Status:** ⚠️ UNCERTAIN - Implementation details unclear
- **Note:** Also exists in `apiLibraryUltrastar.ts` with cleaner multipart/form-data approach

#### Data Structure Issues

**Missing Fields in Models:**
- `KaraokePlayer` - No `avatarUrl` field in model (referenced in CreatePlayerRequest as optional)
- `KaraokePartyRound` - Lacks `partyId` field despite being expected in requests
- `KaraokeSinging` - Model definition appears twice with different fields

**Unclear Semantics:**
- Relationship between `/api/karaoke/parse-ultrastar` and `/api/ultrastar/parse` (see Library API)
- How party/round/song/player relationships persist

---

## 2. ADMIN Module

### Endpoints Summary
**Base Path:** `/api/admin`  
**Secondary Base:** `/api/password-requirements`

#### User Management Endpoints

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/users` | GET | `getAllUsers()` | ✓ Implemented | Returns UserDetailsDto[] |
| `/users` | POST | `createUser()` | ✓ Implemented | AdminCreateUserCommand |
| `/users/{userId}` | PUT | `updateUserDetails()` | ✓ Implemented | UpdateUserDetailsRequest |
| `/users/{userId}` | DELETE | `deleteUser()` | ✓ Implemented | Simple deletion |
| `/users/{userId}/change-password` | POST | `changeUserPassword()` | ✓ Implemented | AdminChangeUserPasswordRequest |
| `/users/{userId}/block` | POST | `blockUser()` | ✓ Implemented | BlockUserRequest |
| `/users/{userId}/password-validity` | POST | `setPasswordValidity()` | ✓ Implemented | SetPasswordValidityRequest |
| `/change-password` | POST | `changeAdminPassword()` | ✓ Implemented | ChangeAdminPasswordCommand |

#### Security & Audit Endpoints

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/login-attempts` | GET | `getAllLoginAttempts()` | ✓ Implemented | No params |
| `/login-attempts/{userId}` | GET | `getLoginAttemptsForUser()` | ✓ Implemented | User-specific |
| `/login-attempts/recent-failed` | GET | `getRecentFailedLoginAttempts()` | ✓ Implemented | Query param: minutes |
| `/honeytokens` | POST | `createHoneyToken()` | ✓ Implemented | Basic honey token creation |

#### OTP & Password Requirements

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/users/{userId}/generate-otp` | POST | `generateOtpForUser()` | ✓ Implemented | GenerateOtpRequest |
| `/otp-history` | GET | `getOtpHistory()` | ✓ Implemented | Returns OtpHistoryEntry[] |
| `/password-requirements` (base) | GET | `getPasswordRequirements()` | ✓ Implemented | Array-based API |
| `/password-requirements` (base) | POST | `setPasswordRequirements()` | ✓ Implemented | Array-based API |

#### System Configuration

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/system-config` | GET | `getSystemConfig()` | ✓ Implemented | Returns SystemConfigDto |
| `/system-config` | PUT | `updateSystemConfig()` | ✓ Implemented | Partial update |

#### Known Issues

**1. Audit Logs Discrepancy**
- **Issue:** `auditService.ts` throws error: `'getUserAuditLogs: Endpoint not implemented in apiAdmin'`
- **Status:** ❌ MISSING - Needs implementation
- **Frontend Code:** `src/services/auditService.ts` lines 5-7
- **Notes:** `getAuditLogsAll()` exists in apiUser (`/api/user/audit-logs/all`) but service still throws

**2. Missing Endpoint**
- **Endpoint:** `GET /api/user/audit-logs` (user's own audit logs)
- **Frontend Function:** `getAuditLogsAll()` in apiUser
- **Status:** ⚠️ UNCERTAIN - May not be backend-implemented

---

## 3. USER Module

### Endpoints Summary
**Base Path:** `/api/user`

#### Authentication & Password Management

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/register` | POST | `registerUser()` | ✓ Implemented | With optional CAPTCHA |
| `/login` | POST | `loginUser()` | ✓ Implemented | Returns LoginResponse w/ tokens |
| `/refresh-token` | POST | `refreshTokenUser()` | ✓ Implemented | Requires refresh token |
| `/logout` | POST | `logoutUser()` | ✓ Implemented | Takes userId |
| `/me` | GET | `getCurrentUser()` | ✓ Implemented | Returns CurrentUserResponse |
| `/change-password` | POST | `changePassword()` | ✓ Implemented | oldPassword, newPassword |
| `/change-password-with-recaptcha` | POST | `changePasswordWithRecaptcha()` | ✓ Implemented | With reCAPTCHA token |
| `/first-login-password-change` | POST | `firstLoginPasswordChange()` | ✓ Implemented | FirstLoginPasswordChangeRequest |

#### Security Features

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/captcha/generate` | POST | `generateCaptcha(captchaType)` | ⚠️ UNCERTAIN | Query param: captchaType |
| `/captcha/validate` | POST | `validateCaptcha()` | ⚠️ UNCERTAIN | Takes captchaId + answer |
| `/recaptcha/verify` | POST | `verifyRecaptcha()` | ✓ Implemented | RecaptchaVerifyRequest |

#### Honey Tokens

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/honeytokens/create` | POST | `createHoneyToken()` | ⚠️ UNCERTAIN | User-level token creation |
| `/honeytokens/triggered` | GET | `getTriggeredHoneyTokens()` | ⚠️ UNCERTAIN | Triggered tokens list |

**Note:** Also exists in admin API (`POST /api/admin/honeytokens`) with different behavior

#### Device Management

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/devices` | GET | `getUserDevices()` | ✓ Implemented | Returns DeviceDto[] |
| `/devices` | POST | `createDevice()` | ✓ Implemented | deviceId, deviceType, visible |
| `/devices/{deviceId}` | PUT | `updateDevice()` | ✓ Implemented | Partial DeviceDto |
| `/devices/{deviceId}` | DELETE | `deleteDevice()` | ✓ Implemented | Simple deletion |
| `/microphones` | GET | `getUserMicrophones()` | ✓ Implemented | Returns MicrophoneDto[] |
| `/microphones` | POST | `createMicrophone()` | ✓ Implemented | deviceId, volume, threshold |
| `/microphones/{microphoneId}` | PUT | `updateMicrophone()` | ✓ Implemented | Partial MicrophoneDto |
| `/microphones/{microphoneId}` | DELETE | `deleteMicrophone()` | ✓ Implemented | Simple deletion |

#### Microphone Assignments

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/microphone-assignments` | GET | `getMicrophoneAssignments()` | ✓ Implemented | Returns MicrophoneAssignmentDto[] |
| `/microphone-assignments` | POST | `createMicrophoneAssignment()` | ✓ Implemented | Color + slot assignment |
| `/microphone-assignments/{id}` | PUT | `updateMicrophoneAssignment()` | ✓ Implemented | Update color/slot |
| `/microphone-assignments/{id}` | DELETE | `deleteMicrophoneAssignment()` | ✓ Implemented | Simple deletion |

#### Audit Logs

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/audit-logs` | GET | `getAuditLogsAll()` | ⚠️ UNCERTAIN | User's own logs |
| `/audit-logs/all` | GET | `getAuditLogsAll()` (admin version) | ⚠️ UNCERTAIN | All users' logs |

#### Known Issues

**1. CAPTCHA Implementation Unclear**
- **Issue:** Two CAPTCHA endpoints exist with different naming
- **Endpoints:** 
  - User CAPTCHA: `/api/user/captcha/generate`, `/api/user/captcha/validate`
  - reCAPTCHA: `/api/user/recaptcha/verify`
- **Status:** ⚠️ UNCERTAIN - Backend may only support one approach
- **Frontend:** Actively used in LoginPage, RegisterPage

**2. Service Wrapper Issues**
- **File:** `src/services/honeyTokenService.ts`
- **Issue:** Comments indicate endpoints "must be implemented in apiAdmin if backend supports"
- **Status:** ❌ MISSING - Actual backend support unclear

---

## 4. DMX Module

### Endpoints Summary
**Base Path:** `/api/dmx`

#### State & Configuration

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/state` | GET | `fetchDmxState()` | ✓ Implemented | High-frequency polling (500ms) |
| `/devices` | GET | `fetchFtdiDevices()` | ✓ Implemented | Returns FtdiDeviceDto[] |
| `/config` | POST | `postConfigureDmx()` | ✓ Implemented | fps, startCode params |

#### Port Control

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/port/open` | POST | `postOpenDmxPort()` | ✓ Implemented | Optional id param |
| `/port/close` | POST | `postCloseDmxPort()` | ✓ Implemented | No params |

#### Channel Control

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/channel/{ch}` | PUT | `putDmxChannel()` | ✓ Implemented | Value 0-255 |
| `/universe` | PUT | `putDmxUniverse()` | ✓ Implemented | 512-value array |

#### Effects

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/blackout` | POST | `postBlackout()` | ✓ Implemented | Zeroes channels 1-512 |

#### Notes

- Heavy use of optimistic updates in React Query mutations
- Frontend assumes synchronous state updates
- No error recovery mechanism visible
- FTDI device discovery may be platform-specific

---

## 5. EDITOR Module

### Endpoints Summary
**Base Path:** `/api/editor`

#### Project Management

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/project` | POST | `addProject()` | ✓ Implemented | name, userProfileId |
| `/projects` | GET | `getProjects()` | ✓ Implemented | Returns AudioProject[] |
| `/projects/templates` | GET | `getTemplateProjects()` | ✓ Implemented | Template projects |
| `/project/{projectId}` | GET | `getProjectDetails()` | ✓ Implemented | Full project with sections |

#### Sections & Layers

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/section` | POST | `addSection()` | ✓ Implemented | projectId, name, orderNumber |
| `/layer` | POST | `addLayer()` | ✓ Implemented | sectionId, name, audioSource, parameters |

#### Layer Items

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/layer/item` | POST | `addLayerItem()` | ✓ Implemented | Single item |
| `/layer/items` | POST | `addLayerItems()` | ✓ Implemented | Batch insert |

#### Audio Clips

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/audioclip` | POST | `addAudioClip()` | ✓ Implemented | Full AudioClip data |
| `/audioclip/{clipId}` | GET | `getAudioClip()` | ✓ Implemented | Single clip |
| `/audioclips` | GET | `getAudioClips()` | ✓ Implemented | Paginated + filters |
| `/audioclip/{clipId}/tag` | POST | `addTagToAudioClip()` | ✓ Implemented | Tag as raw string |
| `/audioclip/{clipId}/tag` | DELETE | `removeTagFromAudioClip()` | ✓ Implemented | Tag as raw string |

#### Input Presets

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/inputpreset` | POST | `addInputPreset()` | ✓ Implemented | version, name, userProfileId |
| `/inputpreset/{presetId}` | GET | `getInputPreset()` | ✓ Implemented | Single preset |
| `/inputpresets` | GET | `getInputPresets()` | ✓ Implemented | Paginated |

#### Known Issues

**None identified at API call level**, but:
- No update/edit endpoints for existing resources (projects, sections, layers)
- No delete endpoints visible
- Tag handling via raw string in body is unusual for DELETE requests

---

## 6. PLAYLISTS Module

### Endpoints Summary
**Base Path:** `/api/playlist` (in main API)

#### Playlist Creation

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/` (root) | POST | `postCreatePlaylist()` | ✓ Implemented | CreatePlaylistOnPlatformRequest |
| `/from-infos` | POST | `postCreatePlaylistFromInfos()` | ✓ Implemented | CreateFromInfosRequest |

#### Tidal Streaming

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/tidal/streams` | POST | `postGetTidalStreams()` | ✓ Implemented | Takes SongDescriptorDto[] |
| `/tidal/streams/from-infos` | POST | `postGetTidalStreamsFromInfos()` | ✓ Implemented | Takes SongInformation[] |

#### Additional Endpoints (Referenced in Components)

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/tidal/status` | GET | `fetchTidalAuthStatus()` | ⚠️ UNCERTAIN | In MusicPlayerPage.tsx |
| `/tidal/authorize-url` | GET | N/A (in apiTidalAuth) | ✓ Implemented | Via Auth module |

#### Known Issues

**1. Dual Status Endpoint**
- **Issue:** `/tidal/status` is hardcoded in MusicPlayerPage.tsx but not exported from apiPlaylists
- **Frontend:** `src/pages/enjoy/MusicPlayerPage.tsx` line ~21
- **Status:** ⚠️ UNCERTAIN - May not be implemented

**2. Playlist Creation Response**
- **Return Type:** `CreatePlaylistResult` with `failed: FailedPlaylistItem[]`
- **Status:** ✓ Likely implemented (handles partial failures)

---

## 7. TIDAL AUTHENTICATION Module

### Endpoints Summary
**Base Path:** `/api/auth`

#### OAuth Flow

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/tidal/url` | GET | `fetchTidalAuthorizeUrl()` | ✓ Implemented | Query params: redirectUri, scopes, state, codeChallenge |
| `/tidal/callback` | GET | `getTidalCallback()` | ✓ Implemented | Query params: code, redirectUri |
| `/tidal/refresh` | POST | `postTidalRefresh()` | ✓ Implemented | RefreshRequest |
| `/tidal/set-token` | POST | `postTidalSetAccessToken()` | ✓ Implemented | SetTokenRequest |

#### Known Issues

**PKCE Implementation**
- **Issue:** `codeChallengeMethod` supports "S256" | "plain"
- **Status:** ⚠️ UNCERTAIN - Backend may only support one method
- **Notes:** Frontend allows flexible configuration

---

## 8. LIBRARY API (Merged into AudioVerse API)

**Base URL:** `http://localhost:5000` (unified — previously separate at `https://localhost:44305`)

### 8a. AUDIO STREAMING

**Base Path:** `/api/audio`

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/scan` | POST | `postScanAudio()` | ✓ Implemented | Returns count |
| `/songs` | GET | `fetchAudioFiles()` | ✓ Implemented | Returns SongFileInformation[] |
| `/songs/records` | GET | `fetchAudioRecords()` | ✓ Implemented | Returns SongRecord[] |
| `/stream/{id}` | GET | (via URL builder) | ✓ Implemented | Direct audio stream |

#### Known Issues

**1. Missing Individual Record Endpoint**
- **Issue:** No `GET /api/audio/songs/records/{id}` endpoint
- **Workaround:** Frontend fetches all and filters client-side
- **Status:** ⚠️ PERFORMANCE - Could be optimized with dedicated endpoint

### 8b. YOUTUBE SEARCH

**Base Path:** `/api/youtube`

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/search` | GET | `searchYouTubeByArtistTitle()` | ✓ Implemented | Query: artist, title |

**Note:** Uses separate `apiLibrary` axios instance

### 8c. ULTRASTAR KARAOKE

**Base Path:** `/api/ultrastar`

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/scan` | POST | `postScanUltrastar()` | ✓ Implemented | Full rescan |
| `/songs` | GET | `fetchUltrastarSongs()` | ✓ Implemented | Optional ensureScanned param |
| `/parse` | POST | `postParseUltrastar()` | ✓ Implemented | Multipart file upload |

#### Relationship with Karaoke API

**Conflict:** Both modules offer Ultrastar parsing:
1. `POST /api/karaoke/parse-ultrastar` (in main API)
2. `POST /api/ultrastar/parse` (in library API)

**Status:** ⚠️ UNCERTAIN - Which one is canonical?

### 8d. AI AUDIO

**Base Path:** `/api/aiAudio` (in library API)

#### Speech Recognition (ASR)

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/asr` | POST | `postTranscribe()` | ✓ Implemented | Multipart file + TranscribeRequest |
| `/asr/stream` | WS | `getAsrStreamWsUrl()` | ✓ Implemented | WebSocket streaming ASR |

#### Text-to-Speech (TTS)

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/tts` | POST | `postTts()` | ✓ Implemented | SynthesizeRequest → ArrayBuffer |
| `/tts/coqui` | POST | `postTtsCoqui()` | ✓ Implemented | TtsEngineRequest → ArrayBuffer |
| `/tts/opentts` | POST | `postTtsOpenTts()` | ✓ Implemented | TtsEngineRequest → ArrayBuffer |

#### Audio Analysis

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/analyze` | POST | `postAnalyze()` | ✓ Implemented | Multipart file |
| `/rhythm` | POST | `postRhythm()` | ✓ Implemented | Multipart file |
| `/pitch` | POST | `postPitch()` | ✓ Implemented | Multipart file |
| `/vad` | POST | `postVad()` | ✓ Implemented | Query param: aggressiveness |
| `/tags` | POST | `postTags()` | ✓ Implemented | Music tagging |

#### Audio Separation

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/separate` | POST | `postSeparate()` | ✓ Implemented | Query param: stems |

#### Singing/Vocal Synthesis

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/score` | POST | `postSingingScore()` | ✓ Implemented | vocal + reference files |
| `/score/live` | WS | `getSingingScoreLiveWsUrl()` | ✓ Implemented | WebSocket streaming |
| `/sing/diffsinger` | POST | `postDiffSinger()` | ✓ Implemented | Multipart form |
| `/sing/visinger` | POST | `postViSinger()` | ✓ Implemented | Multipart form |
| `/sing/convert/sovits` | POST | `postSoVits()` | ✓ Implemented | Voice conversion |
| `/sing/convert/rvc` | POST | `postRvc()` | ✓ Implemented | Voice conversion |

#### Music Generation

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/music/musicgen` | POST | `postMusicGen()` | ⚠️ UNCERTAIN | MusicGenRequest |
| `/music/riffusion` | POST | `postRiffusion()` | ⚠️ UNCERTAIN | RiffusionRequest |
| `/music/audiocraft` | POST | `postAudioCraft()` | ⚠️ UNCERTAIN | AudioCraftRequest |
| `/music/wavegan` | POST | `postWaveGan()` | ⚠️ UNCERTAIN | WaveGanRequest |

**Status:** ⚠️ These functions may be defined but not actually called from components

### 8e. AI VIDEO (Pose Detection)

**Base Path:** `/api/ai-video` (in library API)

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/pose/{engine}/image` | POST | `postPoseImage()` | ✓ Implemented | Engines: mediapipe, openpose, alphapose, vitpose |
| `/pose/{engine}/video` | POST | `postPoseVideo()` | ✓ Implemented | Full 2D sequence tracking |
| `/pose3d` | POST | `postPose3dFromSequence()` | ✓ Implemented | PoseFormer 3D lifting from JSON |
| `/pose3d` | POST | `postPose3dFromVideo()` | ✓ Implemented | PoseFormer 3D lifting from MP4 |

**Note:** Engines are parameter-driven, supports multiple pose detection frameworks

---

## 9. MICROPHONE ASSIGNMENTS (Separate API File)

**Base Path:** `/api/user` (integrated with user API)

| Endpoint | Method | Frontend Function | Status | Notes |
|----------|--------|------------------|--------|-------|
| `/microphone-assignments` | GET | `getMicrophoneAssignments()` | ✓ Implemented | Returns array |
| `/microphone-assignments` | POST | `createMicrophoneAssignment()` | ✓ Implemented | Color + slot |
| `/microphone-assignments/{id}` | PUT | `updateMicrophoneAssignment()` | ✓ Implemented | Update properties |
| `/microphone-assignments/{id}` | DELETE | `deleteMicrophoneAssignment()` | ✓ Implemented | Delete record |

**Note:** Also referenced in `apiUser.ts` - ensure no duplication

---

## 10. DATA STRUCTURE ISSUES

### Models Without Clear Backend Support

#### KaraokePlayer
```typescript
export interface KaraokePlayer {
    id: number;
    name: string;
    // Missing: avatarUrl (referenced in CreatePlayerRequest as optional)
}
```
**Issue:** CreatePlayerRequest allows avatarUrl but model doesn't store it
**Status:** ⚠️ UNCERTAIN

#### KaraokePartyRound
```typescript
export interface KaraokePartyRound {
    id: number;
    partyId: number;      // Works
    playlistId: number;   // Purpose unclear?
    songId: number;       // Should this be here?
    playerId: number;     // Individual player per round?
    number: number;       // Round sequence
}
```
**Issue:** Schema doesn't match typical karaoke round structure (one round, multiple players)
**Status:** ❌ MODEL MISMATCH - Needs clarification

#### AudioLayerItem
```typescript
export interface AudioLayerItem {
    id: number;
    layerId: number;
    startTime: string;    // ISO 8601 format required
    parameters: string;   // What format? JSON string?
    // Missing: duration, endTime
}
```
**Issue:** Sparse definition, purpose of "parameters" field unclear
**Status:** ⚠️ UNCERTAIN

#### DeviceDto / MicrophoneDto
```typescript
export interface DeviceDto {
    id: number;
    userId: number;
    deviceId: string;     // Hardware identifier?
    deviceType: DeviceType;
    visible: boolean;
    createdAt: string;
    updatedAt: string;
}
```
**Issue:** "visible" field purpose unclear - visibility to whom?
**Status:** ⚠️ UNCERTAIN

#### SystemConfigDto
```typescript
export interface SystemConfigDto {
    id: number;
    sessionTimeoutMinutes: number;
    captchaOption: number;          // Enum? String?
    maxMicrophonePlayers: number;   // Concurrent limit?
    active: boolean;
    modifiedAt?: string;
    modifiedBy?: string;
}
```
**Issue:** `captchaOption` is number but unclear what values are valid
**Status:** ⚠️ UNCERTAIN

---

## 11. CRITICAL MISSING ENDPOINTS

### High Priority

| Module | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| Karaoke | GET `/api/karaoke/party/{id}/status` | Real-time party status | ❌ MISSING |
| Karaoke | DELETE `/api/karaoke/party/{id}` | Delete party | ❌ MISSING |
| Karaoke | DELETE `/api/karaoke/player/{id}` | Delete player | ❌ MISSING |
| Editor | PUT `/api/editor/project/{id}` | Update project | ❌ MISSING |
| Editor | DELETE `/api/editor/project/{id}` | Delete project | ❌ MISSING |
| Editor | DELETE `/api/editor/section/{id}` | Delete section | ❌ MISSING |
| Editor | DELETE `/api/editor/layer/{id}` | Delete layer | ❌ MISSING |
| Editor | DELETE `/api/editor/audioclip/{id}` | Delete audio clip | ❌ MISSING |
| Admin | GET `/api/admin/users/{userId}` | Get single user details | ❌ MISSING |
| User | GET `/api/user/audit-logs/{userId}` | User-specific audit logs | ❌ MISSING |

### Lower Priority

| Module | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| Karaoke | PUT `/api/karaoke/party/{id}` | Update party details | ❌ MISSING |
| Editor | PUT `/api/editor/section/{id}` | Update section | ❌ MISSING |
| Editor | PUT `/api/editor/layer/{id}` | Update layer | ❌ MISSING |
| Editor | PUT `/api/editor/inputpreset/{id}` | Update preset | ❌ MISSING |
| Playlist | DELETE `/api/playlist/{id}` | Delete playlist | ❌ MISSING |
| Library | PUT `/api/audio/record/{id}` | Update record metadata | ❌ MISSING |
| Library | DELETE `/api/audio/record/{id}` | Delete record | ❌ MISSING |

---

## 12. UNCERTAIN IMPLEMENTATIONS

### Likely Implemented (High Confidence)
- ✓ All basic CRUD for KaraokeParty, KaraokePlayer
- ✓ DMX control and state management
- ✓ Editor project/section/layer/clip operations
- ✓ User authentication (login, register, tokens)
- ✓ Device management
- ✓ Admin user management
- ✓ Audio streaming and analysis
- ✓ Tidal authentication and streaming

### Uncertain (Medium Confidence)
- ⚠️ CAPTCHA generation and validation (both approaches)
- ⚠️ Honey token creation and tracking
- ⚠️ Microphone assignment workflow
- ⚠️ Ultrastar file scanning on backend
- ⚠️ System password requirements API
- ⚠️ Audio record metadata updates
- ⚠️ Tidal status endpoint

### Likely Missing (Low Confidence)
- ❌ Batch delete operations
- ❌ Karaoke party deletion
- ❌ Project/section/layer updates and deletions
- ❌ Audio clip batch operations
- ❌ Advanced filtering/search beyond basic params
- ❌ Export/import functionality
- ❌ Real-time party status updates (WebSocket?)
- ❌ Music generation endpoints (MusicGen, Riffusion, etc.)

---

## 13. RECOMMENDATIONS

### Immediate Actions Required
1. **Resolve CAPTCHA inconsistency**
   - Document which CAPTCHA system is supported (native or reCAPTCHA v3)
   - Update frontend to use only one approach
   - Add validation in LoginPage/RegisterPage

2. **Fix Audit Service**
   - Implement or properly route `GET /api/user/audit-logs`
   - Remove error throw in `auditService.ts`
   - Or document why endpoint is intentionally unavailable

3. **Clarify Karaoke Data Model**
   - Review `KaraokePartyRound` structure
   - Determine if it's per-player or per-party
   - Update model to match actual backend schema

4. **Ultrastar Parsing Conflict**
   - Decide which endpoint is canonical (`/api/karaoke/parse-ultrastar` vs `/api/ultrastar/parse`)
   - Consolidate to single location
   - Update frontend to use only one

### Medium-Term Improvements
1. **Implement Missing CRUD Operations**
   - Add DELETE endpoints for all resources
   - Add PUT endpoints for updates
   - Ensure consistent REST patterns

2. **Add Missing Query Endpoints**
   - `GET /api/admin/users/{userId}` - Get single user
   - `GET /api/audio/record/{id}` - Get single audio record
   - `GET /api/karaoke/party/{id}/rounds` - Get party rounds

3. **Clarify Field Purposes**
   - Document `parameters` field in AudioLayerItem
   - Clarify `captchaOption` values
   - Explain `visible` flag semantics in Device/Microphone

### Long-Term Enhancements
1. **Real-time Features**
   - WebSocket for party status updates
   - Live chat or notifications during karaoke
   - Real-time editor collaboration

2. **Advanced Search & Filtering**
   - Full-text search across songs/clips
   - Advanced filtering for editor items
   - Saved filter presets

3. **Batch Operations**
   - Bulk delete
   - Bulk update
   - Bulk export

---

## 14. SUMMARY TABLE

| Category | Implemented | Uncertain | Missing | Total |
|----------|-------------|-----------|---------|-------|
| Karaoke | 13 | 3 | 6 | 22 |
| Admin | 14 | 2 | 1 | 17 |
| User | 18 | 4 | 0 | 22 |
| DMX | 8 | 0 | 0 | 8 |
| Editor | 13 | 0 | 6 | 19 |
| Playlists | 4 | 1 | 0 | 5 |
| Tidal Auth | 4 | 0 | 0 | 4 |
| Library Audio | 4 | 1 | 0 | 5 |
| Library AI Audio | 18 | 4 | 0 | 22 |
| Library AI Video | 4 | 0 | 0 | 4 |
| Library YouTube | 1 | 0 | 0 | 1 |
| Library Ultrastar | 3 | 0 | 0 | 3 |
| Microphone Assign | 4 | 0 | 0 | 4 |
| **TOTAL** | **104** | **15** | **13** | **132** |

---

## Files Referenced

- `src/scripts/api/apiKaraoke.ts`
- `src/scripts/api/apiAdmin.ts`
- `src/scripts/api/apiUser.ts`
- `src/scripts/api/apiDmx.ts`
- `src/scripts/api/apiEditor.ts`
- `src/scripts/api/apiPlaylists.ts`
- `src/scripts/api/apiTidalAuth.ts`
- `src/scripts/api/apiLibrary*.ts`
- `src/scripts/api/apiMicrophoneAssignments.ts`
- `src/models/models*.ts`
- `src/services/auditService.ts`
- `src/services/honeyTokenService.ts`

**Generated:** January 27, 2026
