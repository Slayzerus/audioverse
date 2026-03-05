import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { useTranslation } from 'react-i18next';

const SongFilter = () => {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <Container>
            <h2>{t('songFilter.header')}</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>{t('songFilter.labelTitle')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('songFilter.placeholderTitle')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>{t('songFilter.labelArtist')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('songFilter.placeholderArtist')}
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                    />
                </Form.Group>
                <Button variant="info" type="submit">
                    {t('songFilter.search')}
                </Button>
            </Form>
        </Container>
    );
};

export default SongFilter;
