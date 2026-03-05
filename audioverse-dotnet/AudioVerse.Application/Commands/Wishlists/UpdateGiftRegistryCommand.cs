using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Update a gift registry.</summary>
public record UpdateGiftRegistryCommand(int RegistryId, int OwnerUserId, string Name, string? Description, int? EventId) : IRequest<GiftRegistry?>;
