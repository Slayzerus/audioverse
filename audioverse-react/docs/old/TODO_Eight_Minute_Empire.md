# TODO: Eight Minute Empire — Area Control Strategy

## Concept
A fast-paced area control strategy game inspired by Eight Minute Empire. Players buy action cards to move armies, place new units, build cities, and control regions on a map. Quick matches (~8 minutes) with deep strategic choices. **Real-time mode** as primary — simultaneous card selection with timers, no waiting for turns.

## Game Modes

### Single Player
- **Campaign**: Conquer increasingly complex maps against AI
- **Puzzle Mode**: Fixed starting positions, find the optimal card sequence to win
- **Endless Conquest**: Procedurally generated maps, expand your empire indefinitely
- **AI Challenge Ladder**: Beat progressively smarter AI opponents

### Couch Co-op / Split Screen (up to 4 players)
- **Classic VS**: 2-4 players compete on shared map
- **Team Conquest (2v2)**: Allied empires with shared scoring
- **Blitz Mode**: Ultra-fast real-time, 3-minute matches
- **Draft Mode**: Alternately pick starting positions and bonuses
- **Co-op Conquest**: Together against powerful AI empires

### Online Multiplayer
- Ranked 1v1-4 with matchmaking
- Custom games with map selection and rule tweaks
- Weekly tournament automatic brackets
- Seasonal ranked ladder
- Async mode: play your turn when convenient (turn-based option)

## Gameplay Mechanics

### Real-Time Mode (Primary)
- Each round: all players simultaneously pick from a shared card row
- **Timer per round**: 15-30 seconds (configurable)
- Conflict resolution: if two players pick the same card, highest bidder wins
- Actions execute simultaneously after all picks — collisions resolved by priority
- No downtime: every player is always engaged

### Turn-Based Mode (Alternative)
- Classic: players take turns in order, pick one card per turn
- No timer pressure for more strategic play
- Available as settings toggle

### Card Actions
- **Move**: Move X armies from one adjacent region to another
- **Place Armies**: Add X new units to regions you control
- **Build City**: Place a city in a controlled region (scoring + defense)
- **Destroy**: Remove enemy armies from adjacent regions
- **Sail**: Move armies across water routes
- **Special**: Unique per-game bonuses (double action, teleport, fortify)

### Scoring (End of Game)
- **Region Control**: Most armies in a region = control it → points per region
- **Continent Bonus**: Control all regions of a continent → bonus points
- **Cities**: Each city = 1 point
- **Resource Sets**: Collected from cards — sets of matching/different resources score
- **Achievements**: In-game bonuses (first to build, most battles won, etc.)

### Map System
- Grid of interconnected regions forming continents
- Water routes connecting distant coasts
- Procedurally generated maps with fairness balancing
- Terrain types affecting defense and movement
- 3-8 minute games depending on map size setting

## Worlds & Themes
- **Classic**: Medieval fantasy map with kingdoms and forests
- **Space**: Galactic map with planets and hyperspace lanes
- **Ancient**: Mediterranean empires, historical flavor
- **Underwater**: Ocean floor regions, current-based movement

## Monetization

### Currency 1: Coins (🪙)
- Earned from matches (win bonus), daily challenges, campaign progress
- Used for: basic army skins, common card back designs, standard map themes

### Currency 2: Crowns (👑)
- Earned from ranked wins, seasonal achievements, tournament placement
- Used for: premium army unit designs, rare card art, exclusive map themes, victory animations

### Currency 3: Cartographer Points (🗺️)
- Earned from community map ratings, discovering easter eggs, creating popular custom maps
- Used for: advanced map editor tools, custom card ability creation, exclusive board themes, profile borders

### Monetizable Content
- Army piece designs (different miniature styles per world)
- Card back and card art collections
- Map skin packs (board appearance themes)
- Victory celebration animations
- Custom game mode rule sets
- Profile avatars and borders

## Technical Considerations
- Efficient region control state management
- Simultaneous selection conflict resolution algorithm
- Card row management with fair randomization
- Map generator with balanced region distribution
- AI: lookahead search for optimal card selection
- Network: lightweight state sync (card picks + army positions)
- Replay system for analysis
