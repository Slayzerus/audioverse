using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Wyślij zapytanie ofertowe do vendora.</summary>
/// <summary>
/// Send an inquiry to a vendor.
/// </summary>
public record SendVendorInquiryCommand(
    int VendorProfileId, int? UserId,
    string ContactName, string ContactEmail, string? ContactPhone,
    int? EventId, DateTime? EventDate, int? GuestCount,
    string Message, decimal? Budget, string? Currency)
    : IRequest<VendorInquiry>;
