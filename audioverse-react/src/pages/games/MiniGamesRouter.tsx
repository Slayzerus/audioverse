/**
 * MiniGamesRouter — routes for /mini-games and /mini-games/:gameId.
 * Lazy-loads each mini game component.
 */
import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PageSpinner from '../../components/common/PageSpinner'

const MiniGamesHub = React.lazy(() => import('./mini/MiniGamesPage'))
const SnakesPage = React.lazy(() => import('./mini/SnakesPage'))
const TronPage = React.lazy(() => import('./mini/TronPage'))
const PongPage = React.lazy(() => import('./mini/PongPage'))
const TagPage = React.lazy(() => import('./mini/TagPage'))
const PaintersPage = React.lazy(() => import('./mini/PaintersPage'))
const AsteroidsPage = React.lazy(() => import('./mini/AsteroidsPage'))
const ReactionPage = React.lazy(() => import('./mini/ReactionPage'))
const SumoPage = React.lazy(() => import('./mini/SumoPage'))
const BreakoutPage = React.lazy(() => import('./mini/BreakoutPage'))
const DodgeballPage = React.lazy(() => import('./mini/DodgeballPage'))
const RacePage = React.lazy(() => import('./mini/RacePage'))
const TanksPage = React.lazy(() => import('./mini/TanksPage'))
const MazePage = React.lazy(() => import('./mini/MazePage'))
const HockeyPage = React.lazy(() => import('./mini/HockeyPage'))
const VolleyballPage = React.lazy(() => import('./mini/VolleyballPage'))
const ArcheryPage = React.lazy(() => import('./mini/ArcheryPage'))
const FishingPage = React.lazy(() => import('./mini/FishingPage'))
const LavaPage = React.lazy(() => import('./mini/LavaPage'))
const JoustPage = React.lazy(() => import('./mini/JoustPage'))
const CollectPage = React.lazy(() => import('./mini/CollectPage'))
const BouncePage = React.lazy(() => import('./mini/BouncePage'))
const SpiralPage = React.lazy(() => import('./mini/SpiralPage'))
const DuelPage = React.lazy(() => import('./mini/DuelPage'))
const CapturePage = React.lazy(() => import('./mini/CapturePage'))
const BombsPage = React.lazy(() => import('./mini/BombsPage'))
const ColorMatchPage = React.lazy(() => import('./mini/ColorMatchPage'))
const SurvivePage = React.lazy(() => import('./mini/SurvivePage'))
const ClimberPage = React.lazy(() => import('./mini/ClimberPage'))
const SimonPage = React.lazy(() => import('./mini/SimonPage'))
const BunnyPage = React.lazy(() => import('./BunnyPage'))
const TetrisPage = React.lazy(() => import('./mini/TetrisPage'))
const WormsPage = React.lazy(() => import('./mini/WormsPage'))
const NoTimeToRelaxPage = React.lazy(() => import('./mini/NoTimeToRelaxPage'))
const UltimateChickenHorsePage = React.lazy(() => import('./mini/UltimateChickenHorsePage'))
const PoliceStoriesPage = React.lazy(() => import('./mini/PoliceStoriesPage'))
const EightMinuteEmpirePage = React.lazy(() => import('./DangerZonePage'))
const ToothAndTailPage = React.lazy(() => import('./mini/ToothAndTailPage'))
const SensibleSoccerPage = React.lazy(() => import('./mini/SensibleSoccerPage'))
const OvercookedPage = React.lazy(() => import('./mini/OvercookedPage'))
const UplinkPage = React.lazy(() => import('./mini/UplinkPage'))
const FalloutPage = React.lazy(() => import('./AtomicPage'))
const GTA2Page = React.lazy(() => import('./MenacePage'))
const SoldatPage = React.lazy(() => import('./mini/SoldatPage'))
const SwordsAndSandalsPage = React.lazy(() => import('./mini/SwordsAndSandalsPage'))
const MagicTheGatheringPage = React.lazy(() => import('./MagicDecksPage'))
const RiverCityGirlsPage = React.lazy(() => import('./mini/RiverCityGirlsPage'))
const BattleOfWesnothPage = React.lazy(() => import('./mini/BattleOfWesnothPage'))
const BattlefieldPage = React.lazy(() => import('./WarzonePage'))
const AdventureCapitalistPage = React.lazy(() => import('./mini/AdventureCapitalistPage'))
const MightAndMagicPage = React.lazy(() => import('./mini/MightAndMagicPage'))
const HeroesOfMightAndMagicPage = React.lazy(() => import('./GameOfCastlesPage'))
const OilImperiumPage = React.lazy(() => import('./mini/OilImperiumPage'))
const TransportTycoonPage = React.lazy(() => import('./mini/TransportTycoonPage'))
const SimCityPage = React.lazy(() => import('./mini/SimCityPage'))
const RTSPage = React.lazy(() => import('./mini/RTSPage'))
const SettlersPage = React.lazy(() => import('./mini/SettlersPage'))
const CivilizationPage = React.lazy(() => import('./mini/CivilizationPage'))
const LeagueOfLegendsPage = React.lazy(() => import('./mini/LeagueOfLegendsPage'))
const PokemonPage = React.lazy(() => import('./mini/PokemonPage'))
const AutoSurvivorsPage = React.lazy(() => import('./mini/AutoSurvivorsPage'))
const ShmupPage = React.lazy(() => import('./mini/ShmupPage'))
const DoomPage = React.lazy(() => import('./mini/DoomPage'))
const MemoPage = React.lazy(() => import('./mini/MemoPage'))
const DragRacingPage = React.lazy(() => import('./mini/DragRacingPage'))
const CarDodgePage = React.lazy(() => import('./mini/CarDodgePage'))
const StarMerchantPage = React.lazy(() => import('./mini/StarMerchantPage'))
const MasterOfOrionPage = React.lazy(() => import('./mini/MasterOfOrionPage'))
const PuzzlePage = React.lazy(() => import('./mini/PuzzlePage'))
const PipesPage = React.lazy(() => import('./mini/PipesPage'))
const SimTowerPage = React.lazy(() => import('./mini/SimTowerPage'))
const IcyTowerPage = React.lazy(() => import('./mini/IcyTowerPage'))
const ShipsPage = React.lazy(() => import('./mini/ShipsPage'))
const HorizonChasePage = React.lazy(() => import('./mini/HorizonChasePage'))
const EscapeRoomPage = React.lazy(() => import('./mini/EscapeRoomPage'))
const SporePage = React.lazy(() => import('./mini/SporePage'))
const AuctionHousePage = React.lazy(() => import('./mini/AuctionHousePage'))
const EmpirePage = React.lazy(() => import('./EmpirePage'))
const SongMiniGamesPage = React.lazy(() => import('./SongMiniGamesPage'))
const JoinRoomPage = React.lazy(() => import('./mini/JoinRoomPage'))

export default function MiniGamesRouter() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route index element={<MiniGamesHub />} />
        <Route path="snakes" element={<SnakesPage />} />
        <Route path="tron" element={<TronPage />} />
        <Route path="pong" element={<PongPage />} />
        <Route path="tag" element={<TagPage />} />
        <Route path="painters" element={<PaintersPage />} />
        <Route path="asteroids" element={<AsteroidsPage />} />
        <Route path="reaction" element={<ReactionPage />} />
        <Route path="sumo" element={<SumoPage />} />
        <Route path="breakout" element={<BreakoutPage />} />
        <Route path="dodgeball" element={<DodgeballPage />} />
        <Route path="race" element={<RacePage />} />
        <Route path="tanks" element={<TanksPage />} />
        <Route path="maze" element={<MazePage />} />
        <Route path="hockey" element={<HockeyPage />} />
        <Route path="volleyball" element={<VolleyballPage />} />
        <Route path="archery" element={<ArcheryPage />} />
        <Route path="fishing" element={<FishingPage />} />
        <Route path="lava" element={<LavaPage />} />
        <Route path="joust" element={<JoustPage />} />
        <Route path="collect" element={<CollectPage />} />
        <Route path="bounce" element={<BouncePage />} />
        <Route path="spiral" element={<SpiralPage />} />
        <Route path="duel" element={<DuelPage />} />
        <Route path="capture" element={<CapturePage />} />
        <Route path="bombs" element={<BombsPage />} />
        <Route path="color-match" element={<ColorMatchPage />} />
        <Route path="survive" element={<SurvivePage />} />
        <Route path="climber" element={<ClimberPage />} />
        <Route path="simon" element={<SimonPage />} />
        <Route path="bunny-arena" element={<BunnyPage />} />
        <Route path="tetris" element={<TetrisPage />} />
        <Route path="worms" element={<WormsPage />} />
        <Route path="no-time-to-relax" element={<NoTimeToRelaxPage />} />
        <Route path="ultimate-chicken-horse" element={<UltimateChickenHorsePage />} />
        <Route path="police-stories" element={<PoliceStoriesPage />} />
        <Route path="danger-zone-area-control" element={<EightMinuteEmpirePage />} />
        <Route path="war-is-on-rts" element={<ToothAndTailPage />} />
        <Route path="sensible-soccer" element={<SensibleSoccerPage />} />
        <Route path="underpaid-timemanagement" element={<OvercookedPage />} />
        <Route path="uplink" element={<UplinkPage />} />
        <Route path="menace-shooter" element={<GTA2Page />} />
        <Route path="atomic-postapo" element={<FalloutPage />} />
        <Route path="flatworld-survival-shooter" element={<SoldatPage />} />
        <Route path="swords-and-sandals" element={<SwordsAndSandalsPage />} />
        <Route path="magic-decks-tcg" element={<MagicTheGatheringPage />} />
        <Route path="river-city-girls" element={<RiverCityGirlsPage />} />
        <Route path="battle-of-wesnoth" element={<BattleOfWesnothPage />} />
        <Route path="warzone-fpp" element={<BattlefieldPage />} />
        <Route path="adventure-capitalist" element={<AdventureCapitalistPage />} />
        <Route path="might-and-magic" element={<MightAndMagicPage />} />
        <Route path="game-of-castles" element={<HeroesOfMightAndMagicPage />} />
        <Route path="oil-imperium" element={<OilImperiumPage />} />
        <Route path="transport-tycoon" element={<TransportTycoonPage />} />
        <Route path="sim-city" element={<SimCityPage />} />
        <Route path="rts" element={<RTSPage />} />
        <Route path="settlers" element={<SettlersPage />} />
        <Route path="civilization" element={<CivilizationPage />} />
        <Route path="league-of-legends" element={<LeagueOfLegendsPage />} />
        <Route path="pokemon" element={<PokemonPage />} />
        <Route path="auto-survivors" element={<AutoSurvivorsPage />} />
        <Route path="shmup" element={<ShmupPage />} />
        <Route path="doom" element={<DoomPage />} />
        <Route path="memo" element={<MemoPage />} />
        <Route path="drag-racing" element={<DragRacingPage />} />
        <Route path="car-dodge" element={<CarDodgePage />} />
        <Route path="star-merchant" element={<StarMerchantPage />} />
        <Route path="master-of-orion" element={<MasterOfOrionPage />} />
        <Route path="puzzle" element={<PuzzlePage />} />
        <Route path="pipes" element={<PipesPage />} />
        <Route path="sim-tower" element={<SimTowerPage />} />
        <Route path="icy-tower" element={<IcyTowerPage />} />
        <Route path="ships" element={<ShipsPage />} />
        <Route path="horizon-chase" element={<HorizonChasePage />} />
        <Route path="escape-room" element={<EscapeRoomPage />} />
        <Route path="spore" element={<SporePage />} />
        <Route path="auction-house" element={<AuctionHousePage />} />
        <Route path="empire-rts" element={<EmpirePage />} />
        <Route path="honest-living/*" element={<Navigate to="/honest-living" replace />} />
        <Route path="song" element={<SongMiniGamesPage />} />
        <Route path="join/:roomId" element={<JoinRoomPage />} />
      </Routes>
    </Suspense>
  )
}
