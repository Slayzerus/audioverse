import type { ThemeDef } from './themeTypes';

// ─── Seeded themes (added) ───────────────────────────────────────

export const velvetNight: ThemeDef = {
  id: 'velvet-night',
  name: 'Velvet Night',
  emoji: '🖤',
  description: 'Smooth, velvety shades',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#0b0711,#2a2130)',
  vars: {
    '--bg-primary': '#0b0711',
    '--bg-secondary': '#1a1220',
    '--card-bg': '#241628',
    '--text-primary': '#fdeff2',
    '--text-secondary': '#d8b7c9',
    '--accent-primary': '#ff6fa3',
    '--accent-hover': '#ff94c2',
    '--border-primary': '#3b2130'
  },
};

export const saffronGlow: ThemeDef = {
  id: 'saffron-glow',
  name: 'Saffron Glow',
  emoji: '🟠',
  description: 'Warm, spicy tones',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff5e6,#fff0d1)',
  vars: {
    '--bg-primary': '#fff8f0',
    '--bg-secondary': '#fff2e0',
    '--card-bg': '#fff1dd',
    '--text-primary': '#2b2b2b',
    '--text-secondary': '#5a4a3a',
    '--accent-primary': '#ff8a00',
    '--accent-hover': '#ffa733',
    '--border-primary': '#e6c9b0'
  },
};

export const crimsonSilk: ThemeDef = {
  id: 'crimson-silk',
  name: 'Crimson Silk',
  emoji: '🩸',
  description: 'Sensual crimson and silk',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#2b0a0a,#3b0f0f)',
  vars: {
    '--bg-primary': '#1b0a0a',
    '--bg-secondary': '#2b0f0f',
    '--card-bg': '#3a1414',
    '--text-primary': '#fff2f2',
    '--text-secondary': '#f0b6b6',
    '--accent-primary': '#d32f2f',
    '--accent-hover': '#ff5252',
    '--border-primary': '#4a1a1a'
  },
};

export const amberKiss: ThemeDef = {
  id: 'amber-kiss',
  name: 'Amber Kiss',
  emoji: '💛',
  description: 'Honeyed, cozy hues',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff9e6,#fff1cc)',
  vars: {
    '--bg-primary': '#fffaf0',
    '--bg-secondary': '#fff3d9',
    '--card-bg': '#fff1cc',
    '--text-primary': '#231f20',
    '--text-secondary': '#7a5a2b',
    '--accent-primary': '#ffb300',
    '--accent-hover': '#ffc633',
    '--border-primary': '#f0d9b5'
  },
};

export const velvetPlum: ThemeDef = {
  id: 'velvet-plum',
  name: 'Velvet Plum',
  emoji: '🍇',
  description: 'Deep purples',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#150018,#2a002b)',
  vars: {
    '--bg-primary': '#0f0011',
    '--bg-secondary': '#210019',
    '--card-bg': '#2b001f',
    '--text-primary': '#fff7fb',
    '--text-secondary': '#d8bfe6',
    '--accent-primary': '#9b59b6',
    '--accent-hover': '#c17bdc',
    '--border-primary': '#3a1630'
  },
};

export const roseWhisper: ThemeDef = {
  id: 'rose-whisper',
  name: 'Rose Whisper',
  emoji: '🌹',
  description: 'Subtle roses and beiges',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff6f8,#fff1f3)',
  vars: {
    '--bg-primary': '#fff8f9',
    '--bg-secondary': '#fff2f4',
    '--card-bg': '#fff1f2',
    '--text-primary': '#2b1f22',
    '--text-secondary': '#8b5b63',
    '--accent-primary': '#d81b60',
    '--accent-hover': '#ff4081',
    '--border-primary': '#f3d7db'
  },
};

export const midnightBloom: ThemeDef = {
  id: 'midnight-bloom',
  name: 'Midnight Bloom',
  emoji: '🌺',
  description: 'Floral night theme',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#0b0820,#241238)',
  vars: {
    '--bg-primary': '#070614',
    '--bg-secondary': '#1a0f25',
    '--card-bg': '#2b142b',
    '--text-primary': '#fff6f8',
    '--text-secondary': '#e6bfd6',
    '--accent-primary': '#ff4081',
    '--accent-hover': '#ff79a8',
    '--border-primary': '#3a0e2a'
  },
};

export const moonlitAmber: ThemeDef = {
  id: 'moonlit-amber',
  name: 'Moonlit Amber',
  emoji: '🌕',
  description: 'Warm night under the moon',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#0d0810,#2b1a09)',
  vars: {
    '--bg-primary': '#0b0908',
    '--bg-secondary': '#22170f',
    '--card-bg': '#2f1f14',
    '--text-primary': '#fff7e6',
    '--text-secondary': '#ead3b8',
    '--accent-primary': '#ffb74d',
    '--accent-hover': '#ffd27a',
    '--border-primary': '#3a2a1f'
  },
};

export const silkNoir: ThemeDef = {
  id: 'silk-noir',
  name: 'Silk Noir',
  emoji: '🕶️',
  description: 'Elegant black and contrasts',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#000,#1a1a1a)',
  vars: {
    '--bg-primary': '#000000',
    '--bg-secondary': '#0f0f0f',
    '--card-bg': '#121212',
    '--text-primary': '#f8f8f8',
    '--text-secondary': '#bfbfbf',
    '--accent-primary': '#9e9e9e',
    '--accent-hover': '#cfcfcf',
    '--border-primary': '#222222'
  },
};

export const cocoaMist: ThemeDef = {
  id: 'cocoa-mist',
  name: 'Cocoa Mist',
  emoji: '🍫',
  description: 'Chocolate tones',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff7f3,#f7ede6)',
  vars: {
    '--bg-primary': '#fff9f6',
    '--bg-secondary': '#fff2ee',
    '--card-bg': '#f6e8e0',
    '--text-primary': '#2b1e1c',
    '--text-secondary': '#7a5a4f',
    '--accent-primary': '#6d4c41',
    '--accent-hover': '#8d6e63',
    '--border-primary': '#ecdacb'
  },
};

export const opalDusk: ThemeDef = {
  id: 'opal-dusk',
  name: 'Opal Dusk',
  emoji: '💎',
  description: 'Shimmering shades',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#061018,#12202a)',
  vars: {
    '--bg-primary': '#061018',
    '--bg-secondary': '#0f2530',
    '--card-bg': '#172a34',
    '--text-primary': '#f3fbff',
    '--text-secondary': '#bcd7e6',
    '--accent-primary': '#7fd3ff',
    '--accent-hover': '#b7f0ff',
    '--border-primary': '#13303a'
  },
};

export const desertRose: ThemeDef = {
  id: 'desert-rose',
  name: 'Desert Rose',
  emoji: '🏜️',
  description: 'Desert, sensual hues',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff8f2,#ffeedb)',
  vars: {
    '--bg-primary': '#fffaf5',
    '--bg-secondary': '#fff2e8',
    '--card-bg': '#fff0de',
    '--text-primary': '#2b1f18',
    '--text-secondary': '#8a6f62',
    '--accent-primary': '#d88b5f',
    '--accent-hover': '#ffa66e',
    '--border-primary': '#edd6c2'
  },
};

export const moonshadow: ThemeDef = {
  id: 'moonshadow',
  name: 'Moonshadow',
  emoji: '🌒',
  description: 'Cool, soft shadows',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#030412,#0b1220)',
  vars: {
    '--bg-primary': '#030412',
    '--bg-secondary': '#0b1220',
    '--card-bg': '#131827',
    '--text-primary': '#e8f0ff',
    '--text-secondary': '#aabddf',
    '--accent-primary': '#5ea3ff',
    '--accent-hover': '#8fc3ff',
    '--border-primary': '#1d2b3a'
  },
};

export const rosewood: ThemeDef = {
  id: 'rosewood',
  name: 'Rosewood',
  emoji: '🪵',
  description: 'Wooden, warm shades',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fffaf8,#f6efe9)',
  vars: {
    '--bg-primary': '#fff9f6',
    '--bg-secondary': '#f7efe8',
    '--card-bg': '#efe3dc',
    '--text-primary': '#2b1c16',
    '--text-secondary': '#89614e',
    '--accent-primary': '#a0522d',
    '--accent-hover': '#c76b43',
    '--border-primary': '#e7d0c0'
  },
};

export const silkenAzure: ThemeDef = {
  id: 'silken-azure',
  name: 'Silken Azure',
  emoji: '🔵',
  description: 'Azure silks',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#f6fbff,#eaf6ff)',
  vars: {
    '--bg-primary': '#f8fdff',
    '--bg-secondary': '#eff8ff',
    '--card-bg': '#eaf6ff',
    '--text-primary': '#12202a',
    '--text-secondary': '#4a6b78',
    '--accent-primary': '#2196f3',
    '--accent-hover': '#42a5f5',
    '--border-primary': '#d7eaf8'
  },
};

export const nocturne: ThemeDef = {
  id: 'nocturne',
  name: 'Nocturne',
  emoji: '🎼',
  description: 'Musical night atmosphere',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#040014,#1a0029)',
  vars: {
    '--bg-primary': '#030012',
    '--bg-secondary': '#1a0029',
    '--card-bg': '#2b0533',
    '--text-primary': '#fffafc',
    '--text-secondary': '#d8c7e6',
    '--accent-primary': '#c2185b',
    '--accent-hover': '#e91e63',
    '--border-primary': '#3a0f2a'
  },
};

export const lavenderHaze: ThemeDef = {
  id: 'lavender-haze',
  name: 'Lavender Haze',
  emoji: '💜',
  description: 'Lavender softness',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff8ff,#f6f0ff)',
  vars: {
    '--bg-primary': '#fff9ff',
    '--bg-secondary': '#f7f0ff',
    '--card-bg': '#f2eaff',
    '--text-primary': '#21122b',
    '--text-secondary': '#6b4f72',
    '--accent-primary': '#9c27b0',
    '--accent-hover': '#b66cd9',
    '--border-primary': '#ecdff0'
  },
};

export const seduction: ThemeDef = {
  id: 'seduction',
  name: 'Seduction',
  emoji: '💋',
  description: 'Intense, sensual palette',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#12000a,#2b0016)',
  vars: {
    '--bg-primary': '#0c0305',
    '--bg-secondary': '#230412',
    '--card-bg': '#341022',
    '--text-primary': '#ffeef1',
    '--text-secondary': '#f2b8c0',
    '--accent-primary': '#e91e63',
    '--accent-hover': '#ff6090',
    '--border-primary': '#4a1220'
  },
};

export const coralVeil: ThemeDef = {
  id: 'coral-veil',
  name: 'Coral Veil',
  emoji: '🧡',
  description: 'Corals and delicacy',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff7f5,#ffece8)',
  vars: {
    '--bg-primary': '#fff8f7',
    '--bg-secondary': '#fff0ee',
    '--card-bg': '#ffece8',
    '--text-primary': '#231617',
    '--text-secondary': '#8b5a52',
    '--accent-primary': '#ff6f61',
    '--accent-hover': '#ff8b77',
    '--border-primary': '#f4d7d0'
  },
};

export const garnet: ThemeDef = {
  id: 'garnet',
  name: 'Garnet',
  emoji: '🔴',
  description: 'Rich, jewel-toned red',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#170006,#3b0610)',
  vars: {
    '--bg-primary': '#0d0304',
    '--bg-secondary': '#2b0506',
    '--card-bg': '#3a0c0f',
    '--text-primary': '#fff3f3',
    '--text-secondary': '#e6bdbd',
    '--accent-primary': '#b71c1c',
    '--accent-hover': '#e53935',
    '--border-primary': '#4a1415'
  },
};

export const opaline: ThemeDef = {
  id: 'opaline',
  name: 'Opaline',
  emoji: '🟣',
  description: 'Pearlescent, translucent shades',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fbfbff,#f1f0ff)',
  vars: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8f8ff',
    '--card-bg': '#f6f6ff',
    '--text-primary': '#1a1620',
    '--text-secondary': '#6b6070',
    '--accent-primary': '#8e7cc3',
    '--accent-hover': '#b39ddb',
    '--border-primary': '#e9e6f2'
  },
};

export const silhouette: ThemeDef = {
  id: 'silhouette',
  name: 'Silhouette',
  emoji: '🖤',
  description: 'Minimalist elegance',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#010101,#151515)',
  vars: {
    '--bg-primary': '#050505',
    '--bg-secondary': '#0f0f0f',
    '--card-bg': '#171717',
    '--text-primary': '#f8f8f8',
    '--text-secondary': '#9e9e9e',
    '--accent-primary': '#607d8b',
    '--accent-hover': '#90a4ae',
    '--border-primary': '#202020'
  },
};

export const honeyed: ThemeDef = {
  id: 'honeyed',
  name: 'Honeyed',
  emoji: '🍯',
  description: 'Sweet, warm pastels',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fffaf3,#fff1e0)',
  vars: {
    '--bg-primary': '#fffaf6',
    '--bg-secondary': '#fff2ea',
    '--card-bg': '#fff0e6',
    '--text-primary': '#2c1f18',
    '--text-secondary': '#8a6f5f',
    '--accent-primary': '#ffb74d',
    '--accent-hover': '#ffd27a',
    '--border-primary': '#f0d8c0'
  },
};

export const eclipse: ThemeDef = {
  id: 'eclipse',
  name: 'Eclipse',
  emoji: '🌑',
  description: 'Deep, contrasting tones',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#00010a,#0b0a1a)',
  vars: {
    '--bg-primary': '#00020a',
    '--bg-secondary': '#0a0914',
    '--card-bg': '#12121b',
    '--text-primary': '#eef2ff',
    '--text-secondary': '#aab0d8',
    '--accent-primary': '#536dfe',
    '--accent-hover': '#7f93ff',
    '--border-primary': '#1a1a2a'
  },
};

export const amberNight: ThemeDef = {
  id: 'amber-night',
  name: 'Amber Night',
  emoji: '🌃',
  description: 'Warm city lights at night',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#0b0603,#2a1609)',
  vars: {
    '--bg-primary': '#070403',
    '--bg-secondary': '#21100b',
    '--card-bg': '#31150d',
    '--text-primary': '#fff6eb',
    '--text-secondary': '#efd9c1',
    '--accent-primary': '#ff8f00',
    '--accent-hover': '#ffb300',
    '--border-primary': '#3b2416'
  },
};

export const pearlVeil: ThemeDef = {
  id: 'pearl-veil',
  name: 'Pearl Veil',
  emoji: '🩵',
  description: 'Subtle pearlescent accents',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fbfdff,#f2f8ff)',
  vars: {
    '--bg-primary': '#feffff',
    '--bg-secondary': '#f7fbff',
    '--card-bg': '#f2f8ff',
    '--text-primary': '#11131a',
    '--text-secondary': '#6b7280',
    '--accent-primary': '#7ab8ff',
    '--accent-hover': '#9ad0ff',
    '--border-primary': '#e7eef9'
  },
};

export const scarletLace: ThemeDef = {
  id: 'scarlet-lace',
  name: 'Scarlet Lace',
  emoji: '🩷',
  description: 'Lace-like crimson',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#150005,#3b0610)',
  vars: {
    '--bg-primary': '#0b0305',
    '--bg-secondary': '#2a0608',
    '--card-bg': '#3a0d10',
    '--text-primary': '#fff2f3',
    '--text-secondary': '#e6b8bd',
    '--accent-primary': '#c21807',
    '--accent-hover': '#ff4d3f',
    '--border-primary': '#471216'
  },
};

export const velour: ThemeDef = {
  id: 'velour',
  name: 'Velour',
  emoji: '🧣',
  description: 'Soft, enveloping colors',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff8fb,#fff1f6)',
  vars: {
    '--bg-primary': '#fff9fb',
    '--bg-secondary': '#fff2f6',
    '--card-bg': '#fff0f5',
    '--text-primary': '#2b1b22',
    '--text-secondary': '#7a5966',
    '--accent-primary': '#d81b60',
    '--accent-hover': '#ff5c93',
    '--border-primary': '#f4dce6'
  },
};

export const silkRose: ThemeDef = {
  id: 'silk-rose',
  name: 'Silk Rose',
  emoji: '🌷',
  description: 'Delicate petals',
  isDark: false,
  bodyBackground: 'linear-gradient(180deg,#fff6f7,#fff0f2)',
  vars: {
    '--bg-primary': '#fff8f8',
    '--bg-secondary': '#fff1f2',
    '--card-bg': '#fff0f1',
    '--text-primary': '#22111a',
    '--text-secondary': '#7a4f5c',
    '--accent-primary': '#ff3366',
    '--accent-hover': '#ff6b99',
    '--border-primary': '#f3d7df'
  },
};

export const twilightSilk: ThemeDef = {
  id: 'twilight-silk',
  name: 'Twilight Silk',
  emoji: '🌌',
  description: 'Silky nocturnal shades',
  isDark: true,
  bodyBackground: 'linear-gradient(180deg,#0a0612,#241229)',
  vars: {
    '--bg-primary': '#060412',
    '--bg-secondary': '#1b0f21',
    '--card-bg': '#2b1627',
    '--text-primary': '#faf6ff',
    '--text-secondary': '#d9c8e6',
    '--accent-primary': '#7c4dff',
    '--accent-hover': '#a58bff',
    '--border-primary': '#3a213a'
  },
};

