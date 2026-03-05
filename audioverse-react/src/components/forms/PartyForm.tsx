import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { createParty } from "../../scripts/api/apiKaraoke.ts"; // Import funkcji API
import { useToast } from "../ui/ToastProvider";
import { logger } from "../../utils/logger";
const log = logger.scoped('PartyForm');

/**
 * Simple manual party creation form.
 * MIGRATION NOTE: The `organizerId` field is transitioning from UserProfile.Id
 * to Player (UserProfilePlayer) ID. After backend migration, the numeric input
 * should accept a Player ID instead of a UserProfile ID.
 * Consider replacing the manual input with a player picker.
 */
const PartyForm = () => {
    const { t } = useTranslation();
    const [partyName, setPartyName] = useState("");
    const [description, setDescription] = useState("");
    const [organizerId, setOrganizerId] = useState<number | undefined>(undefined);

    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!partyName || !description || !organizerId) {
            showToast(t('partyForm.allFieldsRequired'), 'error');
            return;
        }

        try {
            await createParty({
                name: partyName,
                description: description,
                organizerId: organizerId
            });
            showToast(t('partyForm.createdSuccess'), 'success');
        } catch (error) {
            log.error("Error creating party:", error);
        }
    };

    return (
        <Container>
            <h2>{t('partyForm.title')}</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>{t('partyForm.partyName')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('partyForm.placeholderPartyName')}
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>{t('partyForm.description')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('partyForm.placeholderDescription')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>{t('partyForm.organizerId')}</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder={t('partyForm.placeholderOrganizerId')}
                        value={organizerId || ""}
                        onChange={(e) => setOrganizerId(Number(e.target.value))}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    {t('partyForm.create')}
                </Button>
            </Form>
        </Container>
    );
};

export default PartyForm;
