# TODO: Worms — Artillery Strategy Game

## Concept
A classic artillery party game inspired by Worms, Tanks, and Castles. Teams of units take shots at each other on destructible terrain. Two core modes: **Turn-Based** (classic Worms style with movement + shot per turn) and **Real-Time** (simultaneous control, everything happening at once — like Worms: Open Warfare real-time mode). Variants include stationary turrets (Castles/Tanks) and mobile characters (Worms).

## Game Modes

### Single Player
- Campaign: 50+ missions with escalating difficulty and unique objectives
- Challenge mode: specific weapon + scenario puzzles (e.g., "Use only rope to reach all targets")
- Training grounds: practice with each weapon
- Endless survival vs AI waves

### Couch Co-op / Split Screen (up to 4 players)
- **VS Teams**: 1v1, 2v2, FFA with 2-4 teams
- **Co-op Campaign**: Play story missions together with shared team
- **Fort Wars**: Each player builds a fort, then siege begins
- **Hot Seat Turn-Based**: Classic pass-the-controller (or split screen)
- **Real-Time Mode**: All players act simultaneously, chaos mode!

### Online Multiplayer
- Ranked 1v1 and 2v2 lobbies
- Custom games with full rule customization
- Clan wars: team-based seasonal competitions
- Async turn-based mode (play your turn, opponent responds later)
- Spectator and replay sharing

## Gameplay Mechanics

### Variants
1. **Worms Mode**: Mobile characters (walk, jump, rope) on destructible terrain
2. **Tanks Mode**: Vehicles with limited movement, powerful cannons, flat terrain
3. **Castles Mode**: Stationary fortifications, no movement, focus on aim and defense building

### Turn-Based Mode (Classic)
- Each turn: move (limited) → aim → fire one weapon → end turn
- Turn timer (30-60 seconds configurable)
- Wind affects projectiles
- Water/lava = instant death

### Real-Time Mode (Alternative)
- All players control their units simultaneously
- Weapons have cooldowns instead of turn limits
- Continuous movement possible
- Faster-paced, more chaotic
- Optional: configure match to use either mode in settings

### Weapons Arsenal (50+)
- **Basic**: Bazooka, grenade, shotgun, pistol, dynamite
- **Advanced**: Homing missile, napalm, cluster bomb, mine layer
- **Utility**: Ninja rope, jetpack, teleporter, freeze ray
- **Super**: Air strike, earthquake, meteor shower, flood rising
- **Fun**: Banana bomb, holy hand grenade, concrete donkey, exploding sheep

### Terrain
- Fully destructible 2D terrain (pixel-based)
- Procedurally generated landscapes
- Themed environments: grass, snow, desert, underground, alien planet
- Structures that can be built/fortified in Fort Wars mode

### Scoring
- Damage dealt, enemies eliminated, survival bonus
- Style points for creative kills
- Team victories count for ranked progression

## Worlds & Themes
- **Classic** — Green fields, blue sky, cartoony
- **Arctic** — Ice terrain, slippery surfaces, avalanche hazards
- **Volcanic** — Lava pools, eruptions, cave systems
- **Space** — Low gravity, asteroids, vacuum hazards
- **Medieval** — Castles, moats, catapults only mode

## Monetization

### Currency 1: Medals (🎖️)
- Earned from matches, campaign completion, daily challenges
- Used for: basic worm/tank cosmetics, common weapons skins, grave markers

### Currency 2: Gems (💎)
- Premium currency from ranked wins, season pass, achievements
- Used for: premium character sets, rare weapon skins, exclusive terrain themes, voice packs

### Currency 3: Blueprint Tokens (📐)
- Earned from creative play: Fort Wars wins, community map downloads, custom weapon-set sharing
- Used for: custom weapon crafting, fort blueprint imports, advanced map editor tools, profile banners

### Monetizable Content
- Team skin packs (customize your worms/tanks)
- Victory celebration animations
- Weapon skin collections
- Custom terrain themes
- Voice packs for characters (different languages, funny voices)
- Hat collection (classic Worms tradition)

## Technical Considerations
- Destructible terrain engine (pixel/heightmap-based)
- Projectile physics with wind simulation
- Deterministic sync for online play (verified on both clients)
- Real-time terrain deformation sync across network
- Replay system with full projectile path recording
- Level editor with terrain brushes and object placement
