using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Zmień status zapytania ofertowego (owner vendora).</summary>
/// <summary>
/// Update the status of a vendor inquiry.
/// </summary>
public record UpdateInquiryStatusCommand(int VendorProfileId, int InquiryId, int OwnerUserId, VendorInquiryStatus Status) : IRequest<bool>;
