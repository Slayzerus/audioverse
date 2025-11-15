import { Routes, Route } from "react-router-dom"; // ✅ Router jest już w `main.tsx`
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
/*import PartyPage from "./pages/profile/PartyPage.tsx";*/
import PlayerPage from "./pages/profile/PlayerPage.tsx";
import KaraokeSongBrowser from "./pages/party/KaraokeSongBrowser.tsx";
import KaraokePlaylistPage from "./pages/party/KaraokePlaylistPage.tsx";
import KaraokeRoundPage from "./pages/party/KaraokeRoundPage.tsx";
import AudioEditorPage from "./pages/create/AudioEditorPage.tsx";
import ControllerPage from "./pages/settings/ControllerPage.tsx";
import AudioSettingsPage from "./pages/settings/AudioSettingsPage.tsx";
import PartiesPage from "./pages/party/PartiesPage.tsx";
import PlayPage from "./pages/play/PlayPage.tsx";
import ExplorePage from "./pages/explore/ExplorePage.tsx";
import CreatePage from "./pages/create/CreatePage.tsx";
import EnjoyPage from "./pages/enjoy/EnjoyPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import {UserProvider} from "./components/UserContext.tsx";
import ProjectsPage from "./pages/create/ProjectsPage.tsx";
import MusicPlayerPage from "./pages/enjoy/MusicPlayerPage.tsx";
import DmxEditorPage from "./pages/dmx/DmxEditorPage.tsx";
import AnimatedPersonsPage from "./pages/create/AnimatedPersonsPage.tsx";
import LibraryPage from "./pages/explore/LibraryPage.tsx";

const App: React.FC = () => {
    return (
        <UserProvider>
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route path="/play" element={<PlayPage />} />
                <Route path="/parties" element={<PartiesPage />} />
                <Route path="/players" element={<PlayerPage />} />
                <Route path="/songs" element={<KaraokeSongBrowser />} />
                <Route path="/playlists" element={<KaraokePlaylistPage />} />
                <Route path="/rounds" element={<KaraokeRoundPage />} />
                <Route path="/characters" element={<AnimatedPersonsPage />} />

                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/library" element={<LibraryPage />} />

                <Route path="/enjoy" element={<EnjoyPage />} />
                <Route path="/dmxEditor" element={<DmxEditorPage />} />
                <Route path="/musicPlayer" element={<MusicPlayerPage />} />

                <Route path="/create" element={<CreatePage />} />
                <Route path="/create/projects" element={<ProjectsPage />} />
                <Route path="/create/studio/:projectId" element={<AudioEditorPage />} />

                {/*Settings*/}
                <Route path="/settings/controller" element={<ControllerPage />} />
                <Route path="/settings/audioInput" element={<AudioSettingsPage />} />
            </Routes>
        </>
        </UserProvider>
    );
};

export default App;
