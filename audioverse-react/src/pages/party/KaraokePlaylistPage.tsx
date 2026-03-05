import { Container } from "react-bootstrap";
import PlaylistForm from "../../components/forms/PlaylistForm.tsx";
import { useTranslation } from "react-i18next";

const KaraokePlaylistPage = () => {
    const { t } = useTranslation();
    return (
        <Container className="mt-4">
            <h2>{t("karaokePlaylistPage.title")}</h2>
            <PlaylistForm />
        </Container>
    );
};

export default KaraokePlaylistPage;
