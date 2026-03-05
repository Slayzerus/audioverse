using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Remove an entity from a user's personal list.</summary>
public record RemoveFromListCommand(int EntryId, int PlayerId) : IRequest<bool>;
