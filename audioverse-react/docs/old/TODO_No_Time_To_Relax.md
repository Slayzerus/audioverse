# TODO: No Time To Relax — Life Simulation Party Game

## Concept
A fast-paced life simulation party game inspired by No Time To Relax / Walk of Life. Players manage their character's daily life — balancing work, education, health, social life, and finances. Each day is a rapid series of choices: school vs. gym, eating vs. sleeping, shower vs. party. At the end of a set number of rounds, players compare who lived the best life. Key difference from originals: **all players play simultaneously** on their own mini-dashboard.

## Game Modes

### Single Player
- Career mode: multiple life paths (artist, scientist, athlete, entrepreneur, politician)
- Endless mode: survive and thrive as long as possible, see how many "years" you last
- Challenge scenarios: "Survive college with $0", "Become CEO by age 30", "Win the Olympics"
- Score attack: maximize life satisfaction score within fixed rounds

### Couch Co-op / Split Screen (up to 4 players)
- **VS**: Each player has their own quadrant with building/activity menus — simultaneous play!
- **Co-op**: Shared household — players must coordinate who works, who cooks, who cleans
- **Race Mode**: First to reach specific milestones (get married, buy a house, PhD)
- **Sabotage Mode**: Players can send events to each other (flu outbreak, surprise bills, bad dates)

### Online Multiplayer
- Matchmaking for 2-8 players (spectators welcome)
- Seasonal competitions with themed challenges
- Persistent leaderboards by life-achievement categories
- Guild/clan system: "Families" that share bonuses and compete

## Gameplay Mechanics

### Core Loop (Per Round = 1 Day)
1. **Morning Phase** (5 seconds): Choose morning activity (exercise, breakfast, study, sleep in)
2. **Day Phase** (5 seconds): Choose work/school type or skip (part-time, full-time, class, freelance)
3. **Evening Phase** (5 seconds): Choose leisure (socialize, hobby, rest, shop, date)
4. **Night Phase** (auto): Stats update, events trigger, bills due

### Stat Systems
- **Health**: Exercise, diet, sleep — low = hospital visits, missed days
- **Intelligence**: Classes, reading, training — unlocks better jobs
- **Social**: Parties, dates, calls — affects happiness and opportunities
- **Money**: Jobs pay salary, expenses drain — rent, food, entertainment
- **Happiness**: Meta-stat affected by balance of all others
- **Energy**: Depletes with activities, restored by rest/food

### Real-time Simultaneous Play
- **No turns** — every player selects their activities at the same time
- Timer per phase (5-10 seconds configurable)
- If you don't choose, default action is "stay home"
- Split screen shows all players' stat bars in real-time
- Events and interactions happen between players simultaneously

### Life Events (Random & Triggered)
- Job promotions/firings, relationship events, health scares
- Natural disasters, economic booms/busts, lottery
- Birthdays, holidays, surprise visitors
- Player-targeted events in sabotage mode

### Progression
- Unlock new life paths, locations (city, suburbs, beach, mountain)
- Career trees with branching specializations
- Relationship progression: dating → partner → marriage → family
- Property: rent → apartment → house → mansion

## Worlds & Settings
- **Modern City** — Standard life simulator
- **Fantasy Village** — Medieval careers (blacksmith, mage, knight), dragons as life events
- **Space Colony** — Sci-fi careers (engineer, pilot, xenobiologist), alien encounters
- **Post-Apocalypse** — Survival focus, scavenging, faction politics

## Monetization

### Currency 1: Life Points (💫)
- Earned from completing rounds, daily challenges, milestones
- Used for: basic cosmetics, starter career packs, house decorations

### Currency 2: Prestige (👑)
- Earned from winning multiplayer matches, achievements, season milestones
- Used for: premium character models, exotic locations, special life events pack, rare jobs

### Currency 3: Karma (☯️)
- Earned from co-op contributions, helping other players (gifts, event mitigation)
- Used for: exclusive co-op content, altruist cosmetics, karma-only locations, special endings

### Monetizable Content
- Character customization (clothes, hair, accessories, pets)
- House decoration themes
- Additional career paths and life event packs
- New world/setting DLC
- Custom life soundtracks

## Technical Considerations
- Efficient state sync for 4-8 simultaneous players
- Timer-based phase system with grace period for slow connections
- Stat calculation engine with balanced formulas
- Event system with weighted random + story triggers
- Save/resume for long career sessions
