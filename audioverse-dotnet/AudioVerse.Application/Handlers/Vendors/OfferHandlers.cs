using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class OfferHandlers(IVendorRepository repo)
    : IRequestHandler<CreateVendorOfferCommand, VendorOffer?>,
      IRequestHandler<SendVendorOfferCommand, bool>,
      IRequestHandler<RespondToOfferCommand, bool>
{
    public async Task<VendorOffer?> Handle(CreateVendorOfferCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;

        var offer = new VendorOffer
        {
            VendorProfileId = req.VendorProfileId,
            InquiryId = req.InquiryId, ClientUserId = req.ClientUserId, EventId = req.EventId,
            Title = req.Title, Description = req.Description,
            TotalPrice = req.TotalPrice, Currency = req.Currency ?? "PLN",
            ValidUntil = req.ValidUntil, Status = VendorOfferStatus.Draft
        };
        if (req.Items != null)
        {
            foreach (var li in req.Items)
            {
                offer.Items.Add(new VendorOfferItem
                {
                    Name = li.Name, Description = li.Description,
                    PriceListItemId = li.PriceListItemId, MenuItemId = li.MenuItemId,
                    Quantity = li.Quantity, UnitPrice = li.UnitPrice,
                    TotalPrice = li.UnitPrice * li.Quantity,
                    Notes = li.Notes, SortOrder = li.SortOrder
                });
            }
        }
        return await repo.CreateOfferAsync(offer);
    }

    public async Task<bool> Handle(SendVendorOfferCommand req, CancellationToken ct)
    {
        var offer = await repo.GetOfferByIdAsync(req.OfferId);
        if (offer == null) return false;
        if (!await repo.IsVendorOwnerAsync(offer.VendorProfileId, req.OwnerUserId, ct)) return false;
        offer.Status = VendorOfferStatus.Sent;
        offer.UpdatedAtUtc = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> Handle(RespondToOfferCommand req, CancellationToken ct)
    {
        var offer = await repo.GetOfferByIdAsync(req.OfferId);
        if (offer == null || offer.ClientUserId != req.ClientUserId) return false;
        offer.Status = req.Accept ? VendorOfferStatus.Accepted : VendorOfferStatus.Declined;
        offer.UpdatedAtUtc = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return true;
    }
}
