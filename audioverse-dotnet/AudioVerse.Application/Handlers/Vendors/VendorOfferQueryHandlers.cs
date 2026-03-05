using AudioVerse.Application.Queries.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class VendorOfferQueryHandlers(IVendorRepository repo)
    : IRequestHandler<GetVendorInquiriesQuery, IEnumerable<VendorInquiry>>,
      IRequestHandler<GetVendorOfferQuery, VendorOffer?>,
      IRequestHandler<GetVendorOffersQuery, IEnumerable<VendorOfferListDto>>,
      IRequestHandler<GetMyOffersQuery, IEnumerable<VendorOfferListDto>>,
      IRequestHandler<GetEventVendorsQuery, IEnumerable<EventVendorDto>>
{
    public async Task<IEnumerable<VendorInquiry>> Handle(GetVendorInquiriesQuery req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return [];
        return await repo.GetInquiriesByVendorAsync(req.VendorProfileId, req.Status, ct);
    }

    public async Task<VendorOffer?> Handle(GetVendorOfferQuery req, CancellationToken ct)
    {
        var offer = await repo.GetOfferWithItemsAsync(req.OfferId, ct);
        if (offer == null) return null;
        var isOwner = await repo.IsVendorOwnerAsync(offer.VendorProfileId, req.UserId, ct);
        if (!isOwner && offer.ClientUserId != req.UserId) return null;
        if (offer.Status == VendorOfferStatus.Sent && offer.ClientUserId == req.UserId)
        {
            offer.Status = VendorOfferStatus.Viewed;
            await repo.SaveChangesAsync(ct);
        }
        return offer;
    }

    public async Task<IEnumerable<VendorOfferListDto>> Handle(GetVendorOffersQuery req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return [];
        var offers = await repo.GetOffersByVendorAsync(req.VendorProfileId);
        return offers.Select(o => new VendorOfferListDto(o.Id, o.Title, o.TotalPrice, o.Currency, o.Status.ToString(), o.ClientUserId, o.EventId, o.ValidUntil, o.CreatedAtUtc));
    }

    public async Task<IEnumerable<VendorOfferListDto>> Handle(GetMyOffersQuery req, CancellationToken ct)
    {
        var offers = await repo.GetOffersByClientUserIdAsync(req.UserId, ct);
        return offers.Select(o => new VendorOfferListDto(o.Id, o.Title, o.TotalPrice, o.Currency, o.Status.ToString(), o.ClientUserId, o.EventId, o.ValidUntil, o.CreatedAtUtc));
    }

    public async Task<IEnumerable<EventVendorDto>> Handle(GetEventVendorsQuery req, CancellationToken ct)
    {
        var vendorsWithProfiles = await repo.GetEventVendorsWithProfilesAsync(req.EventId, ct);
        var orgIds = vendorsWithProfiles.Where(x => x.Profile != null).Select(x => x.Profile!.OrganizationId).Distinct().ToList();
        var orgNames = await repo.GetOrganizationNamesByIdsAsync(orgIds, ct);

        return vendorsWithProfiles.Select(x =>
        {
            var p = x.Profile;
            var orgName = p != null && orgNames.TryGetValue(p.OrganizationId, out var n) ? n : "";
            return new EventVendorDto(
                x.Ev.Id, x.Ev.EventId, x.Ev.VendorProfileId, orgName,
                x.Ev.ServiceCategory.ToString(), x.Ev.Status.ToString(), x.Ev.AcceptedOfferId, x.Ev.Notes,
                p?.Slug, p?.City, p?.AverageRating ?? 0, p?.IsVerified ?? false);
        });
    }
}
