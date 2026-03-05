using Xunit;
using Moq;
using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Application.Handlers.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class PlaylistHandlerTests
    {
        private readonly Mock<IPlaylistRepository> _repo = new();

        [Fact]
        public async Task CreatePlaylist_ReturnsId()
        {
            _repo.Setup(r => r.CreateAsync(It.IsAny<Playlist>())).ReturnsAsync(10);

            var handler = new CreatePlaylistHandler(_repo.Object);
            var result = await handler.Handle(
                new CreatePlaylistCommand(new Playlist { Name = "My Playlist" }), CancellationToken.None);

            Assert.Equal(10, result);
        }

        [Fact]
        public async Task UpdatePlaylist_ReturnsTrue()
        {
            _repo.Setup(r => r.UpdateAsync(It.IsAny<Playlist>())).ReturnsAsync(true);

            var handler = new UpdatePlaylistHandler(_repo.Object);
            var result = await handler.Handle(
                new UpdatePlaylistCommand(new Playlist { Id = 1, Name = "Updated" }), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task DeletePlaylist_ReturnsTrue()
        {
            _repo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

            var handler = new DeletePlaylistHandler(_repo.Object);
            var result = await handler.Handle(new DeletePlaylistCommand(1), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task GetAllPlaylists_ReturnsCollection()
        {
            var playlists = new List<Playlist> { new() { Id = 1, Name = "A" }, new() { Id = 2, Name = "B" } };
            _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(playlists);

            var handler = new GetAllPlaylistsHandler(_repo.Object);
            var result = await handler.Handle(new GetAllPlaylistsQuery(), CancellationToken.None);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task AddPlaylistItem_ReturnsId()
        {
            _repo.Setup(r => r.AddItemAsync(1, 5, 3)).ReturnsAsync(99);

            var handler = new AddPlaylistItemHandler(_repo.Object);
            var result = await handler.Handle(new AddPlaylistItemCommand(1, 5, 3), CancellationToken.None);

            Assert.Equal(99, result);
        }

        [Fact]
        public async Task RemovePlaylistItem_ReturnsTrue()
        {
            _repo.Setup(r => r.RemoveItemAsync(7)).ReturnsAsync(true);

            var handler = new RemovePlaylistItemHandler(_repo.Object);
            var result = await handler.Handle(new RemovePlaylistItemCommand(7), CancellationToken.None);

            Assert.True(result);
        }
    }
}
