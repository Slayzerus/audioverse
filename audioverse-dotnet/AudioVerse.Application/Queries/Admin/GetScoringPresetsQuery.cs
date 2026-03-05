using MediatR;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetScoringPresetsQuery() : IRequest<string>; // returns JSON
}
