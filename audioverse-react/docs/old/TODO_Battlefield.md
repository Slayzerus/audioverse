# TODO: Battlefield — 3D Multiplayer Shooter (Multi-World)

## Concept
A multiplayer 3D first/third-person shooter with Minecraft-style voxel graphics but full vehicle combat (tanks, helicopters, boats, horses, dragons). Multiple distinct worlds with completely different settings, weapons, and vehicles — each world is its own game within the game. Inspired by Battlefield and Urban Terror, but spanning Fantasy, Medieval, Modern, and Sci-Fi universes.

## Game Modes

### Single Player
- Story campaign per world (10-15 missions each)
- Bot matches on any map with configurable difficulty
- Weapon and vehicle training grounds
- Conquest challenges: hold all points solo against AI waves

### Couch Co-op / Split Screen (up to 4 players)
- **VS**: Split-screen deathmatch, TDM, Conquest with bots filling slots
- **Co-op Campaign**: Play story missions together on split screen
- **Survival Co-op**: Defend base against increasing enemy waves
- **Vehicle Derby**: Arena combat with world-specific vehicles

### Online Multiplayer
- **Large Scale**: 32-64 players per server (Conquest, Rush)
- **Competitive**: 5v5 ranked modes (Search & Destroy, Bomb Defusal)
- **Mixed**: 16-32 player modes (TDM, Domination, CTF)
- Server browser + quick matchmaking
- Cross-world events: limited-time modes mixing world assets
- Clan system with territories and persistent wars

## Worlds & Factions

### 🏰 Medieval World
- **Factions**: Knights, Vikings, Ottoman, Samurai
- **Weapons**: Swords, axes, bows, crossbows, pikes, flails, catapults
- **Vehicles**: War horses, battering rams, siege towers, carts, trebuchets
- **Maps**: Castle sieges, open fields, forest skirmishes, harbor battles
- **Special**: Boiling oil, drawbridges, arrow volleys

### 🐉 Fantasy World
- **Factions**: Humans, Elves, Orcs, Undead
- **Weapons**: Magic staffs, enchanted swords, bows, wands, runic grenades
- **Vehicles**: Dragons, gryphons, war elephants, flying carpets, golem mounts
- **Maps**: Floating islands, dark forests, volcanic fortresses, crystal caves
- **Special**: Spell casting, elemental effects, summon creatures

### 🔫 Modern World
- **Factions**: NATO, OPFOR, PMC, Insurgents
- **Weapons**: Assault rifles, SMGs, sniper rifles, LMGs, RPGs, C4
- **Vehicles**: Tanks, APCs, helicopters, jets, boats, jeeps, motorcycles
- **Maps**: Urban warfare, desert, jungle, arctic base, oil rig
- **Special**: Airstrikes, drone recon, EMP, thermal vision

### 🚀 Sci-Fi World
- **Factions**: Federation, Rebellion, Alien Collective, Android Legion
- **Weapons**: Plasma rifles, laser cannons, railguns, energy swords, gravity grenades
- **Vehicles**: Hover tanks, starfighters, mechs, dropships, speeders
- **Maps**: Space stations, alien planets, megacities, asteroid fields
- **Special**: Shield generators, teleporters, cloaking, orbital strikes

## Gameplay Mechanics

### Core Combat
- Class system per world: Assault, Medic, Engineer, Recon (flavor differs per world)
- TTK balanced between realistic and arcade (2-4 body shots to kill)
- Vehicle entry/exit, passenger seats, driver/gunner roles
- Destructible environment (voxel terrain deformation from explosions)
- Revive system, healing, ammo supply from teammates

### Game Mode Types
- **Conquest**: Hold flag points, drain enemy tickets
- **Rush**: Attack/defend sequential objectives
- **TDM**: Team kills goal
- **Domination**: Small-map fast flag capture
- **Operations**: Multi-map narrative scenarios
- **Survival**: PvE wave defense (all worlds)

### Progression
- Per-world rank and unlocks
- Cross-world player level
- Weapon attachments and customization
- Class specializations and perks
- Vehicle upgrades (armor, speed, firepower)

### Races & Characters
- Each faction has unique character models and voice lines
- Cosmetic customization: armor, clothing, face, markings
- No gameplay advantage from cosmetics

## Monetization

### Currency 1: Credits (💰)
- Earned from match XP, challenges, daily login
- Used for: basic weapon attachments, common skins, vehicle paint jobs

### Currency 2: War Bonds (🎗️)
- Earned from ranked victories, seasonal operations, community events
- Used for: premium character skins, rare weapon camos, elite vehicle liveries, emotes

### Currency 3: Faction Tokens (⚔️)
- Earned from faction-specific achievements, clan wars, conquest dominance
- Used for: faction exclusive gear, world-specific DLC access, custom server creation, profile banners

### Monetizable Content
- Weapon skin collections (per world themed)
- Character outfit sets
- Vehicle livery and decal packs
- Custom dog tags and player cards
- Voice line packs
- Additional world DLC expansions

## Technical Considerations
- Voxel-based terrain with efficient LOD rendering (think Minecraft but tactical)
- Vehicle physics: land, air, sea with consistent handling model
- Large-scale networking: 64-player state sync at 30-60 tick
- Cross-world asset pipeline: modular weapon/vehicle system
- Audio: 3D positional audio, world-specific soundscapes
- Anti-cheat system for competitive integrity
- Map editor for community content
- Replay and spectator system for esports
