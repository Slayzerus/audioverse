using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Dołóż się do prezentu.</summary>
public record ContributeToGiftCommand(int ItemId, int? UserId, string? GuestName, string? GuestEmail,
    decimal? Amount, string? Message, bool IsAnonymous)
    : IRequest<(int ContributionId, bool IsFullyReserved)?>;
