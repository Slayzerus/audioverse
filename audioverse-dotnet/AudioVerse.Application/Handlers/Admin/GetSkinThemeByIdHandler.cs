using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetSkinThemeByIdHandler : IRequestHandler<GetSkinThemeByIdQuery, SkinTheme?>
    {
        private readonly ISkinThemeRepository _repo;
        public GetSkinThemeByIdHandler(ISkinThemeRepository repo) => _repo = repo;

        public async Task<SkinTheme?> Handle(GetSkinThemeByIdQuery request, CancellationToken ct)
            => await _repo.GetByIdAsync(request.Id);
    }
}
