using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Application.Queries.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Wishlists;

public class GiftRegistryHandlers(IWishlistRepository repo)
    : IRequestHandler<CreateGiftRegistryCommand, GiftRegistry>,
      IRequestHandler<UpdateGiftRegistryCommand, GiftRegistry?>,
      IRequestHandler<ToggleGiftRegistryCommand, (int Id, bool IsActive)?>,
      IRequestHandler<DeleteGiftRegistryCommand, bool>,
      IRequestHandler<AddGiftRegistryItemCommand, GiftRegistryItem?>,
      IRequestHandler<UpdateGiftRegistryItemCommand, GiftRegistryItem?>,
      IRequestHandler<DeleteGiftRegistryItemCommand, bool>,
      IRequestHandler<ContributeToGiftCommand, (int ContributionId, bool IsFullyReserved)?>,
      IRequestHandler<RemoveContributionCommand, bool>,
      IRequestHandler<GetMyGiftRegistriesQuery, IEnumerable<GiftRegistrySummaryDto>>,
      IRequestHandler<GetGiftRegistryByTokenQuery, GiftRegistryDetailDto?>
{
    public async Task<GiftRegistry> Handle(CreateGiftRegistryCommand req, CancellationToken ct)
    {
        var reg = new GiftRegistry { OwnerUserId = req.OwnerUserId, Name = req.Name, Description = req.Description, EventId = req.EventId };
        return await repo.AddGiftRegistryAsync(reg, ct);
    }

    public async Task<GiftRegistry?> Handle(UpdateGiftRegistryCommand req, CancellationToken ct)
    {
        var reg = await repo.GetGiftRegistryByIdAsync(req.RegistryId, ct);
        if (reg == null || reg.OwnerUserId != req.OwnerUserId) return null;
        reg.Name = req.Name; reg.Description = req.Description; reg.EventId = req.EventId;
        await repo.SaveChangesAsync(ct);
        return reg;
    }

    public async Task<(int Id, bool IsActive)?> Handle(ToggleGiftRegistryCommand req, CancellationToken ct)
    {
        var reg = await repo.GetGiftRegistryByIdAsync(req.RegistryId, ct);
        if (reg == null || reg.OwnerUserId != req.OwnerUserId) return null;
        reg.IsActive = !reg.IsActive;
        await repo.SaveChangesAsync(ct);
        return (reg.Id, reg.IsActive);
    }

    public async Task<bool> Handle(DeleteGiftRegistryCommand req, CancellationToken ct)
    {
        var reg = await repo.GetGiftRegistryWithItemsAsync(req.RegistryId, ct);
        if (reg == null || reg.OwnerUserId != req.OwnerUserId) return false;
        await repo.RemoveGiftRegistryAsync(reg, ct);
        return true;
    }

    public async Task<GiftRegistryItem?> Handle(AddGiftRegistryItemCommand req, CancellationToken ct)
    {
        var reg = await repo.GetGiftRegistryByIdAsync(req.RegistryId, ct);
        if (reg == null || reg.OwnerUserId != req.OwnerUserId) return null;
        var item = new GiftRegistryItem
        {
            GiftRegistryId = req.RegistryId, Name = req.Name, Description = req.Description,
            ImageUrl = req.ImageUrl, ExternalUrl = req.ExternalUrl,
            TargetAmount = req.TargetAmount, Currency = req.Currency,
            MaxContributors = req.MaxContributors, SortOrder = req.SortOrder
        };
        return await repo.AddGiftRegistryItemAsync(item, ct);
    }

    public async Task<GiftRegistryItem?> Handle(UpdateGiftRegistryItemCommand req, CancellationToken ct)
    {
        var item = await repo.GetGiftRegistryItemAsync(req.ItemId, req.RegistryId, ct);
        if (item == null || item.GiftRegistry?.OwnerUserId != req.OwnerUserId) return null;
        item.Name = req.Name; item.Description = req.Description; item.ImageUrl = req.ImageUrl;
        item.ExternalUrl = req.ExternalUrl; item.TargetAmount = req.TargetAmount;
        item.Currency = req.Currency; item.MaxContributors = req.MaxContributors; item.SortOrder = req.SortOrder;
        await repo.SaveChangesAsync(ct);
        return item;
    }

    public async Task<bool> Handle(DeleteGiftRegistryItemCommand req, CancellationToken ct)
    {
        var item = await repo.GetGiftRegistryItemAsync(req.ItemId, req.RegistryId, ct);
        if (item == null || item.GiftRegistry?.OwnerUserId != req.OwnerUserId) return false;
        await repo.RemoveGiftRegistryItemAsync(item, ct);
        return true;
    }

    public async Task<(int ContributionId, bool IsFullyReserved)?> Handle(ContributeToGiftCommand req, CancellationToken ct)
    {
        var item = await repo.GetGiftRegistryItemWithContributionsAsync(req.ItemId, ct);
        if (item == null || item.GiftRegistry?.IsActive != true) return null;
        if (item.IsFullyReserved) return null;
        if (item.MaxContributors.HasValue && item.Contributions.Count >= item.MaxContributors.Value)
        { item.IsFullyReserved = true; await repo.SaveChangesAsync(ct); return null; }

        var c = new GiftContribution
        {
            GiftRegistryItemId = req.ItemId, UserId = req.UserId,
            GuestName = req.GuestName, GuestEmail = req.GuestEmail,
            Amount = req.Amount, Message = req.Message, IsAnonymous = req.IsAnonymous, IsConfirmed = true
        };

        if (item.TargetAmount.HasValue)
        {
            var total = item.Contributions.Where(x => x.IsConfirmed).Sum(x => x.Amount ?? 0) + (req.Amount ?? 0);
            if (total >= item.TargetAmount.Value) item.IsFullyReserved = true;
        }
        if (item.MaxContributors.HasValue && item.Contributions.Count + 1 >= item.MaxContributors.Value)
            item.IsFullyReserved = true;

        await repo.AddContributionAsync(c, ct);
        return (c.Id, item.IsFullyReserved);
    }

    public async Task<bool> Handle(RemoveContributionCommand req, CancellationToken ct)
    {
        var c = await repo.GetContributionByIdAsync(req.ContributionId, ct);
        if (c == null) return false;
        if (c.UserId != req.UserId && !req.IsAdmin) return false;
        if (c.GiftRegistryItem != null) c.GiftRegistryItem.IsFullyReserved = false;
        await repo.RemoveContributionAsync(c, ct);
        return true;
    }

    public async Task<IEnumerable<GiftRegistrySummaryDto>> Handle(GetMyGiftRegistriesQuery req, CancellationToken ct)
    {
        var registries = await repo.GetGiftRegistriesByUserAsync(req.UserId, ct);
        return registries.Select(g => new GiftRegistrySummaryDto(g.Id, g.Name, g.Description, g.EventId, g.ShareToken, g.IsActive, g.Items.Count));
    }

    public async Task<GiftRegistryDetailDto?> Handle(GetGiftRegistryByTokenQuery req, CancellationToken ct)
    {
        var reg = await repo.GetGiftRegistryByTokenAsync(req.Token, ct);
        if (reg == null) return null;

        var items = reg.Items.Select(i => new GiftRegistryItemDto(
            i.Id, i.Name, i.Description, i.ImageUrl, i.ExternalUrl,
            i.TargetAmount, i.Currency, i.MaxContributors, i.IsFullyReserved,
            i.Contributions.Count,
            i.Contributions.Where(c => c.IsConfirmed).Sum(c => c.Amount ?? 0),
            i.Contributions.Where(c => !c.IsAnonymous).Select(c => new GiftContributorDto(c.Id, c.GuestName ?? "Użytkownik", c.Amount, c.Message, c.IsConfirmed))));

        return new GiftRegistryDetailDto(reg.Id, reg.Name, reg.Description, reg.EventId, items);
    }
}
