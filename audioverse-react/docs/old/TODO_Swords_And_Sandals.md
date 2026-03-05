# TODO: Swords and Sandals — Gladiator RPG

## Concept
A gladiator combat RPG inspired by Swords and Sandals. Players create gladiators, train stats, equip gear, and fight in arena duels on a 1D combat line (left-right movement only, no depth). Rise to fame, climb the tournament ladder, and become legendary. **Two combat modes**: classic turn-based (move+attack per turn) and an **auto-battle / Kings League mode** where you set strategy and watch your gladiator fight automatically in real-time.

## Game Modes

### Single Player
- **Career Mode**: Create a gladiator, train, equip, fight through 100+ tournament tiers
- **Story Campaign**: Themed storylines (slave uprising, champion's revenge, arena owner)
- **Quick Fight**: Jump into a random duel at any level
- **Challenge Gauntlet**: Beat 10 opponents in a row with no healing between fights
- **Auto-Battle Tournament**: Set up your gladiator and watch AI battles unfold (Kings League style)

### Couch Co-op / Split Screen (up to 4 players)
- **1v1 Duel**: Two gladiators face off on the arena line
- **Tournament (2-4)**: Round-robin or bracket tournament between friends
- **Tag Team (2v2)**: Partners switch in/out during a single fight
- **Co-op Career**: Shared stable of gladiators, manage and fight together
- **Auto-Battle League**: Each player builds a gladiator, watch them fight in auto-mode

### Online Multiplayer
- Ranked 1v1 ladder with seasonal resets
- Global tournaments with brackets and prizes
- Trading marketplace for equipment
- Guild system: gladiator stables competing for prestige
- Spectator mode for high-ranked duels
- Asynchronous challenges: fight other players' gladiators (AI-controlled)

## Gameplay Mechanics

### Combat Line
- Arena is a horizontal line of ~20 tiles
- Gladiators start at opposite ends
- Movement: walk/run left or right (no vertical movement)
- Range matters: melee needs adjacent, ranged can shoot across, magic has variable range
- Push back / pull mechanics: knock opponent toward arena edge

### Turn-Based Mode (Classic)
1. **Move Phase**: Move 0-3 tiles toward or away from opponent
2. **Action Phase**: Attack, Cast Spell, Use Item, Taunt, or Rest
3. Opponent's turn (same structure)
4. Cheer/Jeer from crowd affects morale
- **Strategic depth**: positioning, stamina management, special cooldowns

### Auto-Battle Mode (Kings League Alternative)
- Set pre-fight strategy: aggression level, preferred ranges, ability priorities
- Gladiator fights automatically in real-time based on AI + your strategy settings
- Watch the battle unfold — cheer from the stands
- Intervene with timed button presses for bonus effects (crowd interaction)
- Perfect for tournament spectating and league play
- 30-60 second real-time fights

### Stats & RPG System
- **Strength**: Melee damage, heavy armor capacity
- **Agility**: Dodge chance, movement speed, attack speed
- **Vitality**: Health pool, stamina recovery
- **Charisma**: Crowd favor (more money, morale boost), shop discounts
- **Intelligence**: Magic power, spell variety, strategy effectiveness in auto-mode
- **Endurance**: Stamina pool, resistance to knockback, armor effectiveness

### Equipment
- **Weapons**: Sword, axe, mace, spear, trident, bow, crossbow, staff, dual daggers
- **Armor**: Helmet, chest, legs, shield (each with weight/defense tradeoffs)
- **Accessories**: Rings, amulets, capes (stat bonuses)
- **Consumables**: Health potions, stamina potions, poison (pre-fight)
- **Rarity**: Common → Uncommon → Rare → Epic → Legendary

### Fame & Progression
- Win fights → earn fame → unlock higher tournament tiers
- Fame milestones: local celebrity → city champion → empire legend
- Rankings and leaderboards
- Retire successful gladiators → legacy bonus for new characters
- Arena upgrades: own/manage your own gladiator school

## Worlds & Themes
- **Roman Colosseum**: Classic gladiator fantasy, historical flavor
- **Fantasy Arena**: Magic allowed, monsters as opponents, enchanted weapons
- **Sci-Fi Pit**: Cybernetic enhancements, energy weapons, alien gladiators
- **Underworld**: Demonic arena, cursed weapons, soul-based magic

## Monetization

### Currency 1: Denarii (💰)
- Earned from fights (purse based on tier and performance), daily training rewards
- Used for: basic equipment, training costs, healing, tournament entry

### Currency 2: Glory (⭐)
- Earned from ranked wins, tournament victories, fame milestones, achievements
- Used for: premium weapon skins, rare armor designs, gladiator school upgrades, exclusive auto-battle strategies

### Currency 3: Champion Marks (🏅)
- Earned from league play, seasonal rankings, community tournaments, mentoring new players
- Used for: legendary equipment crafting, champion's entrance animations, exclusive gladiator portraits, title badges

### Monetizable Content
- Gladiator body/face customization options
- Weapon and armor visual skins
- Arena entrance animations
- Victory celebration poses
- Battle cries and taunt voice packs
- Gladiator school decoration themes
- Auto-battle strategy presets

## Technical Considerations
- 1D combat simulation with position/range calculations
- Auto-battle AI: behavior trees with configurable strategy weights
- Equipment stat calculation with diminishing returns
- Fame/ranking system with seasonal resets
- Save system: gladiator stats, equipment, career progress
- Network: turn-based state sync or real-time for auto-battle spectating
- Procedural opponent generation with level-appropriate stats/gear
