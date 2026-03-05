using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Dodaj recenzję vendora.</summary>
/// <summary>
/// Add a review for a vendor.
/// </summary>
public record AddVendorReviewCommand(int VendorProfileId, int UserId, int Rating, string? Comment, int? EventId) : IRequest<int>;
