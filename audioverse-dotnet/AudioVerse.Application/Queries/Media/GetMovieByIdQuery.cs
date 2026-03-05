using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a single movie by ID.</summary>
public record GetMovieByIdQuery(int Id) : IRequest<Movie?>;
