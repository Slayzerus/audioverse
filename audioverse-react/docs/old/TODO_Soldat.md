# TODO: Soldat — 2D Platformer Shooter

## Concept
A fast-paced 2D side-scrolling multiplayer shooter inspired by Soldat. Realistic ballistics with one-hit-one-kill lethality (or low TTK). Players run, jump, jet-pack, and dive across maps in intense firefights. Focus on skill-based movement (bunny hopping, jet control) and aim precision.

## Game Modes

### Single Player
- Bot matches with adjustable difficulty (training to veteran)
- Campaign missions: rescue hostages, defend positions, infiltration
- Time trials: speedrun through obstacle courses with kills
- Weapon mastery challenges

### Couch Co-op / Split Screen (up to 4 players)
- **Deathmatch**: FFA or team-based
- **Capture the Flag**: 2v2 split screen
- **Co-op Survival**: Defend against bot waves together
- **King of the Hill**: Control points, split screen competitive
- **Infiltration Co-op**: Stealth missions together

### Online Multiplayer
- Up to 32 players per server
- Game modes: DM, TDM, CTF, Rambo (one player is super-powered), Pointmatch
- Custom server hosting with mod support
- Ranked competitive queue (5v5)
- Clan system with wars and tournaments

## Gameplay Mechanics

### Movement
- **Running**: Full left/right movement with momentum
- **Jumping**: Variable height, wall jumping
- **Jet Pack**: Limited fuel, allows flight and hovering — recharges on ground
- **Prone/Dive**: Go prone for accuracy, slide-dive for speed
- **Bunny Hop**: Skill-based movement technique for speed

### Combat
- **1-hit-1-kill** for most weapons (realistic lethality)
- Bullet physics: travel time, drop, penetration
- **Weapons**: Pistol, SMG, Assault Rifle, Shotgun, Sniper, Minigun, Rocket Launcher, Chainsaw, Knife
- Secondary: Grenades, Claymores, Medkits (in team modes)
- Dual-stick aiming (right stick or mouse) independent of movement

### Map Design
- Medium-sized maps with vertical and horizontal gameplay
- Destructible cover elements
- Weapon pickups on map
- Multiple spawn points to prevent camping
- Dynamic elements: moving platforms, environmental hazards

### Game Modes Detail
- **Deathmatch**: Most kills wins
- **Team DM**: Team score accumulation
- **Capture the Flag**: Classic 2-flag CTF
- **Rambo**: One player spawns with double health + all weapons, everyone hunts them
- **Pointmatch**: Hold the flag, earn 1 point/second while holding
- **Survival**: Last person/team standing, no respawns per round

## Worlds & Themes
- **Military** — Desert bases, jungle outposts, urban warfare
- **Sci-Fi** — Space stations, alien planets, neon cities
- **Medieval** — Castles, crossbows, catapults reskinned weapons
- **Post-Apocalypse** — Ruined cities, wasteland, improvised weapons

## Monetization

### Currency 1: Dog Tags (🏷️)
- Earned from kills, assists, match completion, objectives
- Used for: basic weapon skins, character clothing, basic emotes

### Currency 2: Combat Medals (🎖️)
- Earned from ranked victories, tournament placement, achievement milestones
- Used for: premium weapon skins, elite uniforms, kill effect trails, profile banners

### Currency 3: Prestige Points (⭐)
- Earned from season pass progression, community map creation, clan victories
- Used for: exclusive characters, weapon sound packs, map editor features, custom game mode creation

### Monetizable Content
- Weapon skin collections
- Character outfits and gear sets
- Jet pack trail effects
- Kill feed icons
- Custom crosshairs
- Death animations
- Voice lines / taunts

## Technical Considerations
- Sub-pixel 2D physics for accurate ballistics
- Client-side prediction with server reconciliation (lag compensation)
- Hit registration system (favor-the-shooter vs server-authoritative)
- Map editor with tile-based and polygon colliders
- Replay system with kill-cam
- Network performance: 60 tick rate for competitive play
