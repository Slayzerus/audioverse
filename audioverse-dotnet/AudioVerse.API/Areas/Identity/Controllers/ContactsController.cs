using AudioVerse.Domain.Entities.Contacts;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>
/// Książka adresowa — kontakty, grupy, import.
/// Każdy użytkownik ma własną książkę adresową.
/// </summary>
[ApiController]
[Route("api/contacts")]
[Produces("application/json")]
[Authorize]
[Tags("Contacts")]
public class ContactsController : ControllerBase
{
    private readonly IContactRepository _repo;

    public ContactsController(IContactRepository repo)
    {
        _repo = repo;
    }

    private int GetUserId() => int.Parse(User.FindFirst("id")!.Value);

    // ═══════════════════════════════════════════════════
    //  CONTACTS — CRUD
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Lista kontaktów użytkownika. Opcjonalnie filtruj po grupie, organizacji, ulubione, search.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ContactListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContacts(
        [FromQuery] int? groupId = null,
        [FromQuery] int? organizationId = null,
        [FromQuery] bool? favorites = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        var (items, total) = await _repo.GetContactsPagedAsync(userId, groupId, organizationId, favorites, search, page, pageSize);

        var contacts = items.Select(c => new ContactListDto
        {
            Id = c.Id,
            DisplayName = c.DisplayName,
            DisplayNamePrivate = c.DisplayNamePrivate,
            FirstName = c.FirstName,
            LastName = c.LastName,
            Company = c.Company,
            AvatarUrl = c.AvatarUrl,
            IsFavorite = c.IsFavorite,
            IsOrganization = c.IsOrganization,
            LinkedUserId = c.LinkedUserId,
            OrganizationId = c.OrganizationId,
            PrimaryEmail = c.Emails.Where(e => e.IsPrimary).Select(e => e.Email).FirstOrDefault()
                ?? c.Emails.Select(e => e.Email).FirstOrDefault(),
            PrimaryPhone = c.Phones.Where(p => p.IsPrimary).Select(p => p.PhoneNumber).FirstOrDefault()
                ?? c.Phones.Select(p => p.PhoneNumber).FirstOrDefault(),
            ImportSource = c.ImportSource
        }).ToList();

        return Ok(new { Total = total, Page = page, PageSize = pageSize, Items = contacts });
    }

    /// <summary>
    /// Szczegóły kontaktu — z e-mailami, telefonami, adresami i grupami.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ContactDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetContact(int id)
    {
        var contact = await _repo.GetContactWithDetailsAsync(id, GetUserId());
        if (contact == null) return NotFound();
        return Ok(MapToDetail(contact));
    }

    /// <summary>
    /// Utwórz kontakt z e-mailami, telefonami i adresami w jednym żądaniu.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ContactDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateContact([FromBody] ContactCreateRequest request)
    {
        var userId = GetUserId();
        var contact = new Contact
        {
            OwnerUserId = userId,
            FirstName = request.FirstName?.Trim() ?? string.Empty,
            LastName = request.LastName?.Trim() ?? string.Empty,
            DisplayName = !string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.DisplayName.Trim()
                : $"{request.FirstName} {request.LastName}".Trim(),
            DisplayNamePrivate = request.DisplayNamePrivate?.Trim() ?? string.Empty,
            Nickname = request.Nickname,
            Company = request.Company,
            JobTitle = request.JobTitle,
            Notes = request.Notes,
            AvatarUrl = request.AvatarUrl,
            IsOrganization = request.IsOrganization,
            OrganizationId = request.OrganizationId,
            LinkedUserId = request.LinkedUserId,
            IsFavorite = request.IsFavorite,
            ImportSource = request.ImportSource ?? ContactImportSource.Manual
        };

        if (request.Emails != null)
            foreach (var e in request.Emails)
                contact.Emails.Add(new ContactEmail { Email = e.Email, Type = e.Type, IsPrimary = e.IsPrimary });

        if (request.Phones != null)
            foreach (var p in request.Phones)
                contact.Phones.Add(new ContactPhone { PhoneNumber = p.PhoneNumber, Type = p.Type, IsPrimary = p.IsPrimary });

        if (request.Addresses != null)
            foreach (var a in request.Addresses)
                contact.Addresses.Add(new ContactAddress
                {
                    Type = a.Type, Label = a.Label, Street = a.Street, Street2 = a.Street2,
                    City = a.City, State = a.State, PostalCode = a.PostalCode, Country = a.Country, IsPrimary = a.IsPrimary
                });

        await _repo.AddContactAsync(contact);

        if (request.GroupIds != null)
        {
            foreach (var gid in request.GroupIds)
            {
                if (await _repo.GroupExistsAsync(gid, userId))
                    await _repo.AddGroupMemberAsync(gid, contact.Id);
            }
        }

        var full = await _repo.GetContactWithDetailsAsync(contact.Id, userId);
        return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, MapToDetail(full!));
    }

    /// <summary>
    /// Aktualizuj kontakt — pola bazowe + upsert e-maili, telefonów, adresów.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ContactDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateContact(int id, [FromBody] ContactUpdateRequest request)
    {
        var userId = GetUserId();
        var contact = await _repo.GetContactWithDetailsAsync(id, userId);
        if (contact == null) return NotFound();

        if (request.FirstName != null) contact.FirstName = request.FirstName.Trim();
        if (request.LastName != null) contact.LastName = request.LastName.Trim();
        if (request.DisplayName != null) contact.DisplayName = request.DisplayName.Trim();
        if (request.DisplayNamePrivate != null) contact.DisplayNamePrivate = request.DisplayNamePrivate.Trim();
        if (request.Nickname != null) contact.Nickname = request.Nickname;
        if (request.Company != null) contact.Company = request.Company;
        if (request.JobTitle != null) contact.JobTitle = request.JobTitle;
        if (request.Notes != null) contact.Notes = request.Notes;
        if (request.AvatarUrl != null) contact.AvatarUrl = request.AvatarUrl;
        if (request.IsOrganization.HasValue) contact.IsOrganization = request.IsOrganization.Value;
        if (request.OrganizationId.HasValue) contact.OrganizationId = request.OrganizationId.Value == 0 ? null : request.OrganizationId;
        if (request.LinkedUserId.HasValue) contact.LinkedUserId = request.LinkedUserId.Value == 0 ? null : request.LinkedUserId;
        if (request.IsFavorite.HasValue) contact.IsFavorite = request.IsFavorite.Value;

        if (request.Emails != null)
            await _repo.ReplaceEmailsAsync(contact,
                request.Emails.Select(e => new ContactEmail { Email = e.Email, Type = e.Type, IsPrimary = e.IsPrimary }));

        if (request.Phones != null)
            await _repo.ReplacePhonesAsync(contact,
                request.Phones.Select(p => new ContactPhone { PhoneNumber = p.PhoneNumber, Type = p.Type, IsPrimary = p.IsPrimary }));

        if (request.Addresses != null)
            await _repo.ReplaceAddressesAsync(contact,
                request.Addresses.Select(a => new ContactAddress
                {
                    Type = a.Type, Label = a.Label, Street = a.Street, Street2 = a.Street2,
                    City = a.City, State = a.State, PostalCode = a.PostalCode, Country = a.Country, IsPrimary = a.IsPrimary
                }));

        await _repo.UpdateContactAsync(contact);
        return Ok(MapToDetail(contact));
    }

    /// <summary>Usuń kontakt.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteContact(int id)
        => await _repo.DeleteContactAsync(id, GetUserId()) ? NoContent() : NotFound();

    /// <summary>Przełącz ulubiony status kontaktu.</summary>
    [HttpPost("{id:int}/toggle-favorite")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        if (!await _repo.ToggleFavoriteAsync(id, GetUserId())) return NotFound();
        var contact = await _repo.GetContactWithDetailsAsync(id, GetUserId());
        return Ok(new { contact!.Id, contact.IsFavorite });
    }

    // ═══════════════════════════════════════════════════
    //  GROUPS
    // ═══════════════════════════════════════════════════

    /// <summary>Lista grup kontaktów użytkownika z liczbą członków.</summary>
    [HttpGet("groups")]
    [ProducesResponseType(typeof(List<ContactGroupListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGroups()
    {
        var groups = await _repo.GetGroupsAsync(GetUserId());
        return Ok(groups.Select(g => new ContactGroupListDto
        {
            Id = g.Id,
            Name = g.Name,
            Description = g.Description,
            Color = g.Color,
            Icon = g.Icon,
            OrganizationId = g.OrganizationId,
            MemberCount = g.Members.Count
        }));
    }

    /// <summary>Utwórz grupę kontaktów.</summary>
    [HttpPost("groups")]
    [ProducesResponseType(typeof(ContactGroupListDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateGroup([FromBody] ContactGroupCreateRequest request)
    {
        var group = new ContactGroup
        {
            OwnerUserId = GetUserId(),
            Name = request.Name.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            OrganizationId = request.OrganizationId
        };

        await _repo.AddGroupAsync(group);

        return CreatedAtAction(nameof(GetGroups), null, new ContactGroupListDto
        {
            Id = group.Id, Name = group.Name, Description = group.Description,
            Color = group.Color, Icon = group.Icon, OrganizationId = group.OrganizationId, MemberCount = 0
        });
    }

    /// <summary>Aktualizuj grupę kontaktów.</summary>
    [HttpPut("groups/{groupId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateGroup(int groupId, [FromBody] ContactGroupCreateRequest request)
    {
        var result = await _repo.UpdateGroupAsync(groupId, GetUserId(), g =>
        {
            g.Name = request.Name.Trim();
            g.Description = request.Description;
            g.Color = request.Color;
            g.Icon = request.Icon;
            g.OrganizationId = request.OrganizationId;
        });
        return result ? Ok(new { Success = true }) : NotFound();
    }

    /// <summary>Usuń grupę (kontakty nie są usuwane — tylko powiązania).</summary>
    [HttpDelete("groups/{groupId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteGroup(int groupId)
        => await _repo.DeleteGroupAsync(groupId, GetUserId()) ? NoContent() : NotFound();

    /// <summary>Dodaj kontakty do grupy (batch).</summary>
    [HttpPost("groups/{groupId:int}/members")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AddToGroup(int groupId, [FromBody] GroupMembersRequest request)
    {
        var userId = GetUserId();
        if (!await _repo.GroupExistsAsync(groupId, userId)) return NotFound();

        var existingIds = (await _repo.GetGroupMemberIdsAsync(groupId)).ToHashSet();
        var added = 0;

        foreach (var contactId in request.ContactIds)
        {
            if (existingIds.Contains(contactId)) continue;
            if (!await _repo.ContactExistsAsync(contactId, userId)) continue;
            await _repo.AddGroupMemberAsync(groupId, contactId);
            added++;
        }

        return Ok(new { Added = added });
    }

    /// <summary>Usuń kontakt z grupy.</summary>
    [HttpDelete("groups/{groupId:int}/members/{contactId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFromGroup(int groupId, int contactId)
        => await _repo.RemoveGroupMemberAsync(groupId, contactId, GetUserId()) ? NoContent() : NotFound();

    // ═══════════════════════════════════════════════════
    //  IMPORT
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Batch import kontaktów (z CSV, vCard, Google, urządzenia mobilnego itd.).
    /// Deduplikacja po ExternalId.
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportContacts([FromBody] ContactImportRequest request)
    {
        var userId = GetUserId();
        var imported = 0;
        var skipped = 0;
        var updated = 0;
        var newContactIds = new List<int>();

        foreach (var item in request.Contacts)
        {
            Contact? existing = null;
            if (!string.IsNullOrWhiteSpace(item.ExternalId))
                existing = await _repo.FindByExternalIdAsync(userId, item.ExternalId);

            if (existing != null)
            {
                existing.FirstName = item.FirstName ?? existing.FirstName;
                existing.LastName = item.LastName ?? existing.LastName;
                existing.DisplayName = item.DisplayName ?? existing.DisplayName;
                existing.Company = item.Company ?? existing.Company;
                existing.JobTitle = item.JobTitle ?? existing.JobTitle;
                existing.AvatarUrl = item.AvatarUrl ?? existing.AvatarUrl;
                existing.UpdatedAt = DateTime.UtcNow;

                if (item.Emails != null && item.Emails.Count > 0)
                    await _repo.ReplaceEmailsAsync(existing,
                        item.Emails.Select(e => new ContactEmail { Email = e.Email, Type = e.Type, IsPrimary = e.IsPrimary }));
                if (item.Phones != null && item.Phones.Count > 0)
                    await _repo.ReplacePhonesAsync(existing,
                        item.Phones.Select(p => new ContactPhone { PhoneNumber = p.PhoneNumber, Type = p.Type, IsPrimary = p.IsPrimary }));
                updated++;
                continue;
            }

            var contact = new Contact
            {
                OwnerUserId = userId,
                FirstName = item.FirstName?.Trim() ?? string.Empty,
                LastName = item.LastName?.Trim() ?? string.Empty,
                DisplayName = !string.IsNullOrWhiteSpace(item.DisplayName)
                    ? item.DisplayName.Trim()
                    : $"{item.FirstName} {item.LastName}".Trim(),
                Company = item.Company,
                JobTitle = item.JobTitle,
                AvatarUrl = item.AvatarUrl,
                ImportSource = request.Source,
                ExternalId = item.ExternalId,
                IsOrganization = item.IsOrganization
            };

            if (item.Emails != null)
                foreach (var e in item.Emails)
                    contact.Emails.Add(new ContactEmail { Email = e.Email, Type = e.Type, IsPrimary = e.IsPrimary });
            if (item.Phones != null)
                foreach (var p in item.Phones)
                    contact.Phones.Add(new ContactPhone { PhoneNumber = p.PhoneNumber, Type = p.Type, IsPrimary = p.IsPrimary });
            if (item.Addresses != null)
                foreach (var a in item.Addresses)
                    contact.Addresses.Add(new ContactAddress
                    {
                        Type = a.Type, Label = a.Label, Street = a.Street, Street2 = a.Street2,
                        City = a.City, State = a.State, PostalCode = a.PostalCode, Country = a.Country, IsPrimary = a.IsPrimary
                    });

            var cid = await _repo.AddContactAsync(contact);
            newContactIds.Add(cid);
            imported++;
        }

        await _repo.SaveChangesAsync();

        if (request.GroupId.HasValue && await _repo.GroupExistsAsync(request.GroupId.Value, userId))
        {
            var existingMembers = (await _repo.GetGroupMemberIdsAsync(request.GroupId.Value)).ToHashSet();
            foreach (var cid in newContactIds.Where(id => !existingMembers.Contains(id)))
                await _repo.AddGroupMemberAsync(request.GroupId.Value, cid);
        }

        return Ok(new { Imported = imported, Updated = updated, Skipped = skipped, Total = request.Contacts.Count });
    }

    /// <summary>
    /// Wyszukaj użytkowników systemu po nazwie/email — do linkowania kontaktu z użytkownikiem.
    /// </summary>
    [HttpGet("search-users")]
    [ProducesResponseType(typeof(List<ContactUserSuggestionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsersForLinking([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2) return Ok(Array.Empty<object>());

        var users = await _repo.SearchUsersAsync(q, 10);
        return Ok(users.Select(u => new ContactUserSuggestionDto
        {
            UserId = u.UserId,
            Username = u.Username,
            FullName = u.FullName,
            Email = u.Email
        }));
    }

    // ═══════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════

    private static ContactDetailDto MapToDetail(Contact c) => new()
    {
        Id = c.Id,
        FirstName = c.FirstName,
        LastName = c.LastName,
        DisplayName = c.DisplayName,
        DisplayNamePrivate = c.DisplayNamePrivate,
        Nickname = c.Nickname,
        Company = c.Company,
        JobTitle = c.JobTitle,
        Notes = c.Notes,
        AvatarUrl = c.AvatarUrl,
        IsOrganization = c.IsOrganization,
        IsFavorite = c.IsFavorite,
        LinkedUserId = c.LinkedUserId,
        OrganizationId = c.OrganizationId,
        ImportSource = c.ImportSource,
        ExternalId = c.ExternalId,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        Emails = c.Emails.Select(e => new ContactEmailDto { Id = e.Id, Email = e.Email, Type = e.Type, IsPrimary = e.IsPrimary }).ToList(),
        Phones = c.Phones.Select(p => new ContactPhoneDto { Id = p.Id, PhoneNumber = p.PhoneNumber, Type = p.Type, IsPrimary = p.IsPrimary }).ToList(),
        Addresses = c.Addresses.Select(a => new ContactAddressDto
        {
            Id = a.Id, Type = a.Type, Label = a.Label, Street = a.Street, Street2 = a.Street2,
            City = a.City, State = a.State, PostalCode = a.PostalCode, Country = a.Country, IsPrimary = a.IsPrimary
        }).ToList(),
        Groups = c.GroupMemberships?.Select(m => new ContactGroupRefDto { GroupId = m.GroupId, GroupName = m.Group?.Name ?? string.Empty }).ToList() ?? []
    };
}

// ═══════════════════════════════════════════════════
//  DTOs — osobne klasy (1 per plik wg copilot-instructions,
//         ale compile-time file-scoped w jednym pliku kontrolera)
// ═══════════════════════════════════════════════════
// NOTE: Klasy poniżej są internal/file-scoped dla uproszczenia.
//       Mogą być przeniesione do osobnych plików jeśli potrzebne.
