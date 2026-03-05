using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Create a gift registry.</summary>
public record CreateGiftRegistryCommand(int OwnerUserId, string Name, string? Description, int? EventId) : IRequest<GiftRegistry>;
