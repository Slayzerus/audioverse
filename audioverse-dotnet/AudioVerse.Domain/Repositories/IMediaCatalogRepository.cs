using AudioVerse.Domain.Entities.Media;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>Repository for Movies, TV Shows, Books, and Sports catalog operations.</summary>
    public interface IMediaCatalogRepository
    {
        // --- Movies ---
        Task<(IEnumerable<Movie> Items, int TotalCount)> GetMoviesPagedAsync(int page, int pageSize, string? query = null, string? sortBy = null, bool descending = false);
        Task<int> AddMovieAsync(Movie movie);
        Task<Movie?> GetMovieByIdAsync(int id);
        Task<IEnumerable<Movie>> SearchMoviesAsync(string query, int limit = 20);
        Task<bool> UpdateMovieAsync(Movie movie);
        Task<bool> DeleteMovieAsync(int id);

        // --- TV Shows ---
        Task<(IEnumerable<TvShow> Items, int TotalCount)> GetTvShowsPagedAsync(int page, int pageSize, string? query = null, string? sortBy = null, bool descending = false);
        Task<int> AddTvShowAsync(TvShow show);
        Task<TvShow?> GetTvShowByIdAsync(int id);
        Task<IEnumerable<TvShow>> SearchTvShowsAsync(string query, int limit = 20);
        Task<bool> UpdateTvShowAsync(TvShow show);
        Task<bool> DeleteTvShowAsync(int id);

        // --- Books ---
        Task<(IEnumerable<Book> Items, int TotalCount)> GetBooksPagedAsync(int page, int pageSize, string? query = null, string? sortBy = null, bool descending = false);
        Task<int> AddBookAsync(Book book);
        Task<Book?> GetBookByIdAsync(int id);
        Task<Book?> GetBookByGoogleIdAsync(string googleBooksId);
        Task<IEnumerable<Book>> SearchBooksAsync(string query, int limit = 20);
        Task<bool> UpdateBookAsync(Book book);
        Task<bool> DeleteBookAsync(int id);
        Task<int> UpsertBooksFromGoogleAsync(IEnumerable<Book> books);
        Task<List<Book>> GetAllGoogleBooksAsync();

        // --- Sports ---
        Task<(IEnumerable<SportActivity> Items, int TotalCount)> GetSportsPagedAsync(int page, int pageSize, string? query = null, string? sortBy = null, bool descending = false);
        Task<int> AddSportAsync(SportActivity sport);
        Task<SportActivity?> GetSportByIdAsync(int id);
        Task<IEnumerable<SportActivity>> SearchSportsAsync(string query, int limit = 20);
        Task<bool> UpdateSportAsync(SportActivity sport);
        Task<bool> DeleteSportAsync(int id);

        // --- Collections (Movie) ---
        Task<int> AddMovieCollectionAsync(MovieCollection collection);
        Task<MovieCollection?> GetMovieCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
        Task<IEnumerable<MovieCollection>> GetMovieCollectionsByOwnerAsync(int ownerId);
        Task<bool> UpdateMovieCollectionAsync(MovieCollection collection);
        Task<bool> DeleteMovieCollectionAsync(int id);
        Task<int> AddMovieToCollectionAsync(MovieCollectionMovie item);
        Task<bool> RemoveMovieFromCollectionAsync(int id);

        // --- Collections (TvShow) ---
        Task<int> AddTvShowCollectionAsync(TvShowCollection collection);
        Task<TvShowCollection?> GetTvShowCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
        Task<IEnumerable<TvShowCollection>> GetTvShowCollectionsByOwnerAsync(int ownerId);
        Task<bool> UpdateTvShowCollectionAsync(TvShowCollection collection);
        Task<bool> DeleteTvShowCollectionAsync(int id);
        Task<int> AddTvShowToCollectionAsync(TvShowCollectionTvShow item);
        Task<bool> RemoveTvShowFromCollectionAsync(int id);

        // --- Collections (Book) ---
        Task<int> AddBookCollectionAsync(BookCollection collection);
        Task<BookCollection?> GetBookCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
        Task<IEnumerable<BookCollection>> GetBookCollectionsByOwnerAsync(int ownerId);
        Task<bool> UpdateBookCollectionAsync(BookCollection collection);
        Task<bool> DeleteBookCollectionAsync(int id);
        Task<int> AddBookToCollectionAsync(BookCollectionBook item);
        Task<bool> RemoveBookFromCollectionAsync(int id);
    }
}
