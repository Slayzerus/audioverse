using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Utwórz ofertę dla klienta (owner vendora).</summary>
/// <summary>
/// Create a vendor offer for a client (with line items).
/// </summary>
public record CreateVendorOfferCommand(
    int VendorProfileId, int OwnerUserId,
    int? InquiryId, int? ClientUserId, int? EventId,
    string Title, string? Description, decimal TotalPrice, string? Currency, DateTime? ValidUntil,
    List<OfferItemInput>? Items)
    : IRequest<VendorOffer?>;
