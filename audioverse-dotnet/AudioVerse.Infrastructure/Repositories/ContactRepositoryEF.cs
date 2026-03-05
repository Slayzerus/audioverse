using AudioVerse.Domain.Entities.Contacts;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of IContactRepository.
/// </summary>
public class ContactRepositoryEF : IContactRepository
{
    private readonly AudioVerseDbContext _db;
    public ContactRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<(IEnumerable<Contact> Items, int TotalCount)> GetContactsPagedAsync(
        int ownerUserId, int? groupId, int? organizationId, bool? favorites,
        string? search, int page, int pageSize)
    {
        var query = _db.Contacts.Where(c => c.OwnerUserId == ownerUserId).AsQueryable();

        if (groupId.HasValue)
            query = query.Where(c => c.GroupMemberships.Any(m => m.GroupId == groupId.Value));
        if (organizationId.HasValue)
            query = query.Where(c => c.OrganizationId == organizationId.Value);
        if (favorites == true)
            query = query.Where(c => c.IsFavorite);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(c =>
                c.DisplayName.ToLower().Contains(term) ||
                c.FirstName.ToLower().Contains(term) ||
                c.LastName.ToLower().Contains(term) ||
                (c.Company != null && c.Company.ToLower().Contains(term)) ||
                c.Emails.Any(e => e.Email.ToLower().Contains(term)) ||
                c.Phones.Any(p => p.PhoneNumber.Contains(term)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.Emails)
            .Include(c => c.Phones)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Contact?> GetContactWithDetailsAsync(int id, int ownerUserId)
        => await _db.Contacts
            .Include(c => c.Emails)
            .Include(c => c.Phones)
            .Include(c => c.Addresses)
            .Include(c => c.GroupMemberships).ThenInclude(m => m.Group)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerUserId == ownerUserId);

    public async Task<int> AddContactAsync(Contact contact)
    {
        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();
        return contact.Id;
    }

    public async Task UpdateContactAsync(Contact contact)
    {
        contact.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<bool> DeleteContactAsync(int id, int ownerUserId)
    {
        var contact = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == id && c.OwnerUserId == ownerUserId);
        if (contact == null) return false;
        _db.Contacts.Remove(contact);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleFavoriteAsync(int id, int ownerUserId)
    {
        var contact = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == id && c.OwnerUserId == ownerUserId);
        if (contact == null) return false;
        contact.IsFavorite = !contact.IsFavorite;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Contact?> FindByExternalIdAsync(int ownerUserId, string externalId)
        => await _db.Contacts
            .Include(c => c.Emails).Include(c => c.Phones).Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.OwnerUserId == ownerUserId && c.ExternalId == externalId);

    public async Task ReplaceEmailsAsync(Contact contact, IEnumerable<ContactEmail> emails)
    {
        _db.ContactEmails.RemoveRange(contact.Emails);
        foreach (var e in emails)
            contact.Emails.Add(e);
    }

    public async Task ReplacePhonesAsync(Contact contact, IEnumerable<ContactPhone> phones)
    {
        _db.ContactPhones.RemoveRange(contact.Phones);
        foreach (var p in phones)
            contact.Phones.Add(p);
    }

    public async Task ReplaceAddressesAsync(Contact contact, IEnumerable<ContactAddress> addresses)
    {
        _db.ContactAddresses.RemoveRange(contact.Addresses);
        foreach (var a in addresses)
            contact.Addresses.Add(a);
    }

    public async Task SaveChangesAsync() => await _db.SaveChangesAsync();

    // ── Groups ──

    public async Task<IEnumerable<ContactGroup>> GetGroupsAsync(int ownerUserId)
        => await _db.ContactGroups
            .Where(g => g.OwnerUserId == ownerUserId)
            .OrderBy(g => g.Name)
            .Include(g => g.Members)
            .ToListAsync();

    public async Task<int> AddGroupAsync(ContactGroup group)
    {
        _db.ContactGroups.Add(group);
        await _db.SaveChangesAsync();
        return group.Id;
    }

    public async Task<bool> UpdateGroupAsync(int groupId, int ownerUserId, Action<ContactGroup> update)
    {
        var group = await _db.ContactGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.OwnerUserId == ownerUserId);
        if (group == null) return false;
        update(group);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteGroupAsync(int groupId, int ownerUserId)
    {
        var group = await _db.ContactGroups.Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.OwnerUserId == ownerUserId);
        if (group == null) return false;
        _db.ContactGroupMembers.RemoveRange(group.Members);
        _db.ContactGroups.Remove(group);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> GroupExistsAsync(int groupId, int ownerUserId)
        => await _db.ContactGroups.AnyAsync(g => g.Id == groupId && g.OwnerUserId == ownerUserId);

    public async Task<IEnumerable<int>> GetGroupMemberIdsAsync(int groupId)
        => await _db.ContactGroupMembers.Where(m => m.GroupId == groupId).Select(m => m.ContactId).ToListAsync();

    public async Task<bool> ContactExistsAsync(int contactId, int ownerUserId)
        => await _db.Contacts.AnyAsync(c => c.Id == contactId && c.OwnerUserId == ownerUserId);

    public async Task AddGroupMemberAsync(int groupId, int contactId)
    {
        _db.ContactGroupMembers.Add(new ContactGroupMember { GroupId = groupId, ContactId = contactId });
        await _db.SaveChangesAsync();
    }

    public async Task<bool> RemoveGroupMemberAsync(int groupId, int contactId, int ownerUserId)
    {
        var member = await _db.ContactGroupMembers
            .Include(m => m.Group)
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ContactId == contactId && m.Group!.OwnerUserId == ownerUserId);
        if (member == null) return false;
        _db.ContactGroupMembers.Remove(member);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<(int UserId, string Username, string FullName, string? Email)>> SearchUsersAsync(string term, int take)
    {
        var t = term.ToLower();
        return await _db.Users
            .Where(u => u.UserName!.ToLower().Contains(t) || u.Email!.ToLower().Contains(t) || u.FullName.ToLower().Contains(t))
            .Take(take)
            .Select(u => new { u.Id, Username = u.UserName!, u.FullName, u.Email })
            .ToListAsync()
            .ContinueWith(r => r.Result.Select(u => (u.Id, u.Username, u.FullName, u.Email)));
    }
}
