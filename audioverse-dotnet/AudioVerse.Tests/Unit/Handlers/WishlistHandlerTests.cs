using Xunit;
using Moq;
using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Application.Queries.Wishlists;
using AudioVerse.Application.Handlers.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class WishlistHandlerTests
    {
        private readonly Mock<IWishlistRepository> _repo = new();
        private readonly WishlistHandlers _handler;

        public WishlistHandlerTests()
        {
            _handler = new WishlistHandlers(_repo.Object);
        }

        [Fact]
        public async Task CreateWishlist_ReturnsNewWishlist()
        {
            _repo.Setup(r => r.AddWishlistAsync(It.IsAny<Wishlist>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Wishlist w, CancellationToken _) => { w.Id = 1; return w; });

            var result = await _handler.Handle(
                new CreateWishlistCommand(99, "Birthday", "My list", true), CancellationToken.None);

            Assert.Equal("Birthday", result.Name);
            Assert.Equal(99, result.OwnerUserId);
            _repo.Verify(r => r.AddWishlistAsync(It.IsAny<Wishlist>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task UpdateWishlist_ReturnsNull_WhenNotOwner()
        {
            _repo.Setup(r => r.GetWishlistByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Wishlist { Id = 1, OwnerUserId = 50 });

            var result = await _handler.Handle(
                new UpdateWishlistCommand(1, 999, "New", null, false), CancellationToken.None);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateWishlist_UpdatesAndReturns_WhenOwner()
        {
            var existing = new Wishlist { Id = 1, OwnerUserId = 50, Name = "Old" };
            _repo.Setup(r => r.GetWishlistByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existing);

            var result = await _handler.Handle(
                new UpdateWishlistCommand(1, 50, "Updated", "desc", true), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Updated", result!.Name);
            _repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task DeleteWishlist_ReturnsFalse_WhenNotOwner()
        {
            _repo.Setup(r => r.GetWishlistWithItemsAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Wishlist { Id = 1, OwnerUserId = 50 });

            var result = await _handler.Handle(
                new DeleteWishlistCommand(1, 999), CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteWishlist_ReturnsTrue_WhenOwner()
        {
            var w = new Wishlist { Id = 1, OwnerUserId = 50 };
            _repo.Setup(r => r.GetWishlistWithItemsAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(w);

            var result = await _handler.Handle(
                new DeleteWishlistCommand(1, 50), CancellationToken.None);

            Assert.True(result);
            _repo.Verify(r => r.RemoveWishlistAsync(w, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task GetWishlist_ReturnsNull_WhenPrivateAndNotOwner()
        {
            _repo.Setup(r => r.GetWishlistWithItemsAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Wishlist { Id = 1, OwnerUserId = 50, IsPublic = false });

            var result = await _handler.Handle(
                new GetWishlistQuery(1, 999), CancellationToken.None);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetWishlist_ReturnsWishlist_WhenPublic()
        {
            var w = new Wishlist { Id = 1, OwnerUserId = 50, IsPublic = true };
            _repo.Setup(r => r.GetWishlistWithItemsAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(w);

            var result = await _handler.Handle(
                new GetWishlistQuery(1, 999), CancellationToken.None);

            Assert.NotNull(result);
        }
    }
}
