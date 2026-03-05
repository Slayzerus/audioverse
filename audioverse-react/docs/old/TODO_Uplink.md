# TODO: Uplink — Hacker Simulation Game

## Concept
A hacking simulation game inspired by Uplink, where players take on the role of freelance hackers. Multiple difficulty systems: from drag-and-drop block puzzles (easiest) to actual code writing (hardest). Features hardware upgrades, police heat mechanics, raids, relocation, and a deep progression system.

## Game Modes

### Single Player
- Story-driven career mode: accept contracts from shady corporations, rival hackers, whistleblowers
- Open sandbox endless mode with procedurally generated contracts
- Tutorial campaign teaching mechanics from easy to elite difficulty
- Reputation system affecting available jobs and pay

### Couch Co-op / Split Screen (up to 4 players)
- **Co-op**: Team-based hacking — one person handles firewall bypass, another manages trace evasion, another decrypts, another exfiltrates
- **VS**: Competitive hacking races — same target, first to extract wins
- **Hybrid**: Rival hacker teams (2v2) competing for the same contracts

### Online Multiplayer
- Matchmaking lobbies for VS and co-op modes
- Persistent world: players' actions affect a shared corporate ecosystem
- Player-vs-player hacking: attack each other's systems, steal data, plant malware
- Leaderboards: fastest hacks, most money earned, longest streak without police bust

## Gameplay Mechanics

### Difficulty Levels
1. **Casual** — Visual block-based hacking (connect nodes, rotate pipes, match patterns)
2. **Standard** — Terminal commands from a predefined set, timing-based password cracking
3. **Advanced** — Write simple scripts (real code snippets), manage memory/CPU resources
4. **Elite** — Full code editor with real language support, complex multi-stage intrusions

### Core Systems
- **Hardware Upgrades**: CPU, RAM, storage, network card, cooling — each affects hacking speed, capacity, trace evasion
- **Software Arsenal**: Firewalls, password crackers, proxy bouncers, log cleaners, virus kits
- **Heat System**: Every hack increases police attention. Get raided → lose equipment, face jail time
- **Relocation**: Move to different cities/countries for different legal environments and targets
- **Black Market**: Buy/sell stolen data, tools, zero-day exploits

### Real-time Alternative
- All hacking minigames run in real-time with countdown timers
- Trace timer always ticking — race against detection
- Co-op roles operate simultaneously, not sequentially

## Worlds & Themes
- **Corporate Espionage** — Modern setting, glass towers, stock manipulation
- **Cyberpunk** — Neon dystopia, AI targets, neural network hacking
- **Cold War** — Retro terminals, government secrets, spy thriller
- **Sci-Fi** — Space station systems, alien tech reverse-engineering

## Monetization

### Currency 1: Credits (💰)
- Primary soft currency earned from completing contracts
- Used for: basic hardware, common software, safe house rent

### Currency 2: Bitcoin (₿)
- Premium currency earned from elite contracts, daily rewards, achievements
- Used for: rare tools, exotic hardware, premium safe house locations, cosmetic terminal themes

### Currency 3: Reputation Tokens (⭐)
- Earned from PvP wins, leaderboard placement, community challenges
- Used for: exclusive hacker aliases, UI skins, elite contract access, faction perks

### Monetizable Content
- Terminal themes and color schemes
- Hacker avatar customization
- Custom sound effects for hacking actions
- Additional story campaigns / world packs
- Hardware skin cosmetics

## Technical Considerations
- Code editor integration for elite mode (Monaco-based or custom)
- Sandboxed code execution for player-written scripts
- Procedural contract generation system
- Network topology visualization for hack targets
- Save system: hardware state, reputation, finances, contract history
