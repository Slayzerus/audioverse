using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Application.Queries.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Wishlists;

public class WishlistHandlers(IWishlistRepository repo)
    : IRequestHandler<CreateWishlistCommand, Wishlist>,
      IRequestHandler<UpdateWishlistCommand, Wishlist?>,
      IRequestHandler<DeleteWishlistCommand, bool>,
      IRequestHandler<GetMyWishlistsQuery, IEnumerable<WishlistSummaryDto>>,
      IRequestHandler<GetWishlistQuery, Wishlist?>,
      IRequestHandler<GetWishlistByTokenQuery, Wishlist?>
{
    public async Task<Wishlist> Handle(CreateWishlistCommand req, CancellationToken ct)
    {
        var wishlist = new Wishlist { OwnerUserId = req.OwnerUserId, Name = req.Name, Description = req.Description, IsPublic = req.IsPublic };
        return await repo.AddWishlistAsync(wishlist, ct);
    }

    public async Task<Wishlist?> Handle(UpdateWishlistCommand req, CancellationToken ct)
    {
        var w = await repo.GetWishlistByIdAsync(req.WishlistId, ct);
        if (w == null || w.OwnerUserId != req.OwnerUserId) return null;
        w.Name = req.Name; w.Description = req.Description; w.IsPublic = req.IsPublic;
        w.UpdatedAt = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return w;
    }

    public async Task<bool> Handle(DeleteWishlistCommand req, CancellationToken ct)
    {
        var w = await repo.GetWishlistWithItemsAsync(req.WishlistId, ct);
        if (w == null || w.OwnerUserId != req.OwnerUserId) return false;
        await repo.RemoveWishlistAsync(w, ct);
        return true;
    }

    public async Task<IEnumerable<WishlistSummaryDto>> Handle(GetMyWishlistsQuery req, CancellationToken ct)
    {
        var wishlists = await repo.GetWishlistsByUserAsync(req.UserId, ct);
        return wishlists.Select(w => new WishlistSummaryDto(w.Id, w.Name, w.Description, w.IsPublic, w.ShareToken, w.SyncSource, w.LastSyncUtc, w.Items.Count));
    }

    public async Task<Wishlist?> Handle(GetWishlistQuery req, CancellationToken ct)
    {
        var w = await repo.GetWishlistWithItemsAsync(req.WishlistId, ct);
        if (w == null) return null;
        if (!w.IsPublic && w.OwnerUserId != req.UserId) return null;
        return w;
    }

    public async Task<Wishlist?> Handle(GetWishlistByTokenQuery req, CancellationToken ct)
    {
        return await repo.GetWishlistByTokenAsync(req.Token, ct);
    }
}
