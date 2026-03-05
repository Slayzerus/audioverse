import React, { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiUser, { getUserPhotoUrl, uploadUserPhoto, deleteUserPhoto } from "../../scripts/api/apiUser";
import {
  useContactDetailQuery,
  useUpdateContactMutation,
  createContact,
  fetchContacts,
} from "../../scripts/api/apiContacts";
import type { UserProfilePlayer } from "../../models/modelsKaraoke";
import type { ContactUpdateRequest } from "../../models/modelsContacts";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userId } = useUser();
  const queryClient = useQueryClient();

  // Fetch the user's primary player (for avatar / display name)
  const { data: players = [], isLoading: playersLoading } = useQuery<UserProfilePlayer[]>({
    queryKey: ["user", "profilePlayers", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await apiUser.getProfilePlayers(userId);
      return Array.isArray(res) ? res : (res as { players?: UserProfilePlayer[] }).players ?? [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const primaryPlayer = players.find(p => p.isPrimary) ?? players[0] ?? null;

  // ── Find the user's linked contact from the contacts list ──
  const { data: linkedContactEntry, isLoading: linkedLoading } = useQuery({
    queryKey: ["contacts", "linked-to-user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetchContacts({ pageSize: 500 });
      return res.items.find(c => c.linkedUserId === userId) ?? null;
    },
    enabled: !!userId,
    staleTime: 120_000,
  });

  const contactId = linkedContactEntry?.id ?? null;

  // ── Auto-create a contact ONLY if we checked and none is linked ──
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const autoCreating = useRef(false);

  useEffect(() => {
    // Wait until both players and contacts queries are done
    if (playersLoading || linkedLoading || contactId || autoCreating.current || !userId) return;
    autoCreating.current = true;

    // Prefer username for auto-creating contact; player name is a fallback
    const displayName = currentUser?.username || primaryPlayer?.displayName || primaryPlayer?.name || "";
    const parts = displayName.split(/\s+/);
    const firstName = parts[0] || undefined;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

    createContact({
      firstName,
      lastName,
      displayName: displayName || undefined,
      linkedUserId: userId,
    })
      .then(() => {
        setJustCreated(true);
        // Re-fetch the linked contact query so contactId gets populated
        queryClient.invalidateQueries({ queryKey: ["contacts", "linked-to-user", userId] });
      })
      .catch(() => {
        setAutoCreateError(t("profilePage.autoCreateFailed", "Nie udało się automatycznie utworzyć wizytówki."));
      })
      .finally(() => {
        autoCreating.current = false;
      });
  }, [playersLoading, linkedLoading, contactId, userId, primaryPlayer, currentUser, queryClient, t]);

  // ── Fetch full contact detail ──
  const { data: contact, isLoading: contactLoading } = useContactDetailQuery(contactId ?? undefined, {
    enabled: contactId != null && contactId > 0,
  });

  const updateMutation = useUpdateContactMutation();

  // ── Profile photo upload / delete ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Cache-bust key: incremented after upload/delete so the <img> re-fetches
  const [photoCacheBust, setPhotoCacheBust] = useState(0);
  const [photoExists, setPhotoExists] = useState(true);

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate client-side
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setPhotoError(t('profilePage.photoInvalidType', 'Dozwolone formaty: JPEG, PNG, WebP, GIF'));
      return;
    }
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      await uploadUserPhoto(file);
      setPhotoCacheBust(prev => prev + 1);
      setPhotoExists(true);
    } catch {
      setPhotoError(t('profilePage.photoUploadFailed', 'Nie udało się wgrać zdjęcia.'));
    } finally {
      setPhotoUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [t]);

  const handlePhotoDelete = useCallback(async () => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      await deleteUserPhoto();
      setPhotoCacheBust(prev => prev + 1);
      setPhotoExists(false);
    } catch {
      setPhotoError(t('profilePage.photoDeleteFailed', 'Nie udało się usunąć zdjęcia.'));
    } finally {
      setPhotoUploading(false);
    }
  }, [t]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayNamePrivate: "",
    nickname: "",
    company: "",
    jobTitle: "",
  });

  // Auto-open edit mode when contact was just created (fresh, empty contact)
  const [autoEditDone, setAutoEditDone] = useState(false);
  useEffect(() => {
    if (justCreated && contact && !autoEditDone) {
      setForm({
        firstName: contact.firstName ?? "",
        lastName: contact.lastName ?? "",
        displayNamePrivate: contact.displayNamePrivate ?? "",
        nickname: contact.nickname ?? "",
        company: contact.company ?? "",
        jobTitle: contact.jobTitle ?? "",
      });
      setEditing(true);
      setAutoEditDone(true);
    }
  }, [justCreated, contact, autoEditDone]);

  const startEdit = useCallback(() => {
    if (!contact) return;
    setForm({
      firstName: contact.firstName ?? "",
      lastName: contact.lastName ?? "",
      displayNamePrivate: contact.displayNamePrivate ?? "",
      nickname: contact.nickname ?? "",
      company: contact.company ?? "",
      jobTitle: contact.jobTitle ?? "",
    });
    setEditing(true);
  }, [contact]);

  const handleSave = useCallback(() => {
    if (!contactId) return;
    const req: ContactUpdateRequest = {
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      displayNamePrivate: form.displayNamePrivate || undefined,
      nickname: form.nickname || undefined,
      company: form.company || undefined,
      jobTitle: form.jobTitle || undefined,
    };
    updateMutation.mutate(
      { id: contactId, req },
      {
        onSuccess: () => {
          setEditing(false);
          // Refresh both contact detail and the linked contact entry
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
      },
    );
  }, [contactId, form, updateMutation, queryClient]);

  const isLoading = playersLoading || linkedLoading || (contactId != null && contactLoading);

  return (
    <div className="container py-4" style={{ maxWidth: 680 }}>
      <h2 className="mb-4">{t("profilePage.title", "Mój profil")}</h2>

      {/* User profile card — shows UserProfile data (NOT player data) */}
      {currentUser && (
        <div className="card mb-4">
          <div className="card-body d-flex align-items-center gap-3">
            {/* Avatar with upload overlay */}
            <div className="position-relative" style={{ width: 88, height: 88, flexShrink: 0 }}>
              <div
                className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
                style={{ width: 88, height: 88, backgroundColor: "#6c757d" }}
              >
                {userId && photoExists ? (
                  <img
                    src={`${getUserPhotoUrl(userId)}?v=${photoCacheBust}`}
                    alt={currentUser.username ?? ""}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                    onError={() => setPhotoExists(false)}
                  />
                ) : (
                  <i className="fa-solid fa-user text-white" style={{ fontSize: 36 }} />
                )}
              </div>
              {/* Upload / delete overlay buttons */}
              <div className="position-absolute bottom-0 end-0 d-flex gap-1">
                <button
                  className="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 28, height: 28, padding: 0 }}
                  title={t('profilePage.uploadPhoto', 'Zmień zdjęcie')}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {photoUploading
                    ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                    : <i className="fa-solid fa-camera" style={{ fontSize: 12 }} />}
                </button>
                {photoExists && (
                  <button
                    className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 28, height: 28, padding: 0 }}
                    title={t('profilePage.deletePhoto', 'Usuń zdjęcie')}
                    onClick={handlePhotoDelete}
                    disabled={photoUploading}
                  >
                    <i className="fa-solid fa-trash" style={{ fontSize: 11 }} />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="d-none"
                onChange={handlePhotoSelect}
              />
            </div>
            <div>
              <h5 className="mb-0">{contact?.displayName || (contact?.firstName || contact?.lastName ? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() : null) || currentUser.username}</h5>
              <small className="text-muted">{currentUser.username} &middot; ID {currentUser.userId}</small>
              {photoError && (
                <div className="text-danger small mt-1">
                  <i className="fa-solid fa-exclamation-circle me-1" />{photoError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact form */}
      {isLoading || (!contactId && primaryPlayer && !autoCreateError && !linkedLoading) ? (
        <div className="text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" />
          {t("profilePage.loadingContact", "Ładuję wizytówkę...")}
        </div>
      ) : autoCreateError ? (
        <div className="alert alert-danger">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          {autoCreateError}
        </div>
      ) : !contact ? (
        <div className="alert alert-warning">
          {t("profilePage.contactNotFound", "Nie znaleziono kontaktu.")}
        </div>
      ) : (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t("profilePage.contactCard", "Wizytówka")}</h5>
            <div className="d-flex gap-1">
              {editing ? (
                <>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <i className="fa-solid fa-check me-1" />
                    {updateMutation.isPending ? t("common.saving", "Zapisuję...") : t("common.save", "Zapisz")}
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(false)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </>
              ) : (
                <button className="btn btn-sm btn-outline-primary" onClick={startEdit}>
                  <i className="fa-solid fa-pen me-1" />{t("common.edit", "Edytuj")}
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            {editing ? (
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.firstName", "Imię")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.lastName", "Nazwisko")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.displayNamePrivate", "Nazwa prywatna")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.displayNamePrivate}
                    onChange={e => setForm(f => ({ ...f, displayNamePrivate: e.target.value }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.nickname", "Nick")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.nickname}
                    onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.company", "Firma")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted">{t("contact.jobTitle", "Stanowisko")}</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.jobTitle}
                    onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="row g-2">
                <Field label={t("contact.firstName", "Imię")} value={contact.firstName} />
                <Field label={t("contact.lastName", "Nazwisko")} value={contact.lastName} />
                <Field label={t("contact.displayName", "Nazwa wyświetlana")} value={contact.displayName} />
                <Field label={t("contact.displayNamePrivate", "Nazwa prywatna")} value={contact.displayNamePrivate} />
                <Field label={t("contact.nickname", "Nick")} value={contact.nickname} />
                <Field label={t("contact.company", "Firma")} value={contact.company} />
                <Field label={t("contact.jobTitle", "Stanowisko")} value={contact.jobTitle} />
              </div>
            )}

            {/* Emails (read-only for now) */}
            {contact.emails.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <h6 className="small text-muted text-uppercase mb-2">{t("contact.emails", "E-maile")}</h6>
                {contact.emails.map(e => (
                  <div key={e.id} className="d-flex justify-content-between small mb-1">
                    <a href={`mailto:${e.email}`}>{e.email}</a>
                    {e.isPrimary && <span className="badge bg-success">Primary</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Phones (read-only for now) */}
            {contact.phones.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <h6 className="small text-muted text-uppercase mb-2">{t("contact.phones", "Telefony")}</h6>
                {contact.phones.map(p => (
                  <div key={p.id} className="d-flex justify-content-between small mb-1">
                    <a href={`tel:${p.phoneNumber}`}>{p.phoneNumber}</a>
                    {p.isPrimary && <span className="badge bg-success">Primary</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Simple label+value field for read-only mode */
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="col-sm-6">
      <div className="small text-muted">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default ProfilePage;
