using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to update inquiry status.</summary>
public record UpdateStatusRequest(VendorInquiryStatus Status);
