using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to create an offer.</summary>
public record CreateOfferRequest(int? InquiryId, int? ClientUserId, int? EventId,
    string Title, string? Description, decimal TotalPrice, string? Currency, DateTime? ValidUntil,
    System.Collections.Generic.List<OfferItemRequestDto>? Items);
