# TODO: Overcooked / Tools Up — Job Simulation Party Game

## Concept
A chaotic cooperative/competitive job simulation party game inspired by Overcooked and Tools Up. Players work together (or against each other) in various professions: cooking, cleaning, building, repairing, mechanics, lumberjacking, and more. Each profession is a "career path" with its own mechanics, progressions, and business management layer. Start from Level 1 (making lemonade), grow your business, upgrade equipment, and level up your skills. Light life-sim elements with a career progression campaign and an endless mode.

## Game Modes

### Single Player
- **Career Campaign**: Choose and advance through different professions, make career-changing decisions
- **Endless Mode**: Run your business indefinitely, see how far you can grow
- **Time Attack**: Complete specific orders/tasks within time limits
- **Challenge Missions**: Special scenarios with constraints (one-handed, blindfolded NPC, etc.)
- **Business Empire**: Focus on management — hire NPC workers, expand to multiple locations

### Couch Co-op / Split Screen (up to 4 players)
- **Co-op Career**: Work together in the same kitchen/workshop/etc.
- **VS Mode**: Competing businesses side-by-side — who earns more in 5 minutes?
- **Mixed Co-op + VS (2v2)**: Two teams running rival businesses
- **Chaos Mode**: Changing work environments, random events, absurd obstacles
- **Relay**: Players take turns at different stations, assembly line style

### Online Multiplayer
- Co-op matchmaking (2-4 players)
- Competitive leaderboards per profession
- Weekly challenges with community goals
- Guild system: business franchises
- Custom lobbies for friend groups

## Professions & Career Paths

### 🍋 Food Service (Tier 1: Lemonade Stand → Restaurant → Food Empire)
- **Lemonade**: Squeeze lemons, add sugar, pour, serve — simple tutorial
- **Fast Food**: Burgers, fries, drinks — multi-station coordination
- **Restaurant**: Full menu, multiple courses, plating, timing
- **Bakery**: Baking, decorating, custom orders
- **Food Truck**: Mobile service, changing locations, weather effects

### 🧹 Cleaning (Tier 1: Room Tidying → Professional Service → Cleaning Corp)
- **House Cleaning**: Sweep, mop, vacuum, dishes, laundry
- **Crime Scene**: Special equipment, hazmat processes, evidence preservation
- **Commercial**: Office buildings, hospitals, factories
- **Disaster Cleanup**: Floods, fires, infestations — time pressure

### 🔨 Construction (Tier 1: Handyman → Contractor → Development Company)
- **Repairs**: Fix leaks, electrical, broken furniture
- **Renovation**: Tear down walls, install new fixtures, paint
- **Building**: Construct houses from foundation up
- **Custom Builds**: Client specifications, design choices

### 🔧 Mechanics (Tier 1: Oil Change → Auto Shop → Motorsport Team)
- **Basic Service**: Oil, tires, brakes
- **Engine Work**: Diagnostics, rebuilds, upgrades
- **Body Shop**: Dent repair, painting, customization
- **Race Team**: Pit crew mechanics under extreme time pressure

### 🪓 Lumberjack (Tier 1: Firewood → Lumber Mill → Forestry Corp)
- **Chopping**: Cut trees, split logs, stack firewood
- **Mill Operation**: Feed logs, operate saws, manage output
- **Forestry**: Sustainable management, equipment upgrades, expansion

### 🏗️ Additional Professions
- **Plumber**: Pipe puzzles, emergency calls, water management
- **Electrician**: Wire circuits, fuse boxes, safety compliance
- **Gardener**: Plant, water, harvest, landscape design
- **Moving Service**: Pack, load, transport, unload efficiently

## Gameplay Mechanics

### Core Loop
- Receive orders/tasks → gather materials → process at stations → deliver/complete → earn money
- Timer pressure per order (stars based on speed and quality)
- Station interactions: pick up, put down, use equipment, combine items
- Environmental obstacles: moving floors, counter rearrangement, fire hazards, customers in the way

### Business Management
- **Revenue**: Earn from completed orders and tips
- **Equipment**: Buy/upgrade tools and stations (better ovens, faster vacuums, etc.)
- **Location**: Start in a garage → rent a shop → buy a building → open franchises
- **Staff**: Hire NPC assistants (each with skills and quirks)
- **Reputation**: Customer reviews affect demand and prices
- **Expansion**: Open in new cities, unlock new profession types

### Skill Leveling
- Each profession has skill trees (speed, quality, efficiency, multitasking)
- Level up by performing tasks → unlock new recipes/techniques
- Cross-profession skills: some abilities transfer (organization, speed, strength)

### Dynamic Events
- Rush hours, VIP customers, equipment breakdowns
- Weather effects (muddy floors, frozen pipes, wind for lumberjacks)
- Health inspector visits, safety audits
- Supply chain disruptions

### Difficulty Scaling
- Progressive complexity: more stations, more orders, more obstacles
- Star rating: 1-3 stars per level based on performance
- Optional modifiers: left-handed controls, timer halved, random station layout

## Monetization

### Currency 1: Cash (💵)
- Earned from completing orders and running your business
- Used for: equipment, location upgrades, staff salaries, supply costs

### Currency 2: Service Stars (⭐)
- Earned from perfect scores (3-star levels), daily challenges, seasonal events
- Used for: premium equipment skins, character outfits, shop decorations, vehicle wraps

### Currency 3: Franchise Tokens (🏢)
- Earned from business milestones (first franchise, 100 customers, guild achievements)
- Used for: new profession DLC access, exclusive location themes, custom uniform designer, boss-level challenge maps

### Monetizable Content
- Character customization (uniforms, hats, accessories per profession)
- Equipment skins (golden spatula, neon vacuum, etc.)
- Shop/business decoration themes
- Custom aprons, tool belts, work gear
- Additional profession packs DLC
- Themed level packs (holiday specials, extreme conditions)

## Technical Considerations
- Grid-based interaction system with item pickup/drop/use
- Multi-station workflow tracking (order → station 1 → station 2 → delivery)
- physics-lite: dropped items, spills, collisions
- Timer and scoring system per-order and per-level
- Business simulation: revenue, costs, reputation calculations
- NPC AI for hired staff (task prioritization, pathfinding)
- Network: real-time state sync for all item positions and player actions
- Level editor for community content
