# TODO: Fallout / Baldur's Gate — Isometric RPG

## Concept
A deep isometric RPG inspired by Fallout 1 & 2 and Baldur's Gate. Massive open world with branching storylines, faction politics, and meaningful choices. **Hybrid combat**: real-time exploration with optional turn-based combat (like Baldur's Gate) PLUS a fully real-time combat alternative selectable in settings. Multiple worlds with distinct settings.

## Game Modes

### Single Player
- **Main Campaign**: 60-100+ hour branching story with multiple endings
- **Sandbox Mode**: Open world to explore, quest, and build without story pressure
- **New Game+**: Replay with higher difficulty and carry-over perks
- **Ironman Mode**: Permadeath, autosave only, no reloading

### Couch Co-op / Split Screen (up to 4 players)
- **Co-op Campaign**: 2-4 players share the same world, can split up or stick together
- **Shared Party**: Players each control 1-2 party members in combat
- **Arena VS**: Turn-based or real-time combat duels between player parties
- **Trading & Diplomacy**: Players can be rival faction leaders in co-op sandbox

### Online Multiplayer
- **Co-op Campaign**: Play the main story with friends (drop-in/drop-out)
- **Persistent World**: MMO-lite — shared server with player settlements, trading, PvP zones
- **Arena Matches**: Competitive party combat (ranked, tournament)
- **Dungeon Raids**: Co-op procedural dungeon crawls for rare loot
- **Faction Wars**: Guild-based territory control on persistent map

## Gameplay Mechanics

### Combat Modes (Player's Choice)
1. **Turn-Based** (Classic): Initiative order, action points, tactical grid positioning, VATS-like targeting
2. **Real-Time with Pause** (BG-style): Real-time movement with ability to pause and issue commands
3. **Full Real-Time** (Action RPG): Direct WASD/stick control, cooldown-based abilities, dodge/roll

### Character System
- **SPECIAL-like Stats**: Strength, Perception, Endurance, Charisma, Intelligence, Agility, Luck
- **Skills**: 20+ skills (lockpicking, speech, medicine, science, melee, firearms, stealth, barter, etc.)
- **Perks**: Every 2-3 levels, choose a unique perk with game-changing effects
- **Traits**: Optional positive+negative modifiers at character creation
- **Companions**: Recruitable NPCs with their own stories, opinions, and loyalty

### World Systems
- **Reputation**: Per-faction standing affecting dialogue, quests, shop prices
- **Karma**: Moral alignment from player choices
- **Day/Night Cycle**: Affects NPC schedules, enemy spawns, stealth viability
- **Economy**: Dynamic supply/demand across settlements
- **Crafting**: Weapons, armor, consumables, settlements

### Dialogue & Quests
- Branching dialogue trees with skill/stat checks
- Multiple solutions per quest (combat, speech, stealth, science, barter)
- Consequences carry through the game — choices from hour 1 affect the ending
- Companion commentary and approval system

### Exploration
- Large procedurally-enhanced handcrafted maps
- Random encounters on world map travel
- Hidden locations, secret quests, environmental storytelling
- Inventory management: weight/slot-based

## Worlds & Settings

### 🏚️ Post-Apocalypse (Fallout-inspired)
- Wasteland survival, radiation, mutants, vaults, retro-futuristic tech
- Factions: Vault Dwellers, Raiders, Scientists, Military Remnants, Mutant Tribes

### ⚔️ High Fantasy (Baldur's Gate-inspired)  
- Magic, gods, dungeons, dragons, political intrigue
- Factions: Kingdom, Mage Circle, Thieves Guild, Clergy, Forest Alliance

### 🔧 Steampunk
- Victorian-era technology, airships, clockwork automatons, gas-lit cities
- Factions: Industrialists, Crown Loyalists, Underground Rebels, Inventors Guild

### 🌌 Sci-Fi
- Space colonization, alien diplomacy, cybernetics, AI sentience
- Factions: Corporation, Colonists, Free Traders, Synthetic Rights Movement

## Monetization

### Currency 1: Gold/Caps (💰)
- Primary in-game currency earned from quests, loot, trading
- Used for: weapons, armor, items, services, property

### Currency 2: Essence (✨)
- Premium meta-currency earned from achievements, daily challenges, season milestones
- Used for: cosmetic character skins, UI themes, additional companion skins, mount cosmetics, housing decorations

### Currency 3: Lore Tokens (📜)
- Earned from deep exploration, finding all collectibles, completing lore challenges, community contributions
- Used for: alternate world DLC access, exclusive companion backstory quests, soundtrack access, concept art gallery, developer commentary mode

### Monetizable Content
- Additional world/setting DLC campaigns
- Character cosmetic packs (outfits, hair, markings)
- Companion costume sets
- Housing/settlement decoration themes
- Custom soundtrack and ambient sound packs
- Alternate voice acting language packs

## Technical Considerations
- Isometric renderer with dynamic lighting and weather
- Dual combat engine: turn-based grid + real-time action sharing same units/stats
- Dialogue scripting engine with conditional branches
- Procedural dungeon generation for raids
- Save system: full world state serialization
- Modding support: custom quests, items, companions, maps
- AI: pathfinding, behavior trees, companion AI tactics
- Network: state sync for co-op with host authority
