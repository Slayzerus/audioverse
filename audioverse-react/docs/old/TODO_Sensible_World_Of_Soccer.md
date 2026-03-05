# TODO: Sensible World of Soccer — Football Simulation

## Concept
A comprehensive football (soccer) game inspired by Sensible World of Soccer. Simple top-down gameplay with 8-directional player movement, but massive ambitions: full league and tournament modes, deep manager simulation with auto-play, RPG-style player development, club management with infrastructure and marketing. From casual quick match to years-long career managing a club from amateur to world champion.

## Game Modes

### Single Player
- **Quick Match**: Pick two teams, play immediately
- **Career Mode**: Choose a club, manage and play through multiple seasons
- **Manager Mode**: Pure strategy — auto-play matches, focus on transfers, tactics, development
- **Story Mode**: Narrative career of a single player (from youth academy to retirement)
- **Training Mode**: Practice specific skills (shooting, passing, dribbling, set pieces)

### Couch Co-op / Split Screen (up to 4 players)
- **VS Match**: 1v1 or 2v2 (each controls half the team)
- **Co-op Season**: Play a league season together, sharing team control
- **Tournament**: 4-player knockout bracket
- **Mini-Games**: Penalty shootout, free kick challenge, dribble obstacle course
- **Dynasty Mode**: Each player manages a rival club, auto-play or control matches

### Online Multiplayer
- Quick match 1v1 with ELO matchmaking
- Online leagues with scheduled seasons
- 2v2 co-op matches
- Draft mode: build a team from random players, play a tournament
- Global rankings and seasonal rewards
- Spectator mode for league matches

## Gameplay Mechanics

### On-Pitch Controls (top-down, 8-directional)
- **Movement**: D-pad / left stick — 8 directions
- **Short Pass (A)**: Pass to nearest teammate in aimed direction
- **Long Pass / Cross (B)**: Lofted ball, further distance
- **Shoot (Y)**: Power determined by hold duration
- **Sprint (R)**: Burst of speed, tired faster
- **Tackle / Switch Player (X)**: Context-dependent defense
- **Through Ball (L+A)**: Pass into space ahead of runner
- **Aftertouch**: Curve the ball after kicking using d-pad

### Match Flow
- 5-minute half (real-time) by default (configurable 3-10 min)
- Full teams of 11 players (AI controls teammates)
- Set pieces: corners, free kicks, penalties, throw-ins
- Yellow and red cards, injuries, substitutions
- Weather effects: rain (slippery), snow (slow), wind (ball drift)

### Difficulty Levels
1. **Casual**: Generous auto-aim, forgiving tackles, slow opponents
2. **Normal**: Standard gameplay, balanced AI
3. **Hard**: Precise aiming needed, smart AI, fouls punished
4. **Simulation**: Realistic fatigue, injuries, referee strictness, no auto-aim
5. **Retro**: Classic SWOS feel — fast, arcadey, aftertouch-heavy

### Rule Variations
- **Standard**: Full FIFA rules
- **Street Rules**: No fouls, no offsides, small pitch
- **Indoor**: Walls instead of throw-ins, 5v5
- **Futsal**: Small pitch, specific rules
- **Custom**: Toggle any rule on/off

### Manager / RPG Systems

#### Player Stats (RPG)
- **Speed, Stamina, Strength**: Physical attributes
- **Passing, Shooting, Dribbling**: Technical skills
- **Tackling, Positioning, Heading**: Defensive/tactical
- **Potential**: Hidden stat — max growth capacity
- **Form**: Weekly fluctuation based on training, morale, match performance
- **Experience**: Gained from matches, unlocks skill points for training focus

#### Club Management
- **Transfers**: Buy/sell players, negotiate contracts, loan system
- **Youth Academy**: Develop future stars, scout worldwide
- **Training**: Set weekly training focus (fitness, tactics, skills)
- **Tactics**: Formation, strategy (attacking, defensive, counter), set piece routines
- **Finances**: Budget, ticket revenue, sponsorships, merchandise
- **Infrastructure**: Stadium upgrades (capacity, facilities), training ground, medical center
- **Marketing**: Social media, fan engagement, club reputation, brand deals
- **Staff**: Hire coaches, scouts, physios, analysts — each with their own stats

#### Auto-Play Matches
- When managing from the boardroom, simulate matches with realistic results
- Match engine considers: team strength, form, tactics, home advantage, morale
- Watch live text commentary or skip to results
- Intervene with tactical changes mid-match without playing

### League & Tournament System
- Multiple divisions with promotion/relegation
- Cup competitions with knockout rounds
- Continental tournaments
- International tournaments (world cup style)
- Pre-season friendlies
- Transfer windows between seasons

## Monetization

### Currency 1: Coins (🪙)
- Earned from match wins, season milestones, daily challenges
- Used for: basic kits, stadium cosmetics, contract negotiations, scouting missions

### Currency 2: Stars (⭐)
- Earned from league titles, cup wins, ranked online victories, achievements
- Used for: premium kit designs, legendary player unlock (in draft mode), exclusive tactics, stadium themes

### Currency 3: Legacy Points (🏟️)
- Earned from long career achievements (10 seasons, 500 goals, etc.), community contributions, mentoring
- Used for: custom badge/crest designer, historical match recreations, exclusive commentary packs, hall of fame features

### Monetizable Content
- Kit/uniform design packs
- Stadium themes and crowd banners
- Custom club crest elements
- Commentary language packs
- Historic scenario packs (famous matches to replay)
- Training ground and academy cosmetics

## Technical Considerations
- 2D top-down renderer with smooth sprite animation
- Ball physics: curve, bounce, spin simulation
- Match engine: dual purpose — playable and simulation
- League database: teams, players, results, tables across seasons
- Save system: full career state with multi-season history
- AI: tactical awareness, positioning, set piece patterns
- Network: real-time match sync at 30+ tick rate
- Player generation: procedural names, stats, nationalities, appearances
