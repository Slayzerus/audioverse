using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class UpdateVendorProfileHandler(IVendorRepository repo) : IRequestHandler<UpdateVendorProfileCommand, VendorProfile?>
{
    public async Task<VendorProfile?> Handle(UpdateVendorProfileCommand req, CancellationToken ct)
    {
        var v = await repo.GetProfileByIdAsync(req.VendorProfileId);
        if (v == null) return null;
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return null;

        v.Slug = req.Slug; v.ShortDescription = req.ShortDescription; v.FullDescription = req.FullDescription;
        v.PrimaryCategory = req.PrimaryCategory; v.AdditionalCategories = req.AdditionalCategories;
        v.Phone = req.Phone; v.Email = req.Email; v.Website = req.Website; v.CoverImageUrl = req.CoverImageUrl;
        v.City = req.City; v.Region = req.Region; v.CountryCode = req.CountryCode;
        v.Latitude = req.Latitude; v.Longitude = req.Longitude; v.ServiceRadiusKm = req.ServiceRadiusKm;
        v.UpdatedAt = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return v;
    }
}
