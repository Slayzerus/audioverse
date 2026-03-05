using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetAllSkinThemesHandler : IRequestHandler<GetAllSkinThemesQuery, IEnumerable<SkinTheme>>
    {
        private readonly ISkinThemeRepository _repo;
        public GetAllSkinThemesHandler(ISkinThemeRepository repo) => _repo = repo;

        public async Task<IEnumerable<SkinTheme>> Handle(GetAllSkinThemesQuery request, CancellationToken ct)
            => await _repo.GetAllAsync(request.IncludeDeleted);
    }
}
