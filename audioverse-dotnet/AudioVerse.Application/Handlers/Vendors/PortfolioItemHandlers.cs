using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class PortfolioItemHandlers(IVendorRepository repo)
    : IRequestHandler<AddPortfolioItemCommand, VendorPortfolioItem?>,
      IRequestHandler<DeletePortfolioItemCommand, bool>
{
    public async Task<VendorPortfolioItem?> Handle(AddPortfolioItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;
        var item = new VendorPortfolioItem
        {
            VendorProfileId = req.VendorProfileId,
            Title = req.Title, Description = req.Description,
            ImageUrl = req.ImageUrl, MediaType = req.MediaType ?? "photo",
            SortOrder = req.SortOrder
        };
        return await repo.AddPortfolioItemAsync(item);
    }

    public async Task<bool> Handle(DeletePortfolioItemCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return false;
        var item = await repo.GetPortfolioItemByIdAsync(req.ItemId);
        if (item == null || item.VendorProfileId != req.VendorProfileId) return false;
        await repo.RemovePortfolioItemAsync(item);
        return true;
    }
}
