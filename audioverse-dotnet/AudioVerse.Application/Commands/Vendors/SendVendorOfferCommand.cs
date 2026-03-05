using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Wyślij ofertę do klienta (zmiana statusu na Sent).</summary>
/// <summary>
/// Send a vendor offer to the client.
/// </summary>
public record SendVendorOfferCommand(int OfferId, int OwnerUserId) : IRequest<bool>;
