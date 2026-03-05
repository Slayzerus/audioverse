# TODO: Tooth and Tail — Simplified RTS for Controllers

## Concept
A streamlined real-time strategy game designed for gamepad play, inspired by Tooth and Tail. One button sends units, another builds structures, another activates specials. Players command armies through a hero character who rallies troops rather than traditional click-to-select RTS mechanics. Two variants: fighting hero who also battles, and commander-only hero who directs units without fighting.

## Game Modes

### Single Player
- Story campaign: lead your faction through a revolution (30+ missions)
- Skirmish vs AI: customizable bot difficulty, map size, win conditions
- Survival: defend your base against escalating waves
- Puzzle missions: fixed units, solve tactical problems

### Couch Co-op / Split Screen (up to 4 players)
- **1v1 VS**: Classic duel, split screen with fog of war
- **2v2 Team VS**: Allied factions with shared vision, coordinated attacks
- **Co-op Survival**: Both players defend a shared base
- **FFA (Free for All)**: 3-4 player chaos on symmetric maps

### Online Multiplayer
- Ranked 1v1 and 2v2 matchmaking with ELO
- Custom lobbies for up to 8 players (4v4)
- Tournament mode with brackets
- Replay sharing and spectator mode
- Seasonal ranked ladder with rewards

## Gameplay Mechanics

### Controller-First Design
- **Move**: Left stick controls hero movement
- **Rally (A/X)**: All nearby units follow hero and attack targets near hero
- **Build (B/O)**: Open radial menu near a farm/den → select structure
- **Special (Y/△)**: Activate hero ability or unit special power
- **Select Unit Type (D-pad)**: Cycle unit types to rally specific groups
- **Retreat (LT/L2)**: All units fall back to base

### Hero Variants
1. **Commander Mode**: Hero cannot attack, moves faster, has map-wide rally range upgrade, strategic abilities (heal aura, speed boost, reveal)
2. **Fighter Mode**: Hero has combat stats, fights alongside units, has powerful personal abilities (charge, area attack, shield), but shorter rally range

### Unit Types (per faction)
- **Tier 1 — Swarm**: Cheap, fast, expendable melee units
- **Tier 2 — Ranged**: Archers/gunners, moderate cost, fragile
- **Tier 3 — Heavy**: Tanks/brutes, expensive, slow, powerful
- **Tier 4 — Special**: Unique per faction (healers, siege, flying, stealth)

### Economy
- Build farms on food patches (limited per map)
- Farms generate food over time → food pays for units and structures
- Deny enemy food by destroying their farms
- No resource gathering micro — fully automatic income

### Real-time Core
- Everything is real-time — no pausing, no turns
- Matches are 5-15 minutes target length
- Fast build times, fast unit production
- Sudden death: after time limit, all farms decay, forcing decisive battles

## Worlds & Factions
- **Forest Kingdom**: Animals (foxes, bears, hawks) — balanced faction
- **Underdark**: Insects & arachnids — swarm/numbers focus
- **Clockwork**: Mechanical units — heavy/durable focus
- **Arcane**: Magical creatures — special abilities focus

Each world has unique map aesthetics, music, and unit designs.

## Monetization

### Currency 1: Rations (🍖)
- Earned from matches (win or lose), daily quests, campaign progress
- Used for: new unit skins, hero cosmetics, base decorations

### Currency 2: War Medals (🎖️)
- Earned from ranked wins, tournament placement, achievements
- Used for: premium hero skins, faction themes, exclusive emotes, banner customization

### Currency 3: Command Tokens (⚔️)
- Earned from completing faction campaigns, co-op milestones, community events
- Used for: new faction DLC access, campaign extensions, custom map editor tools

### Monetizable Content
- Faction skin packs (reskin all units of a faction)
- Hero character models and outfits
- Victory animations and rally cries (audio)
- Custom banners and player card borders
- Additional single-player campaigns

## Technical Considerations
- Split-screen fog of war rendering (separate visibility per player viewport)
- Pathfinding for rally-based unit control (group movement)
- Network sync for RTS state (deterministic lockstep or state sync)
- AI commander with multiple strategy profiles
- Replay system with full state recording
- Controller input mapping customization
