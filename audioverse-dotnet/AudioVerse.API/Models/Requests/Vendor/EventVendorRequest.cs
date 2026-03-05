using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to assign a vendor to an event.</summary>
public record EventVendorRequest(int EventId, int VendorProfileId, VendorServiceCategory ServiceCategory,
    int? AcceptedOfferId = null, string? Notes = null);
