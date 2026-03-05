import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useToast } from "../ui/ToastProvider";
import { motion, AnimatePresence } from 'framer-motion';
import { useCreatePartyMutation } from "../../scripts/api/apiKaraoke";
import { useUser } from "../../contexts/UserContext";
import { useGameContext } from "../../contexts/GameContext";
import { Focusable } from "../common/Focusable";

interface CreatePartyFormProps {
    onCreated?: (partyId: number) => void;
}

/**
 * Detect the organizerId to use when creating a new party.
 * Event.OrganizerId is a Player (UserProfilePlayer) FK.
 * Prefers the primary Player ID from GameContext, then UserContext playerIds.
 */
const detectOrganizerId = (
    gamePlayers: { id: number }[],
    playerIdsFromCtx: number[],
): number | undefined => {
    // 1. Prefer the first game-context player (loaded from backend, typically the primary)
    if (gamePlayers.length > 0 && gamePlayers[0].id > 0) return gamePlayers[0].id;

    // 2. Fallback: first player ID from UserContext (populated from /me response)
    if (playerIdsFromCtx.length > 0) return playerIdsFromCtx[0];

    return undefined;
};

const CreatePartyForm: React.FC<CreatePartyFormProps> = ({ onCreated }) => {
    const { t } = useTranslation();
    const { playerIds } = useUser();
    const { state: gameState } = useGameContext();
    const organizerId = detectOrganizerId(gameState.players, playerIds);
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState(() => {
        // Default: now, rounded to the nearest minute, in local datetime-local format
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    });

    const createMutation = useCreatePartyMutation();

    // Poster file handling
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const MAX_POSTER_BYTES = 5 * 1024 * 1024; // 5 MB default
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !organizerId) return;

        // Prepare payload: if posterFile present, use FormData
        let payload: FormData | { name: string; description: string; organizerId: number; startTime: string };

        if (posterFile) {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('description', description.trim());
            fd.append('organizerId', String(organizerId));
            fd.append('startTime', new Date(startTime).toISOString());
            fd.append('poster', posterFile, posterFile.name);
            payload = fd;
        } else {
            payload = {
                name: name.trim(),
                description: description.trim(),
                organizerId,
                startTime: new Date(startTime).toISOString(),
            };
        }

        createMutation.mutate(
            payload,
            {
                onSuccess: (created) => {
                    setName("");
                    setDescription("");
                    setPosterFile(null);
                    if (posterPreview) { URL.revokeObjectURL(posterPreview); setPosterPreview(null); }
                    onCreated?.(created.id);
                },
            }
        );
    };

    const handlePosterChange = (f?: File | null) => {
        if (!f) {
            setPosterFile(null); if (posterPreview) { URL.revokeObjectURL(posterPreview); setPosterPreview(null); }
            return;
        }
        // client-side validation
        if (f.size > MAX_POSTER_BYTES) { showToast(t('createParty.posterTooLarge'), 'error'); return; }
        if (!ALLOWED_TYPES.includes(f.type)) { showToast(t('createParty.unsupportedFileType'), 'error'); return; }
        setPosterFile(f);
        const url = URL.createObjectURL(f);
        setPosterPreview(url);
    };

    return (
        <div>
                <AnimatePresence>
            {!organizerId && (
                <motion.div key="noauth" initial={{ opacity: 0, y: -8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.995 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="alert alert-warning">{t('createParty.mustBeLoggedIn')}</motion.div>
            )}
            </AnimatePresence>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">{t('createParty.nameLabel')}</label>
                    <Focusable id="create-party-name">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('createParty.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </Focusable>
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('createParty.descriptionLabel')}</label>
                    <Focusable id="create-party-description">
                        <textarea
                            className="form-control"
                            placeholder={t('createParty.descriptionPlaceholder')}
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Focusable>
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('createParty.posterLabel')}</label>
                    <div>
                        <input type="file" accept={ALLOWED_TYPES.join(',')} onChange={(e) => handlePosterChange(e.target.files?.[0] ?? null)} />
                        {posterPreview && (
                            <div style={{ marginTop: 8 }}>
                                <img src={posterPreview} alt="poster preview" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 6 }} />
                                <div>
                                    <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => handlePosterChange(null)}>{t('createParty.removePoster')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('createParty.startTimeLabel')}</label>
                    <Focusable id="create-party-start-time">
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </Focusable>
                </div>
                <Focusable id="create-party-submit">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={createMutation.isPending || !name.trim() || !organizerId}
                    >
                        {createMutation.isPending ? t('createParty.submitCreating') : t('createParty.submitCreate')}
                    </button>
                </Focusable>
                <AnimatePresence>
                {createMutation.isError && (
                    <motion.div key="createErr" initial={{ opacity: 0, y: -8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.995 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="text-danger mt-2">
                        {t('createParty.createError')}
                    </motion.div>
                )}
                </AnimatePresence>
            </form>
        </div>
    );
};

export default CreatePartyForm;
