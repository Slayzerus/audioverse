import { TutorialStep } from '../contexts/TutorialContext';

/**
 * Tutorial steps for the Song Browser page.
 * Shows users how to browse, filter, and select songs.
 */
export const songBrowserTutorial: TutorialStep[] = [
  {
    id: 'song-browser-welcome',
    targetElement: 'page-songs',
    title: '🎤 Welcome to Song Browser!',
    content: 'Here you can browse and select karaoke songs. Use filters to find your favorite songs by title, artist, genre, language, or year.',
    position: 'center'
  },
  {
    id: 'song-browser-settings',
    targetElement: 'karaoke-settings-panel',
    title: '⚙️ Game Settings',
    content: 'Configure game mode, add players, and assign microphones before selecting a song. Each player needs a microphone to play!',
    position: 'bottom'
  },
  {
    id: 'song-browser-group',
    targetElement: 'group-by-select',
    title: '📂 Group Songs',
    content: 'Group songs by genre or year to organize your library. This makes it easier to find songs in a specific category.',
    position: 'bottom'
  },
  {
    id: 'song-browser-filters',
    targetElement: 'toggle-filters-btn',
    title: '🔍 Filter Options',
    content: 'Click here to show/hide advanced filters. You can search by title, artist, genre, language, and year.',
    position: 'bottom'
  },
  {
    id: 'song-browser-play',
    targetElement: 'song-card-0',
    title: '▶️ Start Singing!',
    content: 'Click the Play button on any song card to start your karaoke session. Make sure all players have microphones assigned first!',
    position: 'bottom'
  }
];

/**
 * Tutorial steps for the Karaoke Round page.
 * Explains the singing interface and controls.
 */
export const karaokeRoundTutorial: TutorialStep[] = [
  {
    id: 'karaoke-round-welcome',
    targetElement: 'page-rounds',
    title: '🎶 Ready to Sing!',
    content: 'This is the karaoke round page where you\'ll sing along to the music. Let\'s explore the interface!',
    position: 'center'
  },
  {
    id: 'karaoke-round-timeline',
    targetElement: 'karaoke-timeline',
    title: '📊 Note Timeline',
    content: 'This timeline shows the notes you need to sing. The colored bars represent the pitch and timing of each note.',
    position: 'bottom'
  },
  {
    id: 'karaoke-round-lyrics',
    targetElement: 'karaoke-lyrics-display',
    title: '📝 Lyrics Display',
    content: 'The lyrics appear here in sync with the music. Current words are highlighted so you know when to sing.',
    position: 'top'
  },
  {
    id: 'karaoke-round-pitch',
    targetElement: 'pitch-detector',
    title: '🎵 Pitch Feedback',
    content: 'Your microphone input is analyzed in real-time to show if you\'re singing the correct pitch. Try to match the target notes!',
    position: 'bottom'
  },
  {
    id: 'karaoke-round-score',
    targetElement: 'score-display',
    title: '⭐ Score & Feedback',
    content: 'Your score is calculated based on pitch accuracy and timing. Sing along and try to get the highest score!',
    position: 'bottom'
  }
];

/**
 * Tutorial steps for the Controller Settings page.
 * Explains gamepad configuration and button mapping.
 */
export const controllerSettingsTutorial: TutorialStep[] = [
  {
    id: 'controller-welcome',
    targetElement: 'page-settings-controller',
    title: '🎮 Controller Settings',
    content: 'Configure your gamepad or controller here. You can customize button mappings and adjust sensitivity.',
    position: 'center'
  },
  {
    id: 'controller-status',
    targetElement: 'controller-status',
    title: '🔌 Controller Status',
    content: 'This shows if your controller is connected. Make sure your gamepad is plugged in and detected by your browser.',
    position: 'bottom'
  },
  {
    id: 'controller-mapping',
    targetElement: 'button-mapping-section',
    title: '⚡ Button Mapping',
    content: 'Customize which buttons perform which actions. Click on a button and press the gamepad button you want to assign.',
    position: 'bottom'
  },
  {
    id: 'controller-deadzone',
    targetElement: 'deadzone-slider',
    title: '🎚️ Deadzone Settings',
    content: 'Adjust the deadzone to prevent accidental inputs from stick drift. Higher values require more stick movement to register.',
    position: 'bottom'
  },
  {
    id: 'controller-test',
    targetElement: 'controller-test-area',
    title: '✅ Test Your Settings',
    content: 'Use this area to test your controller. Press buttons and move sticks to verify your configuration works correctly.',
    position: 'top'
  }
];

/**
 * Tutorial steps for the Home page.
 * Introduces the app and main navigation.
 */
export const homePageTutorial: TutorialStep[] = [
  {
    id: 'home-welcome',
    targetElement: 'page-home',
    title: '🎵 Welcome to AudioVerse!',
    content: 'AudioVerse is your complete karaoke and audio creation platform. Let\'s take a quick tour!',
    position: 'center'
  },
  {
    id: 'home-navbar',
    targetElement: 'navbar-main',
    title: '🧭 Navigation Bar',
    content: 'Use the navigation bar to access different sections: Play (karaoke), Create (audio editor), Explore (library), and Enjoy (music player).',
    position: 'bottom'
  },
  {
    id: 'home-play',
    targetElement: 'nav-link-play',
    title: '🎤 Play Karaoke',
    content: 'Start here to sing karaoke songs! Browse songs, create playlists, and have karaoke parties with friends.',
    position: 'bottom'
  },
  {
    id: 'home-create',
    targetElement: 'nav-link-create',
    title: '🎹 Create Music',
    content: 'Access the audio editor to create your own music projects, record vocals, and mix audio tracks.',
    position: 'bottom'
  },
  {
    id: 'home-settings',
    targetElement: 'nav-link-settings',
    title: '⚙️ Settings & Profile',
    content: 'Configure audio settings, controller mappings, and manage your profile here.',
    position: 'bottom'
  }
];

/**
 * Tutorial steps for the Audio Editor page.
 * Explains the DAW-like interface.
 */
export const audioEditorTutorial: TutorialStep[] = [
  {
    id: 'editor-welcome',
    title: '🎹 Welcome to AudioEditor!',
    content: 'This is the audio/MIDI editor. Create music, record vocals, and mix tracks. Follow this guide to learn the key features.',
    position: 'center'
  },
  {
    id: 'editor-display-mode',
    targetElement: '#editor-display-mode',
    title: '🎚️ Display Mode',
    content: 'Choose complexity level: Fun (minimal), Beginner, Mid, Expert, or Master (full DAW). The mode controls panel visibility.',
    position: 'bottom'
  },
  {
    id: 'editor-transport',
    targetElement: '#editor-transport',
    title: '▶️ Transport',
    content: 'Control playback: Play, Stop, Loop, Record. Click on the timeline to move the playhead.',
    position: 'bottom'
  },
  {
    id: 'editor-layers',
    targetElement: '#editor-layer-list',
    title: '🎚️ Layers',
    content: 'Each layer is a separate audio/MIDI track. Add clips, adjust volume, panning, and effects.',
    position: 'right'
  },
  {
    id: 'editor-zoom-snap',
    targetElement: '#editor-zoom-snap',
    title: '🔍 Zoom & Snap',
    content: 'Zoom in/out on the timeline. Snap aligns clips to the grid (beat/bar). Set the project BPM.',
    position: 'bottom'
  },
  {
    id: 'editor-recording',
    targetElement: '#editor-recording-options',
    title: '🔴 Recording',
    content: 'Record audio from the microphone. Set count-in, overdub (play background), punch-in/out.',
    position: 'bottom'
  },
  {
    id: 'editor-save',
    targetElement: '#editor-project-settings',
    title: '💾 Save & Export',
    content: 'Save the project to the server, export to JSON, or bounce the mix. Auto-save protects against data loss.',
    position: 'bottom'
  },
  {
    id: 'editor-shortcuts',
    title: '⌨️ Keyboard Shortcuts',
    content: 'Ctrl+Z — Undo, Ctrl+Y — Redo, Space — Play/Pause, Q — Quantize, Del — Delete. Press ? to see the full list.',
    position: 'center'
  }
];

/**
 * Tutorial steps for the Music Player page.
 * Shows how to use the music player features.
 */
export const musicPlayerTutorial: TutorialStep[] = [
  {
    id: 'player-welcome',
    targetElement: 'page-musicPlayer',
    title: '🎧 Music Player',
    content: 'Listen to your music library with this feature-rich music player. Create playlists, shuffle, repeat, and more!',
    position: 'center'
  },
  {
    id: 'player-library',
    targetElement: 'music-library-section',
    title: '📚 Your Library',
    content: 'Browse your music collection here. Songs are organized by title, artist, album, and genre.',
    position: 'right'
  },
  {
    id: 'player-controls',
    targetElement: 'player-controls',
    title: '⏯️ Playback Controls',
    content: 'Standard playback controls: play, pause, skip, volume, shuffle, and repeat. Use keyboard shortcuts for quick access!',
    position: 'top'
  },
  {
    id: 'player-queue',
    targetElement: 'play-queue',
    title: '📋 Play Queue',
    content: 'View and manage the upcoming songs in your queue. Drag to reorder, remove songs, or clear the queue.',
    position: 'left'
  },
  {
    id: 'player-visualizer',
    targetElement: 'audio-visualizer',
    title: '🌈 Audio Visualizer',
    content: 'Watch the music come to life with the audio visualizer. Different visualization modes are available!',
    position: 'bottom'
  }
];
