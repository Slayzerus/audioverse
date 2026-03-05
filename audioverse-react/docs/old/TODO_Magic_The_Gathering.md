# TODO: Magic The Gathering — Trading Card Game

## Concept
A deep trading card game inspired by Magic: The Gathering with collectible cards, deckbuilding, and strategic duels. Multiple distinct worlds/settings, each with their own card pools, mechanics, and flavor. Both turn-based play (classic TCG) and a real-time speed mode. Massive collection system with crafting, trading, and competitive play.

## Game Modes

### Single Player
- **Story Campaigns**: Per-world narrative with pre-built decks evolving through choices
- **Practice**: Battle AI opponents at various difficulty levels
- **Puzzle Mode**: "Solve the board" — win with specific cards in one move
- **Draft Simulation**: Build a deck from random packs, play against AI
- **Collection Quests**: Earn cards by completing themed challenges

### Couch Co-op / Split Screen (up to 4 players)
- **1v1 Duel**: Classic two-player card game on split screen
- **2v2 Team Battle**: Partners share a battlefield, coordinate strategies
- **Free-for-All (3-4)**: Multi-player chaos with political alliances
- **Draft Party**: Real draft experience — open packs, pick cards, build decks, duel
- **Co-op Boss Raid**: Together against a powerful AI deck with special boss rules

### Online Multiplayer
- Ranked 1v1 ladder with seasonal rewards
- Draft and Sealed tournaments
- Arena events with entry fees and prizes
- 2v2 ranked mode
- Spectator mode and streaming integration
- Trading marketplace

## Gameplay Mechanics

### Turn-Based Mode (Classic)
1. **Draw Phase**: Draw a card
2. **Resource Phase**: Play one resource card (mana/energy/etc.)
3. **Main Phase**: Play creatures, spells, enchantments, artifacts
4. **Combat Phase**: Declare attackers → opponent declares blockers → resolve damage
5. **End Phase**: Discard down to hand limit, end-of-turn effects

### Real-Time Mode (Speed Duel)
- Continuous play — play cards as fast as you want (mana auto-generates over time)
- Creatures auto-attack on a timer (or player-directed)
- Spells have cooldowns instead of mana cost
- Games last 5-8 minutes vs 15-30 for turn-based
- Same cards, rebalanced for continuous play

### Card Types
- **Creatures**: Attack and defense values, keywords (flying, haste, deathtouch, etc.)
- **Spells**: Instant effects (damage, heal, draw, counter)
- **Enchantments**: Persistent effects on the battlefield
- **Artifacts**: Equipment and utility items
- **Resource Cards**: Mana/energy generation
- **Legendary**: Unique powerful cards, one per deck

### Deckbuilding
- Minimum 40 cards, maximum 60
- Maximum 3 copies of any non-resource card
- Color/element restrictions: 1-3 colors per deck
- Sideboard for best-of-3 matches
- Deck archetypes: Aggro, Control, Combo, Midrange, Tempo

### Collection System
- **Booster Packs**: Random card packs (earned or purchased with in-game currency)
- **Crafting**: Disenchant unwanted cards → craft specific cards
- **Trading**: Player-to-player card trading marketplace
- **Daily Rewards**: Login rewards, quest completion
- **Season Pass**: Progressive rewards track

## Worlds & Card Sets

### 🐉 Fantasy (Core)
- Magic, dragons, elves, kingdoms, necromancy
- 5 elements: Fire, Water, Earth, Air, Shadow

### 🚀 Sci-Fi
- Spaceships, aliens, lasers, cybernetics, AI
- 5 factions: Federation, Alien Swarm, Cybercorp, Free Colonies, Void Cult

### ⚔️ Medieval
- Historical warfare, siege, politics, religion
- 5 houses: Crown, Church, Guild, Rebels, Mercenaries

### 🌊 Mythology
- Greek, Norse, Egyptian, Japanese, Celtic gods and creatures
- 5 pantheons with unique keywords and mechanics

### 🧟 Horror
- Vampires, werewolves, zombies, eldritch terrors, haunted
- 5 archetypes: Undead, Beasts, Spirits, Cultists, Hunters

## Monetization

### Currency 1: Gold (💰)
- Earned from wins, quests, daily challenges, campaign progress
- Used for: booster packs, event entry, basic card backs, deck slots

### Currency 2: Arcane Dust (✨)
- Earned from disenchanting duplicate/unwanted cards, achievements
- Used for: crafting specific cards, premium foil versions, golden card frames

### Currency 3: Tournament Tokens (🏆)
- Earned from ranked placement, tournament wins, seasonal milestones
- Used for: exclusive card art variants, tournament entry, exclusive card backs, profile avatars, leaderboard borders

### Monetizable Content
- Cosmetic card backs for decks
- Animated card frames (foil/holographic)
- Battle arenas (playing field themes)
- Avatar and profile customization
- Alternative card art for popular cards
- Expansion set pre-orders

## Technical Considerations
- Card data model: flexible enough for 5+ worlds with unique keywords
- Rule engine: stack-based spell resolution, trigger ordering, state machine
- Real-time rebalancing: separate stat tables for speed mode
- Collection database: per-player card ownership, deck storage
- Trading system: anti-fraud, fair value estimation, trade history
- AI: deck evaluation heuristics, play strategy per archetype
- Draft algorithm: bot drafting preferences, pack generation
- Network: minimal bandwidth (card plays, attack declarations, responses)
