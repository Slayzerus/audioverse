# AudioVerse 🎵

> A comprehensive multimedia platform for music creation, karaoke management, DMX lighting control, and interactive audio experiences.

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
  - [Karaoke System](#karaoke-system)
  - [Music Editor](#music-editor)
  - [DMX Lighting Control](#dmx-lighting-control)
  - [Admin Dashboard](#admin-dashboard)
- [Getting Started](#getting-started)
- [API Integration](#api-integration)
- [Development](#development)
- [Contributing](#contributing)

---

## Overview

**AudioVerse** is a full-featured web application built with React and TypeScript that enables users to:

- 🎤 Create and manage karaoke parties with dynamic scoring
- 🎵 Edit multi-layer audio projects with professional timeline controls
- 💡 Control DMX lighting systems for synchronized light shows
- 🎮 Play interactive music games
- 🔐 Manage user authentication and admin controls
- 📺 Integrate YouTube videos for backing tracks

The platform combines entertainment, creativity, and interactive features into one cohesive system.

---

## Features

### 🎤 Karaoke Management
- **Upload UltraStar Format Files**: Parse and manage .txt karaoke files with precision timing
- **Real-time Lyrics Display**: Word-by-word lyric highlighting with golden notes support
- **Party Management**: Create parties, manage players, organize rounds
- **Scoring System**: Automatic scoring based on pitch accuracy and timing
- **YouTube Integration**: Search and embed backing tracks from YouTube
- **Multi-track Support**: Audio files (MP3, WAV) and video backing tracks

### 🎵 Music Editor
- **Multi-layer Audio Projects**: Create complex audio compositions with multiple layers
- **Audio Timeline**: Precise control over timing and sequencing
- **Layer Management**: Add/edit/remove audio layers with custom parameters
- **Real-time Preview**: Play and monitor your compositions instantly
- **Project Management**: Save, load, and organize your audio projects

### 💡 DMX Lighting
- **Device Management**: Connect and configure DMX devices
- **Effect Programming**: Create lighting effects and sequences
- **Live Control**: Adjust lighting in real-time during performances
- **Preset Management**: Save and recall lighting setups

### 🎮 Games & Interactive Features
- **Hit That Note**: Musical note recognition game
- **Audience Simulation**: Animated judges and audience feedback
- **Choreography Support**: Synchronize animations with music
- **Real-time Updates**: Live scoring and performance feedback

### 👥 Admin Dashboard
- **User Management**: Create, edit, block users
- **Password Policies**: Configure password requirements and validity
- **Admin Settings**: Change admin account password
- **System Configuration**: Manage platform-wide settings

### 🔐 Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and user roles
- **Session Management**: Automatic token refresh
- **Secure Storage**: Bearer token authorization

---

## Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.0** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router 7.1** - Client-side routing
- **React Bootstrap** - UI components
- **TailwindCSS / DaisyUI** - Styling

### State Management & API
- **TanStack Query (React Query)** - Server state management
- **Axios** - HTTP client
- **Zustand** - Lightweight state management
- **Context API** - User authentication context

### Multimedia
- **react-youtube** - YouTube player integration
- **HLS.js** - HTTP Live Streaming support
- **FFmpeg** - Audio/video processing
- **RecordRTC** - Audio recording
- **WAV Encoder** - Audio format conversion
- **Lamejs** - MP3 encoding (browser)
- **Phaser** - Game development framework

### Animation & Effects
- **Framer Motion** - Advanced animations
- **Emotion** - CSS-in-JS styling
- **FontAwesome** - Icon library

---

## Installation

### Prerequisites
- Node.js 16+ and npm
- Docker (optional, for containerization)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/audioverse.git
cd audioverse/audioverse-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env.local` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

4. **Start development server**
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

5. **Build for production**
```bash
npm run build
npm run preview
```

### Docker Setup
```bash
docker build -t audioverse .
docker run -p 3000:80 audioverse
```

---

## Project Structure

```
audioverse-react/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                 # Main navigation
│   │   ├── UserContext.tsx            # User authentication state
│   │   ├── FontLoader.tsx             # Custom font loading
│   │   ├── animations/                # Animation components
│   │   │   ├── AnimatedPerson.tsx
│   │   │   ├── AnimatedPersonEditor.tsx
│   │   │   ├── choreography.ts        # Choreography DSL
│   │   │   └── Jurors.tsx
│   │   ├── controls/
│   │   │   ├── player/
│   │   │   │   └── GenericPlayer.tsx  # Universal media player
│   │   │   ├── karaoke/
│   │   │   │   ├── KaraokeManager.tsx
│   │   │   │   ├── KaraokeUploader.tsx
│   │   │   │   ├── KaraokeLyrics.tsx
│   │   │   │   └── KaraokeTimeline.tsx
│   │   │   ├── dmx/                   # DMX lighting controls
│   │   │   ├── editor/                # Editor components
│   │   │   └── playlist/              # Playlist management
│   │   └── forms/                     # Form components
│   │       ├── user/                  # Login/Register forms
│   │       └── editor/                # Editor forms
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── admin/                     # Admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUsersPage.tsx
│   │   │   ├── AdminPasswordRequirementsPage.tsx
│   │   │   └── AdminSettingsPage.tsx
│   │   ├── create/                    # Creation pages
│   │   │   ├── AudioEditorPage.tsx
│   │   │   ├── DmxEditorPage.tsx
│   │   │   └── AnimatedPersonsPage.tsx
│   │   ├── play/                      # Play mode
│   │   ├── enjoy/                     # Enjoyment features
│   │   ├── explore/                   # Discovery
│   │   ├── party/                     # Party management
│   │   └── profile/                   # User profile
│   ├── models/
│   │   ├── modelsAdmin.ts             # Admin types
│   │   ├── modelsAudio.ts             # Audio/Editor types
│   │   ├── modelsKaraoke.ts           # Karaoke types
│   │   ├── modelsAuth.ts              # Authentication types
│   │   ├── modelsDmx.ts               # DMX types
│   │   └── ...                        # Other model files
│   ├── scripts/
│   │   ├── api/
│   │   │   ├── apiAdmin.ts            # Admin API
│   │   │   ├── apiUser.ts             # User/Auth API
│   │   │   ├── apiKaraoke.ts          # Karaoke API
│   │   │   ├── apiEditor.ts           # Editor API
│   │   │   ├── apiDmx.ts              # DMX API
│   │   │   ├── audioverseApiClient.ts # Axios client config
│   │   │   └── swagger.json           # OpenAPI spec
│   │   ├── karaoke/
│   │   │   ├── karaokeLyrics.ts       # Lyrics parsing
│   │   │   └── karaokeTimeline.ts     # Timeline rendering
│   │   ├── audioPlayback.ts
│   │   ├── audioTimeline.ts
│   │   ├── generateSpeech.ts
│   │   └── ...                        # Other utilities
│   ├── types/
│   │   └── lamejs.d.ts                # Type definitions
│   ├── utils/
│   │   ├── libraryMappers.ts
│   │   └── libraryStyles.ts
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles
├── public/
│   └── audioClips/                    # Sample audio files
├── KARAOKE_LYRICS_PROCESSING.md       # Karaoke docs
├── package.json
├── vite.config.ts
├── tsconfig.json
└── Dockerfile
```

---

## Key Features

### 🎤 Karaoke System

#### Supported Formats
- **UltraStar (.txt)**: Full format support with pitch, duration, and golden notes
- **Audio Files**: MP3, WAV, AAC, M4A, FLAC, OGG
- **Video Backing Tracks**: YouTube integration

#### Lyric Processing
The karaoke system parses UltraStar format files into structured data:

```typescript
// Each syllable/word has timing information
KaraokeWord {
  text: string;        // "Sal"
  startTime: number;   // 0.0 seconds
  endTime: number;     // 0.2 seconds
  isGolden: boolean;   // Bonus points
}

// Words are grouped into verses
KaraokeVerse {
  text: string;        // "Sal ly called"
  timestamp: number;   // Verse start time
  words: KaraokeWord[];
}
```

See [KARAOKE_LYRICS_PROCESSING.md](KARAOKE_LYRICS_PROCESSING.md) for detailed format documentation.

#### Creating a Karaoke Party

```typescript
// 1. Upload a karaoke file
<KaraokeUploader onSongUpload={handleSongUpload} />

// 2. The system parses and displays:
- Song metadata (title, artist, year, language, genre)
- Real-time lyrics with precise timing
- Interactive timeline with note visualization
- Scoring system based on accuracy

// 3. Manage players and rounds
const party = await createParty({
  name: "Friday Night Karaoke",
  organizerId: currentUser.userId
});

// 4. Add players and songs
await assignPlayerToParty({ partyId: party.id, playerId });
await addSongToRound({ roundId, songId });
```

#### File Upload Example
Place `.txt` karaoke files in any folder and upload via the KaraokeUploader component:

```
#TITLE:Living Next Door To Alice
#ARTIST:Smokie
#YEAR:1976
#LANGUAGE:English
: 0 2 1 Sal
: 4 1 4 ly
: 8 7 2 called
- 22
: 25 2 1 when
```

---

### 🎵 Music Editor

#### Features
- **Multi-layer composition**: Up to multiple audio layers per project
- **Timeline control**: Frame-accurate editing
- **Audio sources**: Local files, HTTP streams, HLS
- **Real-time preview**: Play while editing
- **Project management**: Save/load functionality

#### Creating an Audio Project

```typescript
// Create a new project
const projectId = await addProject(
  "My Song",
  userProfileId
);

// Add sections (verses, chorus, etc.)
const sectionId = await addSection(
  projectId,
  "Verse 1",
  0 // order
);

// Add layers (instruments, vocals, etc.)
const layerId = await addLayer(
  sectionId,
  "Lead Vocal",
  "audio", // audioSource
  "{}" // audioSourceParameters
);

// Add layer items (clips within a layer)
await addLayerItem(
  layerId,
  "00:00:00", // startTime
  "{}" // parameters
);
```

---

### 💡 DMX Lighting Control

#### Features
- **Device management**: Add/configure DMX devices
- **Real-time control**: Adjust lighting during performances
- **Effect library**: Pre-built effects and transitions
- **Synchronization**: Sync lighting with music

#### API Examples

```typescript
// Get DMX state
const state = await getDmxState();

// Get available devices
const devices = await getDmxDevices();

// Send DMX command
await sendDmxCommand({
  deviceId: 1,
  channel: 1,
  value: 255
});
```

---

### 👥 Admin Dashboard

#### Admin Features

**User Management** (`/admin/users`)
- List all users with status (active/blocked)
- Create new users
- Block/unblock users
- Delete users
- Change user passwords
- Update user details

**Password Requirements** (`/admin/password-requirements`)
- Configure uppercase/lowercase requirements
- Set digit requirements
- Require special characters
- Set minimum/maximum password length
- Apply policies globally

**Admin Settings** (`/admin/settings`)
- Change admin account password
- View admin information
- Manage admin privileges

#### Admin API

```typescript
// User Management
const users = await getAllUsers();
await createUser({ username, email, password });
await updateUserDetails(userId, { email, firstName, lastName });
await deleteUser(userId);
await changeUserPassword(userId, { password });

// User Restrictions
await blockUser(userId, { blockedUntil, reason });
await setPasswordValidity(userId, { validUntil });

// Password Policies
const requirements = await getPasswordRequirements();
await setPasswordRequirements({
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: false,
  minLength: 8,
  maxLength: 128
});

// Admin Account
await changeAdminPassword({ currentPassword, newPassword });
```

---

## Getting Started

### First Steps

1. **Create an Account**
   - Go to `/register`
   - Fill in username, email, and password
   - Sign in at `/login`

2. **User Data**
   - After login, user info is loaded via `/api/user/me`
   - Includes: userId, username, roles, isAdmin flag
   - Available in the `useUser()` hook

3. **Explore Features**
   - **Karaoke**: Upload a .txt file to start
   - **Music Editor**: Create/load audio projects
   - **DMX**: Connect and control lighting
   - **Games**: Try Hit That Note
   - **Admin** (if admin user): Manage users and settings

### Example Workflows

#### Upload and Sing a Karaoke Song
```bash
1. Go to /rounds (Karaoke section)
2. Click KaraokeUploader
3. Select/drag your .txt karaoke file
4. System finds backing track on YouTube
5. Lyrics display with timing
6. Press play on the player
7. Sing along - system tracks your accuracy
8. View results and scoring
```

#### Create a Music Project
```bash
1. Go to /create/studio
2. Click "New Project"
3. Add sections (verse, chorus, etc.)
4. Add audio layers
5. Add clips to layers
6. Play and adjust timing
7. Save project
```

#### Manage Users (Admin Only)
```bash
1. Go to /admin
2. Click "User Management"
3. View all users with status
4. Create new user (form)
5. Block/unblock users
6. Set password policies
7. Change admin password
```

---

## API Integration

### Authentication

All API requests require Bearer token authorization (except login/register):

```typescript
// Login
const response = await loginUser({ username, password });
// Returns: { accessToken, refreshToken }

// The token is automatically set in all subsequent requests via axios interceptor

// Get current user
const user = await getCurrentUser();
// Returns: { userId, username, roles, isAdmin }

// Refresh token (automatic via query hook)
await refreshTokenUser();

// Logout
await logoutUser(userId);
```

### API Client Configuration

See `src/scripts/api/audioverseApiClient.ts`:

```typescript
import { apiClient, apiPath } from "./audioverseApiClient";

// All API calls use:
const { data } = await apiClient.post(
  apiPath(BASE_PATH, "/endpoint"),
  payload
);
```

### Endpoints Overview

#### User & Auth
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `POST /api/user/refresh-token` - Refresh access token
- `POST /api/user/logout` - Logout user
- `GET /api/user/me` - Get current user info

#### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/change-password` - Change user password
- `POST /api/admin/users/{id}/block` - Block user
- `POST /api/admin/users/{id}/password-validity` - Set password validity
- `POST /api/admin/change-password` - Change admin password
- `GET /api/password-requirements` - Get password requirements
- `POST /api/password-requirements` - Set password requirements

#### Karaoke
- `POST /api/karaoke/parse-ultrastar` - Parse karaoke file
- `GET /api/karaoke/get-all-parties` - List parties
- `POST /api/karaoke/create-party` - Create party
- `GET /api/karaoke/get-all-players` - List players
- `POST /api/karaoke/create-player` - Create player
- `GET /api/karaoke/filter-songs` - Filter songs
- `POST /api/karaoke/add-round` - Add round
- `POST /api/karaoke/add-song-to-round` - Add song to round

#### Editor
- `POST /api/editor/project` - Create project
- `POST /api/editor/section` - Add section
- `POST /api/editor/layer` - Add layer
- `POST /api/editor/layer/item` - Add layer item
- `GET /api/editor/projects` - List projects

#### DMX
- `GET /api/Dmx/state` - Get DMX state
- `GET /api/Dmx/devices` - Get DMX devices
- `POST /api/Dmx/command` - Send DMX command

Full OpenAPI specification available in `src/scripts/api/swagger.json`

---

## Development

### Running the Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5173` with hot module replacement.

### Building for Production

```bash
npm run build
```

Creates optimized build in `dist/` directory.

### Linting

```bash
npm run lint
```

Checks code quality using ESLint.

### Type Checking

```bash
npx tsc --noEmit
```

TypeScript type checking without emitting files.

### Key Development Patterns

#### Using the User Context

```typescript
import { useUser } from "./components/UserContext";

function MyComponent() {
  const { userId, username, isAdmin, currentUser, logout } = useUser();

  return (
    <div>
      {isAdmin && <AdminPanel />}
      <p>Logged in as: {username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Making API Calls

```typescript
import * as apiKaraoke from "../scripts/api/apiKaraoke";
import { useQuery, useMutation } from "@tanstack/react-query";

// Query (GET)
const { data: parties, isLoading } = useQuery({
  queryKey: apiKaraoke.KARAOKE_QK.parties,
  queryFn: apiKaraoke.fetchParties
});

// Mutation (POST/PUT/DELETE)
const createPartyMutation = useMutation({
  mutationFn: apiKaraoke.postCreateParty,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ 
      queryKey: apiKaraoke.KARAOKE_QK.parties 
    });
  }
});

// Use mutation
createPartyMutation.mutate({ name: "Party Name", organizerId: 1 });
```

#### Using GenericPlayer

```typescript
import GenericPlayer, { GenericPlayerExternal, PlayerTrack } from "./GenericPlayer";

const tracks: PlayerTrack[] = [
  {
    id: "1",
    title: "Song Title",
    artist: "Artist Name",
    sources: [
      { kind: "youtube", url: "https://www.youtube.com/watch?v=..." },
      { kind: "audio", url: "https://example.com/song.mp3" }
    ]
  }
];

const playerRef = useRef<GenericPlayerExternal>(null);

<GenericPlayer
  tracks={tracks}
  uiMode="nobuttons"
  height={480}
  externalRef={playerRef}
  onPlayingChange={setIsPlaying}
  onTimeUpdate={setCurrentTime}
/>
```

#### Creating a Form with Validation

```typescript
const [formData, setFormData] = useState({
  username: "",
  email: "",
  password: ""
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const result = await registerUser(formData);
    // Handle success
  } catch (error) {
    // Handle error
  }
};

<form onSubmit={handleSubmit}>
  <input
    type="text"
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
  />
  {/* More fields */}
  <button type="submit">Register</button>
</form>
```

---

## Project Statistics

- **Components**: 40+ React components
- **API Endpoints**: 25+ REST endpoints
- **Pages**: 15+ routes
- **Models/Types**: 20+ TypeScript interfaces
- **Dependencies**: 20+ npm packages
- **Lines of Code**: 10,000+

---

## Performance Optimization

- **Lazy Loading**: Pages loaded on demand via React Router
- **Query Caching**: TanStack Query with stale-while-revalidate
- **Image Optimization**: Responsive images with lazy loading
- **Code Splitting**: Vite automatic chunking
- **Tree Shaking**: Unused code eliminated in production builds

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Troubleshooting

### Common Issues

**YouTube videos not playing**
- Check if YouTube is accessible in your region
- Verify video IDs are correct
- Check CORS settings on backend

**Karaoke file not parsing**
- Ensure file is in UltraStar format (.txt)
- Check file encoding is UTF-8
- Verify format has required metadata fields

**Admin features not visible**
- Ensure you're logged in as admin user
- Check `isAdmin` flag in user context
- Verify backend role assignment

**Audio not playing**
- Check browser permissions (microphone/speaker)
- Verify audio file formats are supported
- Check network connectivity for remote files

---

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components with hooks
- Format code with Prettier
- Write meaningful commit messages

### Testing

```bash
# Run tests (if configured)
npm test

# Check types
npx tsc --noEmit

# Lint code
npm run lint
```

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues, questions, or suggestions:
- 📧 Email: support@audioverse.dev
- 💬 Discussions: GitHub Discussions
- 🐛 Bugs: GitHub Issues

---

## Changelog

### Version 0.0.0 (Initial Release)
- Karaoke system with UltraStar format support
- Music editor with multi-layer composition
- DMX lighting control
- Admin dashboard and user management
- Real-time lyrics and scoring
- YouTube integration
- Authentication and authorization

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Advanced choreography editor
- [ ] Real-time collaboration
- [ ] API rate limiting
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Video effects library

---

**Made with ❤️ by AudioVerse Team**
