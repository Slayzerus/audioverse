# TODO: River City Girls — Beat 'em Up RPG

## Concept
A side-scrolling beat 'em up with deep RPG mechanics, inspired by River City Girls / Kunio-kun. Multiple playable characters with unique movesets. Extensive campaign with branching paths, shops, NPCs, and side quests. Gorgeous pixel art action with juggle combos, special moves, and environmental attacks. Character progression through XP, equipment, and unlockable moves.

## Game Modes

### Single Player
- **Story Campaign**: 15-20 hour main story with branching paths and multiple endings
- **Side Quests**: 50+ optional missions from NPCs around the city
- **Boss Rush**: Fight all bosses back-to-back with escalating difficulty
- **New Game+**: Higher difficulty, carry over stats and moves, new enemies
- **Arcade Mode**: Classic beat 'em up — no saves, limited lives, pure action

### Couch Co-op / Split Screen (up to 4 players)
- **Co-op Campaign**: 2-4 players play through the full story together
- **Co-op Arcade**: Classic beat 'em up experience, shared screen
- **VS Arena**: PvP combat between player characters
- **Tag Team (2v2)**: Teams switch active fighter, partner recovers
- **Survival Co-op**: Endless waves, shared health pool, how far can you go?

### Online Multiplayer
- Co-op campaign with matchmaking or friend invite
- VS ranked matches 1v1 and 2v2
- Daily/weekly challenge dungeons with leaderboards
- Community boss raids (super bosses requiring coordination)
- Drop-in/drop-out co-op during campaign

## Gameplay Mechanics

### Combat System (All Real-Time)
- **Light Attack (X)**: Fast jabs, combo starters
- **Heavy Attack (Y)**: Slower, more damage, combo finishers
- **Special (L+attack)**: Costs SP, powerful moves unique per character
- **Guard (R)**: Block attacks, timing-based parry for counter
- **Dodge (B)**: I-frames, dash direction with stick
- **Grab (near enemy)**: Throw, slam, piledriver — context-dependent
- **Environmental**: Pick up weapons (bats, pipes, trash cans), throw objects
- **Juggle**: Launch enemies airborne, continue combos in the air
- **Tag (co-op only)**: Switch active character, incoming partner does a special entry attack

### Character Roster (8+ playable)
- Each character has unique:
  - Combo strings (at least 10 different combos)
  - 4 special moves (unlockable through level up)
  - Ultimate move (costs full SP bar)
  - Movement style (fast/balanced/heavy)
  - Unique throw animations
- Additional characters unlockable through story progression
- Villains unlockable after beating them (New Game+ or special conditions)

### RPG Systems
- **Level Up**: XP from combat → stat increases + skill points
- **Stats**: STR (damage), DEF (damage reduction), AGI (speed, dodge), SP (special energy), HP
- **Skills**: Learn new combo moves from dojos around the city
- **Equipment**: Accessories that modify stats (rings, bracelets, headbands, shoes)
- **Consumables**: Food items for healing, stat buffs, temporary powers

### Progression
- **City Exploration**: Open-world city map with districts to unlock
- **Shops**: Buy food, equipment, and new moves
- **NPCs**: Side quest givers, lore characters, recurring allies
- **Boss Zones**: Each district has a unique boss with mechanics
- **Secret Areas**: Hidden paths, bonus bosses, rare equipment

### Enemy Variety
- Street thugs, martial artists, heavy bruisers, speedy ninjas
- Enemy variants per district (different gangs, different combat styles)
- Mini-bosses guarding key areas
- Major bosses with multiple phases and gimmick mechanics
- Elite enemies in New Game+ (new attacks, higher AI)

## Worlds & Districts
- **Downtown**: Urban streets, alleys, rooftops — standard enemies
- **Harbor District**: Docks, warehouses, boats — pirate-themed thugs
- **School Zone**: Campus, gym, rooftop — rival student gangs
- **Underground**: Subway, sewers, hidden arena — fight club
- **Uptown**: Shopping mall, office towers, penthouse — corporate enemies
- **Industrial Zone**: Factories, construction, junkyard — heavy machinery hazards

## Monetization

### Currency 1: Cash (💵)
- Earned from defeating enemies, selling items, completing quests
- Used for: food, shop equipment, dojo move training, in-game services

### Currency 2: Style Points (✨)
- Earned from high combo scores, S-rank missions, stylish play, daily challenges
- Used for: character costume alternates, accessory cosmetics, custom move effects, victory poses

### Currency 3: Champion Tokens (🏆)
- Earned from PvP ranked wins, boss rush completion, community events, co-op milestones
- Used for: exclusive character unlocks, alternate character color palettes, profile cards, arena stage themes

### Monetizable Content
- Character costume packs (multiple outfits per character)
- Move effect cosmetics (fire punches, electric kicks)
- Music track packs for different districts
- Additional story chapter DLC
- Character DLC (new playable fighters)
- Custom combo animations

## Technical Considerations
- 2D sprite-based combat with hitbox/hurtbox system
- Combo state machine: cancel windows, juggle physics, hitstun decay
- AI: enemy attack patterns, group coordination (don't all attack at once)
- Co-op: shared camera system with elastic boundaries
- Network: rollback netcode for PvP, state sync for co-op
- Save system: character progress, inventory, quest state, map exploration
- Level editor for community combat arenas
- Accessibility: adjustable game speed, auto-combo option, difficulty scaling
