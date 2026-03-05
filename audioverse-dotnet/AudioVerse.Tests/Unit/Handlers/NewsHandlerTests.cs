using Xunit;
using Moq;
using AudioVerse.Application.Commands.News;
using AudioVerse.Application.Handlers.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class NewsHandlerTests
    {
        private readonly Mock<INewsFeedRepository> _repo = new();

        [Fact]
        public async Task CreateNewsFeed_ReturnsId()
        {
            _repo.Setup(r => r.CreateFeedAsync(It.IsAny<NewsFeed>())).ReturnsAsync(7);

            var handler = new CreateNewsFeedHandler(_repo.Object);
            var feed = new NewsFeed { Title = "Tech News", FeedUrl = "https://example.com/rss" };
            var id = await handler.Handle(new CreateNewsFeedCommand(feed), CancellationToken.None);

            Assert.Equal(7, id);
        }

        [Fact]
        public async Task DeleteNewsFeed_ReturnsTrue_WhenDeleted()
        {
            _repo.Setup(r => r.DeleteFeedAsync(5)).ReturnsAsync(true);

            var handler = new DeleteNewsFeedHandler(_repo.Object);
            var result = await handler.Handle(new DeleteNewsFeedCommand(5), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task DeleteNewsFeed_ReturnsFalse_WhenNotFound()
        {
            _repo.Setup(r => r.DeleteFeedAsync(999)).ReturnsAsync(false);

            var handler = new DeleteNewsFeedHandler(_repo.Object);
            var result = await handler.Handle(new DeleteNewsFeedCommand(999), CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task ToggleNewsFeed_ReturnsNull_WhenNotFound()
        {
            _repo.Setup(r => r.GetFeedByIdAsync(999)).ReturnsAsync((NewsFeed?)null);

            var handler = new ToggleNewsFeedHandler(_repo.Object);
            var result = await handler.Handle(new ToggleNewsFeedCommand(999), CancellationToken.None);

            Assert.Null(result);
        }

        [Fact]
        public async Task ToggleNewsFeed_TogglesIsActive()
        {
            var feed = new NewsFeed { Id = 1, Title = "Feed", IsActive = true };
            _repo.Setup(r => r.GetFeedByIdAsync(1)).ReturnsAsync(feed);
            _repo.Setup(r => r.UpdateFeedAsync(It.IsAny<NewsFeed>())).ReturnsAsync(true);

            var handler = new ToggleNewsFeedHandler(_repo.Object);
            var result = await handler.Handle(new ToggleNewsFeedCommand(1), CancellationToken.None);

            Assert.False(result);
            Assert.False(feed.IsActive);
        }

        [Fact]
        public async Task CreateNewsCategory_ReturnsId()
        {
            _repo.Setup(r => r.CreateCategoryAsync(It.IsAny<NewsFeedCategory>())).ReturnsAsync(3);

            var handler = new CreateNewsCategoryHandler(_repo.Object);
            var cat = new NewsFeedCategory { Name = "Tech", Slug = "tech" };
            var id = await handler.Handle(new CreateNewsCategoryCommand(cat), CancellationToken.None);

            Assert.Equal(3, id);
        }
    }
}
