using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a single sport activity by ID.</summary>
public record GetSportByIdQuery(int Id) : IRequest<SportActivity?>;
