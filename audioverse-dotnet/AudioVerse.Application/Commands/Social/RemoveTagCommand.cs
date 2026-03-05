using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Remove a tag.</summary>
public record RemoveTagCommand(int TagId, int PlayerId) : IRequest<bool>;
