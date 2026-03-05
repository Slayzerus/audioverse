using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Delete a gift registry (cascading).</summary>
public record DeleteGiftRegistryCommand(int RegistryId, int OwnerUserId) : IRequest<bool>;
