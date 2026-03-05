using AudioVerse.Domain.Entities.Contacts;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for user address book: contacts, groups, import.
/// </summary>
public interface IContactRepository
{
    // ── Contacts ──
    Task<(IEnumerable<Contact> Items, int TotalCount)> GetContactsPagedAsync(
        int ownerUserId, int? groupId, int? organizationId, bool? favorites,
        string? search, int page, int pageSize);

    Task<Contact?> GetContactWithDetailsAsync(int id, int ownerUserId);
    Task<int> AddContactAsync(Contact contact);
    Task UpdateContactAsync(Contact contact);
    Task<bool> DeleteContactAsync(int id, int ownerUserId);
    Task<bool> ToggleFavoriteAsync(int id, int ownerUserId);
    Task<Contact?> FindByExternalIdAsync(int ownerUserId, string externalId);
    Task ReplaceEmailsAsync(Contact contact, IEnumerable<ContactEmail> emails);
    Task ReplacePhonesAsync(Contact contact, IEnumerable<ContactPhone> phones);
    Task ReplaceAddressesAsync(Contact contact, IEnumerable<ContactAddress> addresses);
    Task SaveChangesAsync();

    // ── Groups ──
    Task<IEnumerable<ContactGroup>> GetGroupsAsync(int ownerUserId);
    Task<int> AddGroupAsync(ContactGroup group);
    Task<bool> UpdateGroupAsync(int groupId, int ownerUserId, Action<ContactGroup> update);
    Task<bool> DeleteGroupAsync(int groupId, int ownerUserId);
    Task<bool> GroupExistsAsync(int groupId, int ownerUserId);

    // ── Group members ──
    Task<IEnumerable<int>> GetGroupMemberIdsAsync(int groupId);
    Task<bool> ContactExistsAsync(int contactId, int ownerUserId);
    Task AddGroupMemberAsync(int groupId, int contactId);
    Task<bool> RemoveGroupMemberAsync(int groupId, int contactId, int ownerUserId);

    // ── User search ──
    Task<IEnumerable<(int UserId, string Username, string FullName, string? Email)>> SearchUsersAsync(string term, int take);
}
