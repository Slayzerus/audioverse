using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Search sport activities by name.</summary>
public record SearchSportsQuery(string Query, int Limit = 20) : IRequest<IEnumerable<SportActivity>>;
