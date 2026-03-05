using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to submit a vendor inquiry.</summary>
public record InquiryRequest(string ContactName, string ContactEmail, string? ContactPhone,
    int? EventId, DateTime? EventDate, int? GuestCount, string Message, decimal? Budget, string? Currency);
