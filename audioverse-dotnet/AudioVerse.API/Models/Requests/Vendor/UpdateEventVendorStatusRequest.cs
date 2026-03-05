using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to update event-vendor status.</summary>
public record UpdateEventVendorStatusRequest(EventVendorStatus Status, int? AcceptedOfferId = null);
