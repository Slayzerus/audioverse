# TODO: Battle of Wesnoth — Fantasy Strategy Wargame

## Concept
A deep hex-based strategy wargame inspired by Battle of Wesnoth. Recruit armies, manage gold, conquer territory across sprawling campaigns. Multiple unique worlds/factions with their own unit trees, lore, and aesthetics. Both turn-based (classic) and real-time (alternative) modes. Very deep with dozens of unit types, terrain bonuses, and campaign branching.

## Game Modes

### Single Player
- **Grand Campaign**: 15-20 mission branching campaigns per world (60+ total)
- **Skirmish**: Quick match vs AI on random or preset maps
- **Scenario Editor**: Create and play custom scenarios
- **Puzzle Battles**: Fixed units, solve tactical problems
- **Survival**: Defend your castle against infinite waves, how long can you last?

### Couch Co-op / Split Screen (up to 4 players)
- **2v2 Team VS**: Allied factions with complementary unit trees
- **FFA**: 3-4 player free-for-all on symmetric maps
- **Co-op Campaign**: Play story missions with shared army management
- **Hot Seat**: Classic pass-and-play (or simultaneous on split screen)
- **Draft Mode**: Alternately pick units from a shared pool, then battle

### Online Multiplayer
- Ranked 1v1 and 2v2 with ELO-based matchmaking
- Custom lobbies for up to 8 players
- Tournaments with bracket system
- Async play: take your turn when you want, opponent responds later
- Map and scenario sharing
- Spectator mode and replay library

## Gameplay Mechanics

### Core Strategy
- **Hex-grid maps** with terrain types: plains, forest, hills, mountains, water, swamp, castle, village
- **Terrain bonuses**: Defense % and movement cost per terrain per unit type
- **Day/Night cycle**: Affects unit effectiveness (lawful units stronger by day, chaotic by night)
- **Zone of Control**: Adjacent enemies restrict movement
- **Gold economy**: Capture villages for income, recruit units from keep

### Turn-Based Mode (Classic)
- Each unit moves and attacks once per turn
- Damage has randomness range (e.g., 5-8 damage per strike)
- Counter-attacks when attacked in melee
- Experience → level up → choose between 2 advancement paths per unit

### Real-Time Mode (Alternative)
- Units move freely, cooldown-based attacks
- Positioning and micro-management become key
- Speed control: 0.5x, 1x, 2x game speed
- Auto-battle option for individual units
- Same unit stats and terrain rules, just continuous movement

### Unit System (per faction)
- **Tier 1**: Cheap fodder and scouts (3-4 types)
- **Tier 2**: Core army (4-6 types, promoted from Tier 1)
- **Tier 3**: Elite (4-6 types, promoted from Tier 2)
- **Tier 4**: Legendary (2-3 types, max promotion)
- **Hero Units**: Unique named characters with special abilities

### Campaign Features
- Persistent army: units carry over between missions
- Recall system: bring back veteran units
- Branching storylines: choices affect which missions you play
- Side quests: optional objectives for bonus gold/items
- Inventory: hero units can equip artifacts found in missions

## Worlds & Factions

### ⚔️ Classic Fantasy
- **Factions**: Kingdom of Men, Elven Alliance, Orcish Horde, Undead Legion, Dwarven Clans, Drakes
- Classic fantasy warfare with magic, melee, and archery

### 🏚️ Post-Apocalypse
- **Factions**: Survivors, Mutant Tribes, Tech Cultists, Raider Warlords
- Radiation zones as terrain, scavenged weapons, improvised fortifications

### 🚀 Sci-Fi
- **Factions**: Earth Federation, Alien Swarm, Robot Collective, Psionic Order
- Lasers, mechs, hover vehicles, orbital support abilities

### 🏴 Historical
- **Factions**: Roman Legion, Celtic Tribes, Norse Raiders, Byzantine Empire
- No magic, realistic units, historical campaigns

## Monetization

### Currency 1: Gold (💰)
- Earned from campaign completion, skirmish wins, daily quests
- Used for: basic faction skins, common unit cosmetics, map packs

### Currency 2: Honor (🏆)
- Earned from ranked victories, tournament placement, campaign mastery
- Used for: premium unit skins, hero cosmetics, exclusive factions/world access, profile banners

### Currency 3: Lore Crystals (🔮)
- Earned from exploration achievements, finding easter eggs, creating popular community content
- Used for: alternate campaign paths, legendary unit reskins, custom scenario editor features, behind-the-scenes lore entries

### Monetizable Content
- Additional world/faction DLC packs
- Unit skin collections per faction
- Hero character alternate appearances
- Campaign expansion packs (new storylines)
- Custom map themes and tilesets
- Soundtrack per world

## Technical Considerations
- Hex-grid renderer with smooth animations
- Dual game engine: turn-based and real-time sharing unit stats
- Campaign save system with persistent army state
- AI: strategic planning, unit composition, terrain exploitation
- Map editor with tile painting, unit placement, event scripting
- Multiplayer: async turn support + real-time sync
- Modding: custom factions, units, campaigns, maps
