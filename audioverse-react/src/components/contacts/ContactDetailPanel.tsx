// ContactDetailPanel.tsx — Right-side detail view + inline edit for a contact
import React, { useState, useCallback } from "react";
import {
  useContactDetailQuery,
  useUpdateContactMutation,
} from "../../scripts/api/apiContacts";
import { ContactEmailType, ContactPhoneType, ContactAddressType } from "../../models/modelsContacts";

const emailTypeLabels: Record<number, string> = {
  [ContactEmailType.Personal]: "Personal",
  [ContactEmailType.Work]: "Work",
  [ContactEmailType.Other]: "Other",
};
const phoneTypeLabels: Record<number, string> = {
  [ContactPhoneType.Mobile]: "Mobile",
  [ContactPhoneType.Home]: "Home",
  [ContactPhoneType.Work]: "Work",
  [ContactPhoneType.Fax]: "Fax",
  [ContactPhoneType.Other]: "Other",
};
const addressTypeLabels: Record<number, string> = {
  [ContactAddressType.Home]: "Home",
  [ContactAddressType.Work]: "Work",
  [ContactAddressType.Billing]: "Billing",
  [ContactAddressType.Shipping]: "Shipping",
  [ContactAddressType.Other]: "Other",
};

interface ContactDetailPanelProps {
  contactId: number;
  onClose: () => void;
}

const ContactDetailPanel: React.FC<ContactDetailPanelProps> = ({ contactId, onClose }) => {
  const { data: contact, isLoading } = useContactDetailQuery(contactId);
  const updateMutation = useUpdateContactMutation();
  const [editing, setEditing] = useState(false);

  // Inline edit state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDisplayNamePrivate, setEditDisplayNamePrivate] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const startEdit = useCallback(() => {
    if (!contact) return;
    setEditFirstName(contact.firstName ?? "");
    setEditLastName(contact.lastName ?? "");
    setEditDisplayNamePrivate(contact.displayNamePrivate ?? "");
    setEditCompany(contact.company ?? "");
    setEditJobTitle(contact.jobTitle ?? "");
    setEditNotes(contact.notes ?? "");
    setEditing(true);
  }, [contact]);

  const saveEdit = useCallback(() => {
    updateMutation.mutate(
      {
        id: contactId,
        req: {
          firstName: editFirstName || undefined,
          lastName: editLastName || undefined,
          displayNamePrivate: editDisplayNamePrivate || undefined,
          company: editCompany || undefined,
          jobTitle: editJobTitle || undefined,
          notes: editNotes || undefined,
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  }, [contactId, editFirstName, editLastName, editDisplayNamePrivate, editCompany, editJobTitle, editNotes, updateMutation]);

  if (isLoading) return <div className="text-muted small">Loading...</div>;
  if (!contact) return <div className="text-danger small">Contact not found.</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h5 className="mb-0">{contact.displayName}</h5>
          {contact.jobTitle && <small className="text-muted">{contact.jobTitle}</small>}
          {contact.company && <small className="text-muted d-block">{contact.company}</small>}
        </div>
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-primary" onClick={editing ? saveEdit : startEdit}>
            <i className={`bi ${editing ? "bi-check" : "bi-pencil"}`} />
          </button>
          {editing && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(false)}>
              <i className="bi bi-x" />
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mb-3">
          <input className="form-control form-control-sm mb-1" placeholder="First name" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
          <input className="form-control form-control-sm mb-1" placeholder="Last name" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
          <input className="form-control form-control-sm mb-1" placeholder="Display name (private)" value={editDisplayNamePrivate} onChange={e => setEditDisplayNamePrivate(e.target.value)} />
          <input className="form-control form-control-sm mb-1" placeholder="Company" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
          <input className="form-control form-control-sm mb-1" placeholder="Job title" value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} />
          <textarea className="form-control form-control-sm" placeholder="Notes" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
        </div>
      ) : (
        <>
          {contact.nickname && <p className="small text-muted mb-2">Nickname: {contact.nickname}</p>}
          {contact.displayNamePrivate && <p className="small text-muted mb-2">Private name: {contact.displayNamePrivate}</p>}
          {contact.notes && <p className="small mb-3 fst-italic">{contact.notes}</p>}
        </>
      )}

      {/* Emails */}
      {contact.emails.length > 0 && (
        <Section title="Emails">
          {contact.emails.map(e => (
            <div key={e.id} className="d-flex justify-content-between small mb-1">
              <span>
                <a href={`mailto:${e.email}`}>{e.email}</a>
                {e.isPrimary && <span className="badge bg-success ms-1">Primary</span>}
              </span>
              <span className="text-muted">{emailTypeLabels[e.type] ?? "Other"}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Phones */}
      {contact.phones.length > 0 && (
        <Section title="Phones">
          {contact.phones.map(p => (
            <div key={p.id} className="d-flex justify-content-between small mb-1">
              <span>
                <a href={`tel:${p.phoneNumber}`}>{p.phoneNumber}</a>
                {p.isPrimary && <span className="badge bg-success ms-1">Primary</span>}
              </span>
              <span className="text-muted">{phoneTypeLabels[p.type] ?? "Other"}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Addresses */}
      {contact.addresses.length > 0 && (
        <Section title="Addresses">
          {contact.addresses.map(a => (
            <div key={a.id} className="small mb-2 border rounded p-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-semibold">{addressTypeLabels[a.type] ?? "Other"}</span>
                {a.isPrimary && <span className="badge bg-success">Primary</span>}
              </div>
              <div>{a.street}</div>
              {a.street2 && <div>{a.street2}</div>}
              <div>{a.postalCode} {a.city}</div>
              {a.state && <div>{a.state}</div>}
              <div>{a.country}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Groups */}
      {contact.groups.length > 0 && (
        <Section title="Groups">
          <div className="d-flex flex-wrap gap-1">
            {contact.groups.map(g => (
              <span key={g.groupId} className="badge bg-secondary">{g.groupName}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Meta */}
      <div className="mt-3 pt-2 border-top text-muted small">
        <div>Created: {new Date(contact.createdAt).toLocaleDateString()}</div>
        <div>Updated: {new Date(contact.updatedAt).toLocaleDateString()}</div>
        {contact.linkedUserId && <div>Linked user ID: {contact.linkedUserId}</div>}
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h6 className="text-uppercase text-muted small fw-bold mb-1">{title}</h6>
      {children}
    </div>
  );
}

export default ContactDetailPanel;
