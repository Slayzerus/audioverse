using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Toggle a gift registry active/inactive.</summary>
public record ToggleGiftRegistryCommand(int RegistryId, int OwnerUserId) : IRequest<(int Id, bool IsActive)?>;
