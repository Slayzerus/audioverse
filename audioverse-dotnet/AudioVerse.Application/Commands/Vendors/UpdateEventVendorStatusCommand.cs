using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Zmień status event-vendora (potwierdź/odrzuć) + zaakceptuj ofertę.</summary>
/// <summary>
/// Update the status of a vendor's association with an event.
/// </summary>
public record UpdateEventVendorStatusCommand(int EventVendorId, EventVendorStatus Status, int? AcceptedOfferId) : IRequest<bool>;
