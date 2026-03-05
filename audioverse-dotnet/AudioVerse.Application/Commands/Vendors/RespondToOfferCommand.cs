using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Klient akceptuje lub odrzuca ofertę vendora.</summary>
/// <summary>
/// Client responds to a vendor offer (accept/reject).
/// </summary>
public record RespondToOfferCommand(int OfferId, int ClientUserId, bool Accept) : IRequest<bool>;
