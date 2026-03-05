using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Search books by title or author.</summary>
public record SearchBooksQuery(string Query, int Limit = 20) : IRequest<IEnumerable<Book>>;
