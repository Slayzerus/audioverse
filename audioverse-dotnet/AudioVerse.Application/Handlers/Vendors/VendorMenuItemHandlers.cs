using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class VendorMenuItemHandlers(IVendorRepository repo)
    : IRequestHandler<AddVendorMenuItemCommand, VendorMenuItem?>,
      IRequestHandler<UpdateVendorMenuItemCommand, VendorMenuItem?>,
      IRequestHandler<DeleteVendorMenuItemCommand, bool>
{
    public async Task<VendorMenuItem?> Handle(AddVendorMenuItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;
        var item = new VendorMenuItem
        {
            VendorProfileId = req.VendorProfileId,
            Name = req.Name, Description = req.Description, Category = req.Category ?? "main",
            Price = req.Price, Currency = req.Currency ?? "PLN", ImageUrl = req.ImageUrl,
            Allergens = req.Allergens,
            IsVegetarian = req.IsVegetarian, IsVegan = req.IsVegan, IsGlutenFree = req.IsGlutenFree,
            SortOrder = req.SortOrder
        };
        return await repo.AddMenuItemAsync(item);
    }

    public async Task<VendorMenuItem?> Handle(UpdateVendorMenuItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;
        var item = await repo.GetMenuItemByIdAsync(req.ItemId);
        if (item == null || item.VendorProfileId != req.VendorProfileId) return null;
        item.Name = req.Name; item.Description = req.Description; item.Category = req.Category ?? "main";
        item.Price = req.Price; item.Currency = req.Currency ?? "PLN"; item.ImageUrl = req.ImageUrl;
        item.Allergens = req.Allergens;
        item.IsVegetarian = req.IsVegetarian; item.IsVegan = req.IsVegan; item.IsGlutenFree = req.IsGlutenFree;
        item.IsAvailable = req.IsAvailable; item.SortOrder = req.SortOrder;
        await repo.SaveChangesAsync(ct);
        return item;
    }

    public async Task<bool> Handle(DeleteVendorMenuItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return false;
        var item = await repo.GetMenuItemByIdAsync(req.ItemId);
        if (item == null || item.VendorProfileId != req.VendorProfileId) return false;
        await repo.RemoveMenuItemAsync(item);
        return true;
    }
}
