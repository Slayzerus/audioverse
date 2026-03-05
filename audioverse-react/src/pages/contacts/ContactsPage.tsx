// ContactsPage.tsx — Address book page with contacts list, groups sidebar, search, CRUD
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  useContactsQuery,
  useContactGroupsQuery,
  useCreateContactMutation,
  useDeleteContactMutation,
  useToggleContactFavoriteMutation,
  useCreateContactGroupMutation,
  useDeleteContactGroupMutation,
  useImportContactsMutation,
  type ContactsListParams,
} from "../../scripts/api/apiContacts";
import type {
  ContactListDto,
  ContactCreateRequest,
  ContactEmailInput,
  ContactPhoneInput,
} from "../../models/modelsContacts";
import { ContactEmailType, ContactPhoneType, ContactImportSource } from "../../models/modelsContacts";
import ContactDetailPanel from "../../components/contacts/ContactDetailPanel";

const ContactsPage: React.FC = () => {
  const [params, setParams] = useState<ContactsListParams>({ page: 1, pageSize: 50 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>(undefined);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setParams(prev => ({
      ...prev,
      search: debouncedSearch || undefined,
      groupId: selectedGroupId,
      favorites: showFavorites || undefined,
      page: 1,
    }));
  }, [debouncedSearch, selectedGroupId, showFavorites]);

  const { data: contactsData, isLoading } = useContactsQuery(params);
  const { data: groups } = useContactGroupsQuery();
  const toggleFav = useToggleContactFavoriteMutation();
  const deleteMutation = useDeleteContactMutation();
  const createMutation = useCreateContactMutation();
  const createGroupMutation = useCreateContactGroupMutation();
  const deleteGroupMutation = useDeleteContactGroupMutation();
  const importMutation = useImportContactsMutation();

  const contacts = contactsData?.items ?? [];
  const totalContacts = contactsData?.total ?? 0;
  const totalPages = Math.ceil(totalContacts / (params.pageSize ?? 50));

  const handleToggleFavorite = useCallback((id: number) => {
    toggleFav.mutate(id);
  }, [toggleFav]);

  const handleDelete = useCallback((id: number) => {
    if (confirm("Delete this contact?")) {
      deleteMutation.mutate(id);
      if (selectedContactId === id) setSelectedContactId(undefined);
    }
  }, [deleteMutation, selectedContactId]);

  const handleCreateGroup = useCallback(() => {
    const name = prompt("Group name:");
    if (name) createGroupMutation.mutate({ name });
  }, [createGroupMutation]);

  const handleDeleteGroup = useCallback((groupId: number) => {
    if (confirm("Delete this group? Contacts won't be deleted.")) {
      deleteGroupMutation.mutate(groupId);
      if (selectedGroupId === groupId) setSelectedGroupId(undefined);
    }
  }, [deleteGroupMutation, selectedGroupId]);

  return (
    <div className="container-fluid py-3" role="main" aria-label="Contacts">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2><i className="bi bi-person-lines-fill me-2" />Contacts</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowImport(!showImport)}>
            <i className="bi bi-cloud-upload me-1" />Import
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => { setShowCreate(true); setSelectedContactId(undefined); }}>
            <i className="bi bi-plus me-1" />New contact
          </button>
        </div>
      </div>

      {showImport && <ImportPanel importMutation={importMutation} onClose={() => setShowImport(false)} />}

      <div className="d-flex gap-3" style={{ minHeight: "calc(100vh - 160px)" }}>
        {/* Groups sidebar */}
        <aside className="border-end pe-3" style={{ width: 220 }}>
          <h6 className="text-uppercase text-muted small fw-bold mb-2">Groups</h6>
          <button
            className={`btn btn-sm w-100 text-start mb-1 ${!selectedGroupId && !showFavorites ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => { setSelectedGroupId(undefined); setShowFavorites(false); }}
          >
            <i className="bi bi-people me-1" />All ({totalContacts})
          </button>
          <button
            className={`btn btn-sm w-100 text-start mb-2 ${showFavorites ? "btn-warning" : "btn-outline-secondary"}`}
            onClick={() => { setShowFavorites(!showFavorites); setSelectedGroupId(undefined); }}
          >
            <i className="bi bi-star me-1" />Favorites
          </button>

          {groups?.map(g => (
            <div key={g.id} className="d-flex align-items-center mb-1">
              <button
                className={`btn btn-sm flex-grow-1 text-start text-truncate ${selectedGroupId === g.id ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => { setSelectedGroupId(g.id); setShowFavorites(false); }}
              >
                {g.icon && <i className={`bi bi-${g.icon} me-1`} />}
                {g.name}
                <span className="badge bg-secondary ms-1 small">{g.memberCount}</span>
              </button>
              <button className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => handleDeleteGroup(g.id)}>
                <i className="bi bi-x" />
              </button>
            </div>
          ))}

          <button className="btn btn-sm btn-outline-secondary w-100 mt-2" onClick={handleCreateGroup}>
            <i className="bi bi-plus me-1" />New group
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
          {/* Search bar */}
          <div className="mb-3">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search contacts"
            />
          </div>

          {isLoading ? (
            <div className="text-muted">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-muted p-4 text-center">No contacts found.</div>
          ) : (
            <div className="d-flex flex-grow-1 gap-3" style={{ minHeight: 0 }}>
              {/* Contact list */}
              <div className="flex-grow-1" style={{ overflowY: "auto" }}>
                <table className="table table-hover table-sm small align-middle">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Company</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <ContactRow
                        key={c.id}
                        contact={c}
                        isSelected={selectedContactId === c.id}
                        onSelect={() => { setSelectedContactId(c.id); setShowCreate(false); }}
                        onToggleFavorite={() => handleToggleFavorite(c.id)}
                        onDelete={() => handleDelete(c.id)}
                      />
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="d-flex justify-content-center">
                    <ul className="pagination pagination-sm">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${params.page === p ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setParams(prev => ({ ...prev, page: p }))}>
                            {p}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>

              {/* Detail or create panel */}
              {(selectedContactId || showCreate) && (
                <div className="border-start ps-3" style={{ width: 380, overflowY: "auto" }}>
                  {showCreate ? (
                    <CreateContactForm
                      onCreate={(req) => {
                        createMutation.mutate(req, {
                          onSuccess: () => setShowCreate(false),
                        });
                      }}
                      onCancel={() => setShowCreate(false)}
                    />
                  ) : (
                    <ContactDetailPanel
                      contactId={selectedContactId!}
                      onClose={() => setSelectedContactId(undefined)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// === Sub-components ===

function ContactRow({
  contact,
  isSelected,
  onSelect,
  onToggleFavorite,
  onDelete,
}: {
  contact: ContactListDto;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <tr
      className={isSelected ? "table-primary" : ""}
      style={{ cursor: "pointer" }}
      onClick={onSelect}
    >
      <td>
        <button
          className={`btn btn-sm p-0 ${contact.isFavorite ? "text-warning" : "text-muted"}`}
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          title="Toggle favorite"
        >
          <i className={`bi ${contact.isFavorite ? "bi-star-fill" : "bi-star"}`} />
        </button>
      </td>
      <td className="fw-semibold">
        {contact.avatarUrl ? (
          <img src={contact.avatarUrl} alt={`${contact.displayName} avatar`} className="rounded-circle me-1" width={20} height={20} />
        ) : (
          <i className={`bi ${contact.isOrganization ? "bi-building" : "bi-person-circle"} me-1 opacity-50`} />
        )}
        {contact.displayName}
      </td>
      <td className="text-muted">{contact.primaryEmail ?? "—"}</td>
      <td className="text-muted">{contact.primaryPhone ?? "—"}</td>
      <td className="text-muted">{contact.company ?? "—"}</td>
      <td>
        <button
          className="btn btn-sm btn-link text-danger p-0"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <i className="bi bi-trash" />
        </button>
      </td>
    </tr>
  );
}

function CreateContactForm({
  onCreate,
  onCancel,
}: {
  onCreate: (req: ContactCreateRequest) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayNamePrivate, setDisplayNamePrivate] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails: ContactEmailInput[] = email ? [{ email, type: ContactEmailType.Personal, isPrimary: true }] : [];
    const phones: ContactPhoneInput[] = phone ? [{ phoneNumber: phone, type: ContactPhoneType.Mobile, isPrimary: true }] : [];
    onCreate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      displayNamePrivate: displayNamePrivate || undefined,
      company: company || undefined,
      emails,
      phones,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="mb-3">New Contact</h5>
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
      </div>
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="Display name (private)" value={displayNamePrivate} onChange={e => setDisplayNamePrivate(e.target.value)} />
      </div>
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
      </div>
      <div className="mb-2">
        <input type="email" className="form-control form-control-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <input type="tel" className="form-control form-control-sm" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-sm btn-primary">Create</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ImportPanel({
  importMutation,
  onClose,
}: {
  importMutation: ReturnType<typeof useImportContactsMutation>;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const sourceOptions = useMemo(() => [
    { value: ContactImportSource.Csv, label: "CSV" },
    { value: ContactImportSource.VCard, label: "vCard (.vcf)" },
    { value: ContactImportSource.Google, label: "Google" },
    { value: ContactImportSource.Microsoft, label: "Microsoft" },
    { value: ContactImportSource.Apple, label: "Apple" },
  ], []);
  const [source, setSource] = useState<number>(ContactImportSource.Csv);

  const handleImport = async () => {
    if (!file) return;
    const text = await file.text();
    // Simple CSV parsing (assumes header row: firstName,lastName,email,phone)
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const contacts = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
      return {
        firstName: obj["firstname"] || obj["first name"] || undefined,
        lastName: obj["lastname"] || obj["last name"] || undefined,
        displayName: obj["displayname"] || obj["name"] || undefined,
        company: obj["company"] || obj["organization"] || undefined,
        emails: obj["email"] ? [{ email: obj["email"], isPrimary: true }] : [],
        phones: obj["phone"] || obj["phonenumber"]
          ? [{ phoneNumber: obj["phone"] || obj["phonenumber"], isPrimary: true }]
          : [],
      };
    });
    importMutation.mutate({ source, contacts }, { onSuccess: () => onClose() });
  };

  return (
    <div className="alert alert-info d-flex align-items-center gap-3 mb-3">
      <select className="form-select form-select-sm" style={{ width: 120 }} value={source} onChange={e => setSource(Number(e.target.value))}>
        {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input type="file" className="form-control form-control-sm" accept=".csv,.vcf,.json" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <button className="btn btn-sm btn-primary" disabled={!file} onClick={handleImport}>Import</button>
      <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
      {importMutation.data && (
        <span className="text-success small">
          Imported {importMutation.data.imported}, updated {importMutation.data.updated}, skipped {importMutation.data.skipped}
        </span>
      )}
    </div>
  );
}

export default ContactsPage;
