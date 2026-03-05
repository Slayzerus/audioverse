using AudioVerse.Domain.Entities.Design;
using MediatR;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetAllSkinThemesQuery(bool IncludeDeleted = false) : IRequest<IEnumerable<SkinTheme>>;
}
