using Xunit;
using Moq;
using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Application.Handlers.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class GenreHandlerTests
    {
        private readonly Mock<IMusicGenreRepository> _genreRepo = new();
        private readonly Mock<ILibrarySongRepository> _libraryRepo = new();

        [Fact]
        public async Task CreateGenre_ReturnsId()
        {
            _genreRepo.Setup(r => r.CreateAsync(It.IsAny<MusicGenre>())).ReturnsAsync(5);

            var handler = new CreateGenreHandler(_genreRepo.Object);
            var result = await handler.Handle(
                new CreateGenreCommand(new MusicGenre { Name = "Rock" }), CancellationToken.None);

            Assert.Equal(5, result);
        }

        [Fact]
        public async Task UpdateGenre_ReturnsTrue()
        {
            _genreRepo.Setup(r => r.UpdateAsync(It.IsAny<MusicGenre>())).ReturnsAsync(true);

            var handler = new UpdateGenreHandler(_genreRepo.Object);
            var result = await handler.Handle(
                new UpdateGenreCommand(new MusicGenre { Id = 1, Name = "Jazz" }), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task DeleteGenre_ReturnsTrue()
        {
            _genreRepo.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);

            var handler = new DeleteGenreHandler(_genreRepo.Object);
            var result = await handler.Handle(new DeleteGenreCommand(3), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task GetActiveGenres_ReturnsAll()
        {
            var genres = new List<MusicGenre> { new() { Id = 1, Name = "Rock" }, new() { Id = 2, Name = "Pop" } };
            _libraryRepo.Setup(r => r.GetAllGenresAsync(It.IsAny<CancellationToken>())).ReturnsAsync(genres);

            var handler = new GetActiveGenresHandler(_libraryRepo.Object);
            var result = await handler.Handle(new GetActiveGenresQuery(), CancellationToken.None);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetGenreById_ReturnsGenre()
        {
            var genre = new MusicGenre { Id = 1, Name = "Blues" };
            _libraryRepo.Setup(r => r.GetGenreByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(genre);

            var handler = new GetGenreByIdHandler(_libraryRepo.Object);
            var result = await handler.Handle(new GetGenreByIdQuery(1), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Blues", result!.Name);
        }

        [Fact]
        public async Task GetGenreById_ReturnsNull_WhenNotFound()
        {
            _libraryRepo.Setup(r => r.GetGenreByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((MusicGenre?)null);

            var handler = new GetGenreByIdHandler(_libraryRepo.Object);
            var result = await handler.Handle(new GetGenreByIdQuery(999), CancellationToken.None);

            Assert.Null(result);
        }
    }
}
