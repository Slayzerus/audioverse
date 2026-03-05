using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Delete a gift registry item.</summary>
public record DeleteGiftRegistryItemCommand(int RegistryId, int ItemId, int OwnerUserId) : IRequest<bool>;
