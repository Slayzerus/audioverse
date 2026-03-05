# TODO: Ultimate Chicken Horse — Platform Builder Party Game

## Concept
A party platformer where players take turns placing obstacles and platforms in a level, then all race to reach the goal. The trick: make it hard enough that your opponents fail, but easy enough that you can still complete it. Chaotic, creative, and endlessly replayable.

## Game Modes

### Single Player
- Challenge mode: pre-built levels with increasing difficulty
- Creator sandbox: build and share custom levels
- Daily challenge: community-voted obstacle course, leaderboard times
- AI opponents with adjustable difficulty (cautious / balanced / devious placement)

### Couch Co-op / Split Screen (up to 4 players)
- **Classic**: Take turns placing one obstacle, then all race — score points for finishing while others fail
- **Party Mode**: Random obstacle selection, speed rounds, bonus modifiers
- **Creative Co-op**: Build levels together collaboratively, then challenge each other
- **Team VS (2v2)**: Teams place obstacles targeting the other team's route

### Online Multiplayer
- Matchmaking for 2-8 players
- Custom lobbies with room codes
- Ranked competitive mode with ELO rating
- Community level sharing & rating system
- Spectator mode for tournaments

## Gameplay Mechanics

### Core Loop
1. **Selection Phase** (real-time, timed): Each player picks an obstacle/platform from a random pool
2. **Placement Phase** (real-time, timed): Everyone places their piece simultaneously (visible to all)
3. **Race Phase**: All players race to the flag — physics-based, side-scrolling platforming
4. **Scoring**: Points for finishing; bonus for being the only one to finish; penalty if everyone finishes easily

### Obstacle Types
- **Platforms**: Static, moving, crumbling, bouncy, icy, one-way
- **Hazards**: Spikes, saws, fire jets, lasers, cannons, falling anvils
- **Gadgets**: Conveyor belts, teleporters, springs, fans, magnets
- **Traps**: Fake platforms, hidden spikes, timed explosions
- **Environmental**: Water zones, wind currents, gravity inverters

### Real-time Focus
- All phases are real-time with countdown timers
- No turn waiting — simultaneous placement with ghost previews
- Race phase is always real-time platforming
- Overtime mode: if no one finishes, obstacles slowly disappear

### Level Editor
- Grid-based placement with snap-to options
- Test play immediately after building
- Share levels with tags and difficulty rating
- Community voting and featured levels weekly

## Character Roster
- Unlockable characters with unique cosmetics (no gameplay differences)
- Character skins, hats, trails, victory animations
- Seasonal and event-exclusive cosmetics

## Monetization

### Currency 1: Coins (🪙)
- Earned from races (win bonuses), completing challenges, daily login
- Used for: basic characters, common cosmetics, level editor props

### Currency 2: Gems (💎)
- Earned from ranked wins, weekly challenges, achievements, season pass
- Used for: premium characters, rare skins, exclusive obstacle packs, emotes

### Currency 3: Creator Points (🏗️)
- Earned from community level engagement (plays, likes, features)
- Used for: advanced editor tools, custom obstacle creation, profile badges, level slots

### Monetizable Content
- Character skins and costumes
- Victory celebration animations
- Obstacle skin packs (themed: sci-fi, medieval, candy)
- Custom level music
- Season passes with exclusive content tracks

## Technical Considerations
- Physics engine for reliable platforming across network
- Deterministic simulation for online play
- Level serialization format for sharing
- Anti-grief measures for placement (no blocking spawn, no instant-kill setups)
- Replay system for memorable moments
