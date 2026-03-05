using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetActiveSkinThemesHandler : IRequestHandler<GetActiveSkinThemesQuery, IEnumerable<SkinTheme>>
    {
        private readonly ISkinThemeRepository _repo;
        public GetActiveSkinThemesHandler(ISkinThemeRepository repo) => _repo = repo;

        public async Task<IEnumerable<SkinTheme>> Handle(GetActiveSkinThemesQuery request, CancellationToken ct)
            => await _repo.GetActiveAsync();
    }
}
