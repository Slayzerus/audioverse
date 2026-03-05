using AudioVerse.Domain.Entities.Design;
using MediatR;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetActiveSkinThemesQuery() : IRequest<IEnumerable<SkinTheme>>;
}
