using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

/// <summary>Handlery CRUD pozycji cennika vendora.</summary>
public class PriceListItemHandlers(IVendorRepository repo)
    : IRequestHandler<AddPriceListItemCommand, VendorPriceListItem?>,
      IRequestHandler<UpdatePriceListItemCommand, VendorPriceListItem?>,
      IRequestHandler<DeletePriceListItemCommand, bool>
{
    public async Task<VendorPriceListItem?> Handle(AddPriceListItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;
        var item = new VendorPriceListItem
        {
            VendorProfileId = req.VendorProfileId,
            Name = req.Name, Description = req.Description, Category = req.Category,
            Price = req.Price, PriceFrom = req.PriceFrom, PriceTo = req.PriceTo,
            Currency = req.Currency ?? "PLN", PriceUnit = req.PriceUnit,
            MinQuantity = req.MinQuantity, ImageUrl = req.ImageUrl, SortOrder = req.SortOrder
        };
        return await repo.AddPriceListItemAsync(item);
    }

    public async Task<VendorPriceListItem?> Handle(UpdatePriceListItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;
        var item = await repo.GetPriceListItemByIdAsync(req.ItemId);
        if (item == null || item.VendorProfileId != req.VendorProfileId) return null;
        item.Name = req.Name; item.Description = req.Description; item.Category = req.Category;
        item.Price = req.Price; item.PriceFrom = req.PriceFrom; item.PriceTo = req.PriceTo;
        item.Currency = req.Currency ?? "PLN"; item.PriceUnit = req.PriceUnit;
        item.MinQuantity = req.MinQuantity; item.ImageUrl = req.ImageUrl;
        item.SortOrder = req.SortOrder; item.IsAvailable = req.IsAvailable;
        await repo.SaveChangesAsync(ct);
        return item;
    }

    public async Task<bool> Handle(DeletePriceListItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return false;
        var item = await repo.GetPriceListItemByIdAsync(req.ItemId);
        if (item == null || item.VendorProfileId != req.VendorProfileId) return false;
        await repo.RemovePriceListItemAsync(item);
        return true;
    }
}
