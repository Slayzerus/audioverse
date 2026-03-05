# Backend API Inventory & Implementation Status

**Last Updated:** January 27, 2026  
**Total Endpoints:** 132+ (104 likely implemented, 15 uncertain, 13 missing)

## 📊 Summary by Module

| Module | Endpoints | Status | Notes |
|--------|-----------|--------|-------|
| **Karaoke** | 18 | 70% | Missing DELETE/UPDATE, needs round improvements |
| **User/Auth** | 28 | 90% | CAPTCHA system needs clarification |
| **Admin** | 22 | 80% | Audit service broken, OTP implementation uncertain |
| **DMX** | 12 | 95% | Well-implemented |
| **Editor** | 18 | 75% | Missing DELETE operations |
| **Library** | 12 | 85% | Multiple sources, YouTube integration working |
| **Playlists** | 8 | 80% | Tidal integration uncertain |
| **Devices** | 8 | 85% | Needs microphone assignment improvements |
| **AI Audio** | 12 | 85% | TTS, transcription, analysis partially working |
| **AI Video** | 6 | 70% | Pose detection needs backend validation |

---

## 🎤 KARAOKE MODULE (`/api/karaoke`)

### Implemented ✅
- `GET /get-all-parties` - Get all karaoke parties
- `GET /get-party/{id}` - Get party by ID
- `POST /create-party` - Create new party
- `GET /get-all-players` - Get all players
- `POST /create-player` - Create player
- `POST /assign-player-to-party` - Assign player to party
- `POST /add-round` - Add round to party
- `POST /add-song-to-round` - Add song to round
- `GET /filter-songs` - Filter songs with criteria
- `GET /get-song/{id}` - Get song details
- `POST /save-results` - Save singing results
- `POST /scan-folder` - Scan folder for karaoke files
- `POST /parse-ultrastar` - Parse Ultrastar files
- `POST /parse-ultrastar-json` - Parse Ultrastar JSON
- `GET /get-cover` - Get song cover image
- `GET /get-background` - Get background image

### Missing or Uncertain ❌
- `DELETE /party/{id}` - Delete party
- `DELETE /player/{id}` - Delete player
- `PUT /party/{id}` - Update party
- `PUT /round/{id}` - Update round
- `DELETE /round/{id}` - Delete round
- `GET /party/{id}/rounds` - Get rounds for party
- `GET /round/{id}/songs` - Get songs in round
- `GET /party/{id}/status` - Real-time party status
- `POST /export-results` - Export results to file
- `GET /statistics` - Get party statistics

### Issues 🔴
1. **KaraokePartyRound structure unclear** - Doesn't follow typical karaoke round architecture
2. **Ultrastar parsing duplication** - Two endpoints with similar functionality
3. **No update operations** - Can't modify party/player after creation
4. **Results handling** - `save-results` behavior undefined (what about scoring?)
5. **Singing data structure missing** - How are individual performances tracked?

---

## 👤 USER & AUTHENTICATION (`/api/user`, `/api/auth`)

### Implemented ✅
- `POST /register` - User registration
- `POST /login` - User login
- `POST /login-oauth` - OAuth login (Google, GitHub, etc.)
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - User logout
- `POST /change-password` - Change password (authenticated)
- `POST /change-password-with-recaptcha` - Change password with reCAPTCHA
- `POST /first-login-password-change` - Force change on first login
- `POST /captcha/generate` - Generate CAPTCHA for login
- `POST /captcha/validate` - Validate CAPTCHA
- `POST /recaptcha/verify` - Verify reCAPTCHA v3
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /devices` - List user devices (microphones, etc.)
- `POST /devices` - Add device
- `PUT /devices/{id}` - Update device
- `DELETE /devices/{id}` - Delete device
- `POST /honeytokens/create` - Create honey token
- `GET /honeytokens/triggered` - Get triggered honey tokens
- `GET /honeytokens/history` - Get honey token history
- `POST /audit-logs/my` - Get user's audit logs
- `POST /sessions/list` - Get active sessions
- `POST /sessions/revoke/{id}` - Revoke session
- `POST /mfa/setup` - Setup MFA
- `POST /mfa/verify` - Verify MFA code

### Uncertain ⚠️
- `POST /request-password-reset` - Password reset flow
- `POST /reset-password` - Complete password reset
- `GET /profile/preferences` - User preferences
- `PUT /profile/preferences` - Update preferences
- `POST /export-data` - GDPR data export
- `POST /delete-account` - Account deletion
- `GET /security-questions` - Get security questions

### Issues 🔴
1. **CAPTCHA System Conflict** - Native CAPTCHA AND reCAPTCHA v3 both defined
   - Which one is actually used?
   - Are they both implemented?
   - Different security levels expected
2. **Honey Token Duplication** - Created by both user AND admin endpoints
3. **Password Reset** - No clear endpoint for initiating reset
4. **MFA Support** - Referenced in models but uncertain if implemented
5. **Session Management** - Revoke endpoint might not exist
6. **GDPR Features** - Data export/deletion may not be implemented

---

## ⚙️ ADMIN MODULE (`/api/admin`, `/api/password-requirements`)

### Implemented ✅
- `GET /login-attempts` - Get all login attempts
- `GET /login-attempts/{userId}` - Get user's login attempts
- `GET /login-attempts/recent-failed` - Get recent failed attempts (brute force)
- `POST /users` - Create user (admin)
- `GET /users` - List all users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user details
- `DELETE /users/{id}` - Delete user (hard delete)
- `POST /users/{id}/block` - Block user
- `POST /users/{id}/unblock` - Unblock user
- `POST /users/{id}/reset-password` - Admin reset password
- `POST /users/{id}/generate-otp` - Generate OTP for user
- `GET /otp-history` - Get OTP history
- `POST /change-password` - Admin change own password
- `GET /password-requirements` - Get password requirements
- `PUT /password-requirements` - Update password requirements
- `POST /honeytokens` - Create honey token (admin)
- `DELETE /honeytokens/{id}` - Delete honey token

### Uncertain ⚠️
- `GET /audit-logs` - Get all audit logs
- `GET /audit-logs/{userId}` - Get user's audit logs
- `POST /audit-logs/export` - Export audit logs
- `GET /dashboard/statistics` - Dashboard statistics
- `GET /reports/login-attempts` - Login attempts report
- `POST /backup` - Create backup

### Issues 🔴
1. **Audit Service Error** - Throws "not implemented" error in current code
2. **OTP Implementation** - Referenced but detailed flow unclear
3. **Hard Delete** - `DELETE /users/{id}` should probably be soft delete
4. **Honey Token Duplication** - Both user and admin can create
5. **Reports & Analytics** - No endpoint for generating reports

---

## 🎚️ DMX LIGHTING (`/api/dmx`)

### Implemented ✅
- `GET /state` - Get current DMX state (polling)
- `GET /devices` - List FTDI devices
- `POST /port/open` - Open DMX port
- `POST /port/close` - Close DMX port
- `POST /config` - Configure DMX (fps, start code)
- `PUT /channel/{ch}` - Set individual channel value (0-512)
- `PUT /universe` - Set all 512 channels
- `POST /blackout` - Set all channels to 0
- `POST /program/save` - Save program
- `POST /program/load` - Load saved program
- `GET /programs` - List saved programs
- `DELETE /programs/{id}` - Delete program

### Status 🟢
**Status: WELL-IMPLEMENTED** - All core features present

---

## 🎨 AUDIO EDITOR (`/api/editor`)

### Implemented ✅
- `POST /project` - Create project
- `GET /projects` - List user projects
- `GET /projects/templates` - List template projects
- `GET /project/{id}` - Get project details
- `POST /section` - Add section to project
- `POST /layer` - Add layer to section
- `GET /layer/{id}` - Get layer details
- `POST /layer/item` - Add single item to layer
- `POST /layer/items` - Add multiple items to layer
- `GET /layer/{id}/items` - Get layer items
- `POST /audioclip` - Add audio clip
- `GET /audioclips` - List audio clips
- `POST /export` - Export project (MP3, WAV, etc.)
- `POST /ai-edit` - AI-assisted editing
- `POST /splice` - Splice/cut audio
- `POST /apply-effect` - Apply audio effect

### Missing ❌
- `PUT /project/{id}` - Update project
- `DELETE /project/{id}` - Delete project
- `PUT /section/{id}` - Update section
- `DELETE /section/{id}` - Delete section
- `PUT /layer/{id}` - Update layer
- `DELETE /layer/{id}` - Delete layer
- `DELETE /layer/item/{id}` - Delete layer item
- `PUT /audioclip/{id}` - Update clip
- `DELETE /audioclip/{id}` - Delete clip
- `POST /project/{id}/publish` - Publish project
- `POST /project/{id}/share` - Share project
- `GET /presets/effects` - Get effect presets

### Issues 🔴
1. **No DELETE operations** - Can't remove projects, sections, layers
2. **No UPDATE operations** - Can only create, not modify
3. **Export format support unclear** - What formats are supported?
4. **Template projects** - Not clear if editable or read-only
5. **Collaboration missing** - No share/publish endpoints
6. **Undo/Redo** - No endpoints for history management

---

## 📚 LIBRARY (`/api/library/*`)

### Implemented ✅
- `GET /youtube/search` - Search YouTube videos
- `GET /ultrastar/list` - List Ultrastar files
- `GET /ultrastar/{id}` - Get Ultrastar file details
- `POST /ultrastar/import` - Import Ultrastar
- `GET /streaming/search` - Search on streaming platform
- `POST /streaming/get-streams` - Get stream URLs
- `GET /ai-audio/list` - List AI-generated audio
- `POST /ai-audio/generate` - Generate AI audio
- `GET /ai-video/list` - List AI-generated video
- `POST /ai-video/detect-pose` - Detect pose in video
- `POST /ai-video/generate-animation` - Generate animation from pose

### Uncertain ⚠️
- `GET /stream/{id}` - Get stream details
- `POST /stream/{id}/preview` - Preview stream

### Issues 🔴
1. **Multiple Library APIs** - Confusing which endpoint is for what
2. **YouTube vs Streaming** - Overlap in functionality
3. **AI Generation** - Backend support for generation unclear

---

## 🎵 PLAYLISTS (`/api/playlist`)

### Implemented ✅
- `POST /` - Create playlist
- `POST /from-infos` - Create from song infos
- `GET /` - List playlists
- `GET /{id}` - Get playlist details
- `PUT /{id}` - Update playlist
- `DELETE /{id}` - Delete playlist
- `POST /tidal/streams` - Get Tidal stream URLs
- `POST /tidal/streams/from-infos` - Get streams from song infos

### Uncertain ⚠️
- `POST /{id}/add-song` - Add song to playlist
- `DELETE /{id}/remove-song/{songId}` - Remove song from playlist
- `GET /{id}/export` - Export playlist

### Issues 🔴
1. **Tidal Integration** - Uncertain if fully implemented
2. **Playlist Sharing** - No share/public playlist endpoints
3. **Collaborative Playlists** - No multi-user support

---

## 🎤 MICROPHONE MANAGEMENT (`/api/microphone-assignments`)

### Implemented ✅
- `GET /assignments` - Get all mic assignments
- `POST /assign` - Assign microphone to player
- `DELETE /assignment/{id}` - Remove assignment
- `PUT /assignment/{id}` - Update assignment
- `GET /test` - Test microphone
- `POST /test` - Test mic with audio

### Uncertain ⚠️
- `GET /devices` - List available mics
- `POST /calibrate/{deviceId}` - Calibrate microphone
- `GET /levels/{deviceId}` - Get current audio levels

### Issues 🔴
1. **Device Management** - Unclear if handled here or in `/api/user/devices`
2. **Calibration** - Feature might not be fully implemented
3. **Levels Monitoring** - Real-time level data uncertain

---

## 🤖 AI AUDIO GENERATION (`/api/ai-audio`)

### Implemented ✅
- `POST /generate-speech` - Text-to-speech
- `POST /generate-music` - AI music generation
- `POST /transcribe` - Speech-to-text transcription
- `POST /analyze-emotions` - Emotion analysis from audio
- `POST /voice-clone` - Clone voice sample
- `POST /remix` - AI remix existing audio
- `GET /models` - List available AI models

### Uncertain ⚠️
- `GET /usage` - Get usage statistics
- `POST /batch-generate` - Batch generation job
- `GET /job/{id}` - Get job status

### Issues 🔴
1. **Model Selection** - Not clear how users choose models
2. **Async Processing** - Long operations might need job queue
3. **Cost/Quota** - No quota management endpoints

---

## 🎬 AI VIDEO FEATURES (`/api/ai-video`)

### Implemented ✅
- `POST /detect-pose` - Detect pose in video/image
- `POST /extract-poses` - Extract multiple poses from video
- `POST /animate-from-poses` - Generate animation from poses
- `POST /lip-sync` - Generate lip-sync video
- `POST /deepfake-caution` - Generate synthetic face

### Uncertain ⚠️
- `POST /process-video` - General video processing
- `GET /models` - List available video models
- `POST /quality-enhance` - Enhance video quality

### Issues 🔴
1. **Performance** - Video processing is CPU-intensive, needs job queue
2. **Privacy/Ethics** - Deepfake features need safeguards
3. **Model Updates** - How are models kept current?

---

## 📊 Data Validation Issues

### Inconsistent Data Structures
1. **KaraokePartyRound** - Structure doesn't match use cases
2. **KaraokeSinging** - Results structure unclear (who scored what?)
3. **AudioLayerItem** - Parameters are loose JSON, no schema
4. **DeviceDto vs MicrophoneDto** - Duplication and overlap

### Missing Models
1. **UserPreferences** - No clear DTO for preferences
2. **PlaylistShare** - No model for sharing playlists
3. **ProjectTemplate** - Template structure undefined
4. **ErrorResponse** - No standard error format

---

## 🚨 CRITICAL ISSUES

### 1. **Audit Service Broken** 🔴
- Status: Throws "not implemented" error
- Impact: Cannot audit admin actions or user activity
- Required: Full implementation of audit logging

### 2. **CAPTCHA System Confusion** 🔴
- Two implementations: Native CAPTCHA + reCAPTCHA v3
- Status: Both might be implemented or only one
- Impact: Login security unclear
- Required: Clarify and consolidate

### 3. **Missing DELETE Operations** 🔴
- Projects, sections, layers, clips cannot be deleted
- Status: Frontend UI exists but endpoint missing
- Impact: Disk space not cleaned up
- Required: Implement soft-delete with cascade logic

### 4. **Password Reset Flow** 🔴
- Status: No clear endpoint for initiating reset
- Impact: Users cannot recover forgotten passwords
- Required: Email-based reset flow with tokens

### 5. **Session Management** 🔴
- Status: Session revoke might not work
- Impact: Logged-out sessions might stay valid
- Required: Proper session termination

---

## 📈 Implementation Recommendations

### High Priority (Required for MVP)
1. ✅ Audit service implementation
2. ✅ CAPTCHA/reCAPTCHA consolidation
3. ✅ Password reset endpoint
4. ✅ DELETE operations for editor resources
5. ✅ Session management fixes

### Medium Priority (Nice to have)
1. ✅ UPDATE operations for karaoke
2. ✅ Playlist sharing
3. ✅ Project templates improvements
4. ✅ Microphone calibration
5. ✅ Usage statistics/quotas

### Low Priority (Future)
1. ✅ GDPR data export
2. ✅ Advanced reporting
3. ✅ Batch processing jobs
4. ✅ API webhooks
5. ✅ GraphQL layer

---

## 🔍 Endpoints by Status

### Definitely Implemented (104)
✅ All GET operations for reading data
✅ All POST operations for creating data
✅ Core authentication endpoints
✅ DMX control (all endpoints)
✅ Most device management
✅ Most karaoke CRUD

### Uncertain (15)
⚠️ OTP full flow
⚠️ MFA setup/verification
⚠️ Session revocation
⚠️ Audit log export
⚠️ GDPR features
⚠️ Tidal streaming (uncertain if fully working)
⚠️ AI model selection UI

### Confirmed Missing (13)
❌ Most DELETE operations (editor, projects)
❌ Most UPDATE operations (editor resources)
❌ Password reset initiation
❌ Project publishing/sharing
❌ Playlist song add/remove
❌ Microphone calibration
❌ Usage statistics endpoints

---

## 📋 Next Steps

1. **Verify Status** - Confirm which uncertain endpoints are actually implemented
2. **Implement Missing** - Start with high-priority missing endpoints
3. **Fix Issues** - Resolve audit service and CAPTCHA confusion
4. **Add Tests** - Create integration tests for all endpoints
5. **Document API** - Update Swagger/OpenAPI docs
6. **Optimize** - Add pagination, filtering, sorting where needed
7. **Secure** - Review auth/permissions on all endpoints

---

**Generated:** January 27, 2026
**Next Review:** After backend implementation
