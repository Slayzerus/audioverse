using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Podłącz vendora do eventu.</summary>
/// <summary>
/// Attach a vendor to an event.
/// </summary>
public record AddEventVendorCommand(int EventId, int VendorProfileId, VendorServiceCategory ServiceCategory, int? AcceptedOfferId, string? Notes) : IRequest<EventVendor>;
