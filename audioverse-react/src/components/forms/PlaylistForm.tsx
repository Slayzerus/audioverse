import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { useCreatePlaylistMutation } from "../../scripts/api/apiPlaylists";
import { useTranslation } from "react-i18next";

const PlaylistForm = () => {
    const { t } = useTranslation();
    const [playlistName, setPlaylistName] = useState("");
    const [description, setDescription] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const createPlaylistMutation = useCreatePlaylistMutation();
    const isNameValid = playlistName.trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!isNameValid) return;
        createPlaylistMutation.mutate({
            platform: "None",
            name: playlistName.trim(),
            description: description.trim() || undefined,
            trackIds: [],
        }, {
            onSuccess: () => {
                setPlaylistName("");
                setDescription("");
                setSubmitted(false);
            },
        });
    };

    return (
        <Container>
            <h2>{t("playlistForm.title")}</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>{t("playlistForm.name")}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t("playlistForm.namePlaceholder")}
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        isInvalid={submitted && !isNameValid}
                    />
                    <Form.Control.Feedback type="invalid">
                        {t("playlistForm.nameRequired")}
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>{t("playlistForm.description")}</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder={t("playlistForm.descriptionPlaceholder")}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Form.Group>
                <Button variant="warning" type="submit">
                    {createPlaylistMutation.isPending ? t("playlistForm.creating") : t("playlistForm.create")}
                </Button>
                {createPlaylistMutation.isError && (
                    <div className="text-danger mt-2">{t("playlistForm.createError")}</div>
                )}
                {createPlaylistMutation.isSuccess && (
                    <div className="text-success mt-2">{t("playlistForm.created")}</div>
                )}
            </Form>
        </Container>
    );
};

export default PlaylistForm;
