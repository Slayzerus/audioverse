import { Container } from "react-bootstrap";
import PlaylistForm from "../../components/forms/PlaylistForm.tsx";

const KaraokePlaylistPage = () => {
    return (
        <Container className="mt-4">
            <h2>Manage Playlists</h2>
            <PlaylistForm />
        </Container>
    );
};

export default KaraokePlaylistPage;
