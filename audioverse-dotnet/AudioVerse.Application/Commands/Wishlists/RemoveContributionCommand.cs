using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Cofnij wkład.</summary>
public record RemoveContributionCommand(int ContributionId, int? UserId, bool IsAdmin) : IRequest<bool>;
