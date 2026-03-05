using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

/// <summary>Tworzy profil vendora dla organizacji w marketplace.</summary>
public class CreateVendorProfileHandler(IVendorRepository repo) : IRequestHandler<CreateVendorProfileCommand, VendorProfile>
{
    public async Task<VendorProfile> Handle(CreateVendorProfileCommand req, CancellationToken ct)
    {
        var org = await repo.GetOrganizationByIdAsync(req.OrganizationId, ct)
            ?? throw new InvalidOperationException("Organization not found");
        if (org.OwnerId != req.OwnerUserId)
            throw new UnauthorizedAccessException("Not organization owner");
        if (await repo.ProfileExistsForOrganizationAsync(req.OrganizationId))
            throw new InvalidOperationException("Vendor profile already exists for this organization");

        var profile = new VendorProfile
        {
            OrganizationId = req.OrganizationId,
            Slug = req.Slug,
            ShortDescription = req.ShortDescription,
            FullDescription = req.FullDescription,
            PrimaryCategory = req.PrimaryCategory,
            AdditionalCategories = req.AdditionalCategories,
            Phone = req.Phone, Email = req.Email, Website = req.Website,
            CoverImageUrl = req.CoverImageUrl,
            City = req.City, Region = req.Region, CountryCode = req.CountryCode,
            Latitude = req.Latitude, Longitude = req.Longitude,
            ServiceRadiusKm = req.ServiceRadiusKm
        };
        return await repo.CreateProfileAsync(profile);
    }
}
