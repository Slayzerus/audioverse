# TODO: Police Stories — Top-Down Tactical Shooter

## Concept
A top-down tactical shooter inspired by Police Stories with realistic one-hit-one-kill combat. Players lead tactical operations: breaching rooms, clearing buildings, rescuing hostages, and apprehending criminals. Emphasis on planning, communication, and precise execution. Non-lethal options available for higher scores.

## Game Modes

### Single Player
- **Campaign**: 40+ missions across different scenarios (bank robberies, drug busts, hostage situations, bomb defusal)
- **Quick Mission**: Procedurally generated building layouts with random enemy placement
- **Career Mode**: Rise through police ranks, unlock units and equipment
- **Challenge Mode**: Specific constraints (no kills, speed run, pistol only)

### Couch Co-op / Split Screen (up to 4 players)
- **Co-op Campaign**: 2-4 players clear missions together, breach from multiple entry points
- **VS Mode**: Cops vs Robbers — one team defends, one team raids
- **Training Grounds**: Competitive shooting range, obstacle courses
- **Tactical Puzzles**: Co-op room-clearing challenges with strict AI patterns

### Online Multiplayer
- Co-op campaign with matchmaking (2-4 players)
- 5v5 competitive: Attackers vs Defenders (like Rainbow Six)
- Ranked competitive with seasonal rewards
- Custom scenarios with community-made missions
- Clan wars and tournament brackets

## Gameplay Mechanics

### Movement & Controls
- **Twin-stick**: Left stick = move, Right stick = aim
- **Lean/Peek**: Peek around corners without exposing body
- **Crouch**: Reduced visibility, quieter movement
- **Sprint**: Fast movement but loud, can't aim
- **Interact**: Open doors (slow/fast/breach), pick locks, use items

### Combat (1-hit-1-kill realism)
- Bullets penetrate thin walls, ricochet off metal
- **Lethal**: Pistol, shotgun, SMG, rifle, sniper
- **Non-lethal**: Taser, pepper spray, rubber bullets, beanbag rounds
- **Tactical Gear**: Flashbang, smoke grenade, breach charge, mirror (peek under doors)
- Body armor: absorbs 1-2 hits but slows movement

### Door Mechanics
- **Slow Open**: Silent, safe, peek first
- **Fast Open**: Quick entry, some noise
- **Kick**: Loud, staggers enemies behind door
- **Breach Charge**: Destroys door, flashbang effect, dramatic entry
- **Lock Pick**: Silent entry, takes time

### Scoring
- Mission completion: optional objectives, civilian safety
- Arrest vs Kill: non-lethal arrests score much higher
- Time bonus: faster completion = more points
- Accuracy bonus: fewer shots fired = higher efficiency
- Zero casualties bonus

### Real-time Always
- All gameplay is real-time — no pause-to-plan
- Voice/text chat coordination between co-op players
- AI enemies react to sounds, sightlines, alarms
- Dynamic AI: enemies surrender, take hostages, flee, call reinforcements

## Worlds & Scenarios
- **Urban**: Apartments, offices, banks, warehouses
- **Suburban**: Houses, schools, malls, parking structures
- **Industrial**: Factories, docks, power plants, train yards
- **Special Ops**: Embassies, compounds, underground bunkers, ships

## Monetization

### Currency 1: Cash (💵)
- Earned from mission completion, daily patrols, bounties
- Used for: basic weapons, standard gear, vehicle skins

### Currency 2: Commendations (🏅)
- Earned from perfect missions (no casualties, all arrested), ranked wins, achievements
- Used for: elite tactical gear, premium weapon skins, special unit unlocks, tactical clothing

### Currency 3: Precinct Points (🏛️)
- Earned from co-op performance, community mission creation, helping new players
- Used for: custom mission editor tools, precinct customization, exclusive unit types, command room decorations

### Monetizable Content
- Tactical gear cosmetics (different uniforms, helmets, vests)
- Weapon skins and attachments (cosmetic)
- Vehicle skins (SWAT van, helicopter)
- Custom mission packs / scenario DLC
- Character voice lines and radio chatter packs
- Precinct / base decoration

## Technical Considerations
- Line-of-sight / fog-of-war rendering per player
- Sound propagation system (enemies hear footsteps, gunshots, breaches)
- Bullet physics: penetration depth based on material and caliber
- Procedural building layout generation
- AI behavior trees: patrol, investigate, take cover, surrender, flee
- Replay system with tactical overview camera
- Accessibility: colorblind modes for threat indicators
