# TODO: Tetris / PuyoPuyo — Puzzle Collection

## Concept
A comprehensive puzzle game collection combining Tetris, PuyoPuyo, and similar falling-block/matching puzzle games into a unified experience. Each puzzle type is a different "mode" within the same game, with shared competitive features. All modes support single, couch, and online play. Real-time competitive focus with attack mechanics.

## Game Modes (Puzzle Types)

### 🟦 Tetris Classic
- Standard falling tetrominoes
- Clear lines to score, speed increases over time
- Modern features: Hold piece, Next preview (1-5), Ghost piece, T-spin detection

### 🔴 PuyoPuyo
- Falling pairs of colored blobs
- Match 4+ of same color to clear
- Chain reactions: sequential clears for massive damage
- Fever mode: pre-built chains for rapid combos

### 🟨 Columns
- Falling columns of 3 colored gems
- Match 3+ horizontally, vertically, or diagonally
- Magic gems: clear all of one color

### 🟩 Dr. Mario / Virus Buster
- Clear colored viruses by matching 4 in a row
- Falling pill capsules of two colors each
- Stage-based: clear all viruses to proceed

### 🟪 Panel de Pon / Puzzle League
- Rising blocks from below
- Swap adjacent blocks to make matches
- Chains and combos from gravity cascades
- Frantic real-time puzzle action

### 🟧 Lumines
- 2x2 falling blocks of two colors
- Timeline sweeps across to clear formed rectangles
- Music-reactive gameplay, beat-synced sweeps

## Play Modes Per Puzzle

### Single Player
- **Marathon**: Play until you top out, chase high scores
- **Sprint**: Clear 40 lines / 100 blobs as fast as possible
- **Ultra**: Score as many points as possible in 3 minutes
- **Campaign**: Per-puzzle-type progressing difficulty with starred ratings
- **Puzzle Mode**: Pre-set boards to clear in limited moves
- **Endless Zen**: No pressure, no speed increase, relaxation mode

### Couch Co-op / Split Screen (up to 4 players)
- **VS Battle**: Side-by-side competitive with attack mechanics (garbage rows/blocks)
- **Co-op**: Shared wide board, work together
- **Team VS (2v2)**: Attack goes to opposing team
- **Tournament**: Round-robin bracket across all puzzle types
- **Score Attack**: Same pieces, who scores higher?
- **Mixed Puzzle Relay**: Each round switches puzzle type

### Online Multiplayer
- **Ranked 1v1**: Per puzzle type ELO ladder
- **Free Play**: Casual lobbies
- **Marathon Leaderboards**: Global high score tables
- **Sprint Records**: Fastest completion times
- **Tournaments**: Weekly community events
- **Spectator Mode**: Watch top players live

## Competitive Mechanics

### Attack System (VS Mode)
- Clearing multiple lines/chains sends garbage to opponent
- **Tetris**: Single=0, Double=1, Triple=2, Tetris(4)=4, T-spin variants
- **PuyoPuyo**: Chain multiplier → exponential garbage
- **Universal**: Combo counter, back-to-back bonuses, perfect clear bonuses
- Garbage queuing and cancellation (counter attacks)

### Handicap System
- Adjustable handicap for skill differences
- Weaker player gets bonus garbage delay
- Stronger player starts with pre-placed blocks
- Auto-matching skill levels online

### Cross-Puzzle VS
- Play different puzzle types against each other
- Balanced attack value conversion between puzzle types
- e.g., Tetris player vs PuyoPuyo player — garbage is translated fairly

## Customization

### Visual Themes
- Classic retro, modern minimal, neon cyberpunk, nature, space, candy
- Custom piece/blob skins
- Board border designs
- Background animations

### Audio
- Multiple BGM tracks per theme
- Custom sound effect packs
- Adjustable music speed with gameplay speed

### Gameplay Tweaks
- Gravity speed curves
- Lock delay settings
- DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate) configuration
- SRS (Standard Rotation System) or classic rotation options
- Garbage type (clean/messy/random)

## Monetization

### Currency 1: Puzzle Points (🧩)
- Earned from games played, lines cleared, chains completed, daily challenges
- Used for: basic themes, common piece skins, sound packs

### Currency 2: Crystal Gems (💎)
- Earned from ranked wins, tournament placement, sprint/marathon records
- Used for: premium themes, animated backgrounds, rare piece designs, exclusive BGM tracks

### Currency 3: Master Tokens (🏅)
- Earned from mastery achievements (10K lines, 1000 match wins, etc.), community events
- Used for: custom theme creation tools, exclusive player titles, profile frames, beta access to new puzzle modes

### Monetizable Content
- Piece/blob skin collections
- Board themes and backgrounds
- BGM packs (licensed or original)
- Custom cursor/ghost piece effects
- Victory animations
- Player card and rank border designs

## Technical Considerations
- Standard piece randomizer (7-bag for Tetris; balanced pair generation for PuyoPuyo)
- Frame-perfect input handling (sub-frame if possible)
- Deterministic game logic for replays and competitive fairness
- Network: rollback netcode for real-time competitive (critical for puzzle games)
- Garbage translation matrix for cross-puzzle VS balancing
- Leaderboard anti-cheat: server-side game state verification
- Replay system with full input recording
- Accessibility: colorblind modes with pattern-marked pieces, screen reader support
