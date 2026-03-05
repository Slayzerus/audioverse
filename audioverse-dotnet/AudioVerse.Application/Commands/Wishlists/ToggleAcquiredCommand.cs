using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Toggle acquired/purchased status.</summary>
public record ToggleAcquiredCommand(int WishlistId, int ItemId, int OwnerUserId) : IRequest<(int Id, bool IsAcquired)?>;
