using AudioVerse.Application.Services.Books;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.GoogleBooks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Services;

public class BookCacheServiceTests
{
    private static (BookCacheService Service, Mock<IMediaCatalogRepository> Repo, Mock<IGoogleBooksClient> Google) CreateService()
    {
        var repo = new Mock<IMediaCatalogRepository>();
        var google = new Mock<IGoogleBooksClient>();
        var logger = new Mock<ILogger<BookCacheService>>();

        var sp = new Mock<IServiceProvider>();
        sp.Setup(s => s.GetService(typeof(IMediaCatalogRepository))).Returns(repo.Object);
        sp.Setup(s => s.GetService(typeof(IGoogleBooksClient))).Returns(google.Object);

        var scope = new Mock<IServiceScope>();
        scope.Setup(s => s.ServiceProvider).Returns(sp.Object);

        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Returns(scope.Object);

        var service = new BookCacheService(factory.Object, logger.Object);
        return (service, repo, google);
    }

    [Fact]
    public async Task Search_ReturnsLocalResults_WhenEnough()
    {
        var (svc, repo, google) = CreateService();
        var localBooks = Enumerable.Range(1, 20)
            .Select(i => new Book { Id = i, Title = $"Book {i}" })
            .ToList();

        repo.Setup(r => r.SearchBooksAsync("test", 20))
            .ReturnsAsync(localBooks);

        var result = await svc.SearchWithCacheThroughAsync("test", 20);

        Assert.Equal(20, result.Count);
        google.Verify(g => g.SearchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Search_FetchesFromGoogle_WhenLocalInsufficient()
    {
        var (svc, repo, google) = CreateService();
        var localBooks = new List<Book>
        {
            new() { Id = 1, Title = "Local Book", GoogleBooksId = "existing123" }
        };

        repo.Setup(r => r.SearchBooksAsync("sapiens", 20))
            .ReturnsAsync(localBooks);

        google.Setup(g => g.SearchAsync("sapiens", 40, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GoogleBooksSearchResult>
            {
                new() { Id = "existing123", Title = "Local Book" }, // already local
                new() { Id = "new456", Title = "Sapiens", Authors = new List<string> { "Harari" } },
                new() { Id = "new789", Title = "Sapiens 2", Authors = new List<string> { "Harari" } }
            });

        repo.Setup(r => r.UpsertBooksFromGoogleAsync(It.IsAny<IEnumerable<Book>>()))
            .ReturnsAsync(2);

        // After upsert, re-search returns more
        repo.SetupSequence(r => r.SearchBooksAsync("sapiens", 20))
            .ReturnsAsync(localBooks) // first call
            .ReturnsAsync(new List<Book>
            {
                new() { Id = 1, Title = "Local Book" },
                new() { Id = 2, Title = "Sapiens" },
                new() { Id = 3, Title = "Sapiens 2" }
            }); // second call after upsert

        var result = await svc.SearchWithCacheThroughAsync("sapiens", 20);

        Assert.Equal(3, result.Count);
        repo.Verify(r => r.UpsertBooksFromGoogleAsync(
            It.Is<IEnumerable<Book>>(books => books.Count() == 2)), Times.Once);
    }

    [Fact]
    public async Task Search_ReturnsLocalOnly_WhenGoogleFails()
    {
        var (svc, repo, google) = CreateService();
        var localBooks = new List<Book> { new() { Id = 1, Title = "Only Local" } };

        repo.Setup(r => r.SearchBooksAsync("query", 20))
            .ReturnsAsync(localBooks);

        google.Setup(g => g.SearchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Network error"));

        var result = await svc.SearchWithCacheThroughAsync("query", 20);

        Assert.Single(result);
        Assert.Equal("Only Local", result[0].Title);
    }

    [Fact]
    public async Task GetByGoogleId_ReturnsLocal_WhenCached()
    {
        var (svc, repo, google) = CreateService();
        var book = new Book { Id = 5, Title = "Cached", GoogleBooksId = "abc123" };
        repo.Setup(r => r.GetBookByGoogleIdAsync("abc123")).ReturnsAsync(book);

        var result = await svc.GetByGoogleIdWithCacheAsync("abc123");

        Assert.NotNull(result);
        Assert.Equal("Cached", result!.Title);
        google.Verify(g => g.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetByGoogleId_FetchesFromGoogle_WhenNotCached()
    {
        var (svc, repo, google) = CreateService();
        repo.Setup(r => r.GetBookByGoogleIdAsync("new456"))
            .ReturnsAsync((Book?)null);

        google.Setup(g => g.GetByIdAsync("new456", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleBooksDetails
            {
                Id = "new456",
                Title = "From Google",
                Authors = new List<string> { "Author" },
                Categories = new List<string>()
            });

        repo.Setup(r => r.UpsertBooksFromGoogleAsync(It.IsAny<IEnumerable<Book>>()))
            .ReturnsAsync(1);

        // After upsert, return the saved book
        repo.SetupSequence(r => r.GetBookByGoogleIdAsync("new456"))
            .ReturnsAsync((Book?)null) // first call
            .ReturnsAsync(new Book { Id = 10, Title = "From Google", GoogleBooksId = "new456" }); // after upsert

        var result = await svc.GetByGoogleIdWithCacheAsync("new456");

        Assert.NotNull(result);
        Assert.Equal("From Google", result!.Title);
    }

    [Fact]
    public async Task GetByGoogleId_ReturnsNull_WhenGoogleReturnsNull()
    {
        var (svc, repo, google) = CreateService();
        repo.Setup(r => r.GetBookByGoogleIdAsync("missing"))
            .ReturnsAsync((Book?)null);
        google.Setup(g => g.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoogleBooksDetails?)null);

        var result = await svc.GetByGoogleIdWithCacheAsync("missing");

        Assert.Null(result);
    }

    [Fact]
    public async Task Export_ReturnsAllGoogleBooks()
    {
        var (svc, repo, _) = CreateService();
        repo.Setup(r => r.GetAllGoogleBooksAsync())
            .ReturnsAsync(new List<Book>
            {
                new() { Id = 1, GoogleBooksId = "a" },
                new() { Id = 2, GoogleBooksId = "b" }
            });

        var result = await svc.ExportCatalogAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Import_CallsUpsert()
    {
        var (svc, repo, _) = CreateService();
        repo.Setup(r => r.UpsertBooksFromGoogleAsync(It.IsAny<IEnumerable<Book>>()))
            .ReturnsAsync(5);

        var books = Enumerable.Range(1, 5)
            .Select(i => new Book { GoogleBooksId = $"g{i}", Title = $"Book {i}" })
            .ToList();

        var result = await svc.ImportCatalogAsync(books);

        Assert.Equal(5, result);
    }
}
