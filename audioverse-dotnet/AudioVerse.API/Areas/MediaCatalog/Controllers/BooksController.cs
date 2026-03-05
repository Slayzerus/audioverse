using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Media;
using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Infrastructure.ExternalApis.OpenLibrary;

using AudioVerse.Infrastructure.ExternalApis.GoogleBooks;

namespace AudioVerse.API.Areas.MediaCatalog.Controllers
{
    /// <summary>
    /// Books catalog with Open Library and Google Books integration, collections (book club shelves), and search.
    /// </summary>
    [ApiController]
    [Route("api/media/books")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Media - Books")]
    public class BooksController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IOpenLibraryClient? _openLibrary;
        private readonly IGoogleBooksClient? _googleBooks;

        public BooksController(IMediator mediator, IOpenLibraryClient? openLibrary = null, IGoogleBooksClient? googleBooks = null)
        {
            _mediator = mediator;
            _openLibrary = openLibrary;
            _googleBooks = googleBooks;
        }

        /// <summary>Get a paged list of books.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] string? query = null, [FromQuery] string? sortBy = null, [FromQuery] bool descending = false)
        {
            var (items, total) = await _mediator.Send(new GetBooksPagedQuery(page, pageSize, query, sortBy, descending));
            return Ok(new { items, total, page, pageSize });
        }

        /// <summary>Get a book by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var b = await _mediator.Send(new GetBookByIdQuery(id));
            return b != null ? Ok(b) : NotFound();
        }

        /// <summary>Create a new book.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Book book)
        {
            var id = await _mediator.Send(new AddBookCommand(book));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a book.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Book book)
        {
            book.Id = id;
            return await _mediator.Send(new UpdateBookCommand(book)) ? Ok() : NotFound();
        }

        /// <summary>Delete a book.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id) =>
            await _mediator.Send(new DeleteBookCommand(id)) ? Ok() : NotFound();

        // ── Open Library Integration ──

        /// <summary>Search books on Open Library.</summary>
        [HttpGet("openlibrary/search")]
        public async Task<IActionResult> OpenLibrarySearch([FromQuery] string query, [FromQuery] int limit = 20)
        {
            if (_openLibrary == null) return StatusCode(503, new { error = "Open Library client not configured." });
            return Ok(await _openLibrary.SearchAsync(query, limit));
        }

        /// <summary>Import a book from Open Library by ISBN.</summary>
        [HttpPost("openlibrary/import/isbn/{isbn}")]
        public async Task<IActionResult> OpenLibraryImportByIsbn(string isbn)
        {
            if (_openLibrary == null) return StatusCode(503, new { error = "Open Library client not configured." });
            var details = await _openLibrary.GetByIsbnAsync(isbn);
            if (details == null) return NotFound(new { error = "Book not found on Open Library." });

            var book = new Book
            {
                Title = details.Title,
                Author = details.Authors.FirstOrDefault(),
                Description = details.Description,
                Isbn = details.Isbn13 ?? isbn,
                PageCount = details.NumberOfPages,
                PublishedYear = details.PublishYear,
                Publisher = details.Publisher,
                CoverUrl = details.CoverUrl,
                OpenLibraryId = details.Key,
                ImportedFrom = "openlibrary"
            };

            var id = await _mediator.Send(new AddBookCommand(book));
            return CreatedAtAction(nameof(GetById), new { id }, book);
        }

        // ── Google Books Integration ──

        /// <summary>Search books on Google Books.</summary>
        [HttpGet("google/search")]
        public async Task<IActionResult> GoogleBooksSearch([FromQuery] string query, [FromQuery] int limit = 20)
        {
            if (_googleBooks == null) return StatusCode(503, new { error = "Google Books client not available." });
            return Ok(await _googleBooks.SearchAsync(query, limit));
        }

        /// <summary>Import a book from Google Books by volume ID.</summary>
        [HttpPost("google/import/{volumeId}")]
        public async Task<IActionResult> GoogleBooksImport(string volumeId)
        {
            if (_googleBooks == null) return StatusCode(503, new { error = "Google Books client not available." });
            var details = await _googleBooks.GetByIdAsync(volumeId);
            if (details == null) return NotFound(new { error = "Book not found on Google Books." });

            var book = new Book
            {
                Title = details.Title,
                Author = details.Authors.FirstOrDefault(),
                Description = details.Description,
                Isbn = details.Isbn13,
                PageCount = details.PageCount,
                PublishedYear = int.TryParse(details.PublishedDate?.Split('-').FirstOrDefault(), out var y) ? y : null,
                Publisher = details.Publisher,
                CoverUrl = details.ThumbnailUrl,
                Rating = details.AverageRating,
                Language = details.Language,
                GoogleBooksId = details.Id,
                ImportedFrom = "googlebooks"
            };

            var id = await _mediator.Send(new AddBookCommand(book));
            return CreatedAtAction(nameof(GetById), new { id }, book);
        }

        // ── Collections ──

        /// <summary>Create a book collection (book club shelf, reading list).</summary>
        [HttpPost("collections")]
        public async Task<IActionResult> CreateCollection([FromBody] BookCollection collection)
        {
            var id = await _mediator.Send(new AddBookCollectionCommand(collection));
            return CreatedAtAction(nameof(GetCollectionById), new { id }, new { Id = id });
        }

        /// <summary>Get a book collection by ID.</summary>
        [HttpGet("collections/{id:int}")]
        public async Task<IActionResult> GetCollectionById(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var c = await _mediator.Send(new GetBookCollectionByIdQuery(id, includeChildren, maxDepth));
            return c != null ? Ok(c) : NotFound();
        }

        /// <summary>Get book collections by owner.</summary>
        [HttpGet("collections/owner/{ownerId:int}")]
        public async Task<IActionResult> GetCollectionsByOwner(int ownerId) =>
            Ok(await _mediator.Send(new GetBookCollectionsByOwnerQuery(ownerId)));

        /// <summary>Update a book collection.</summary>
        [HttpPut("collections/{id:int}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromBody] BookCollection collection)
        {
            collection.Id = id;
            return await _mediator.Send(new UpdateBookCollectionCommand(collection)) ? Ok() : NotFound();
        }

        /// <summary>Delete a book collection.</summary>
        [HttpDelete("collections/{id:int}")]
        public async Task<IActionResult> DeleteCollection(int id) =>
            await _mediator.Send(new DeleteBookCollectionCommand(id)) ? Ok() : NotFound();

        /// <summary>Add a book to a collection.</summary>
        [HttpPost("collections/{collectionId:int}/books")]
        public async Task<IActionResult> AddToCollection(int collectionId, [FromBody] BookCollectionBook item)
        {
            item.CollectionId = collectionId;
            var id = await _mediator.Send(new AddBookToCollectionCommand(item));
            return Ok(new { Id = id });
        }

        /// <summary>Remove a book from a collection.</summary>
        [HttpDelete("collections/books/{id:int}")]
        public async Task<IActionResult> RemoveFromCollection(int id) =>
            await _mediator.Send(new RemoveBookFromCollectionCommand(id)) ? Ok() : NotFound();
    }
}
