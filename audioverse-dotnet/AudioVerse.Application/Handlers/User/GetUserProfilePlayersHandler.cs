using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class GetUserProfilePlayersHandler : IRequestHandler<GetUserProfilePlayersQuery, List<UserProfilePlayerDto>>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public GetUserProfilePlayersHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<List<UserProfilePlayerDto>> Handle(GetUserProfilePlayersQuery request, CancellationToken cancellationToken)
        {
            var players = await _userProfileRepository.GetPlayersByUserAsync(request.ProfileId);
            return players
                .OrderBy(p => p.Name)
                .Select(p => new UserProfilePlayerDto 
                { 
                    Id = p.Id, 
                    Name = p.Name, 
                    ProfileId = p.ProfileId, 
                    PreferredColors = p.PreferredColors, 
                    FillPattern = p.FillPattern, 
                    IsPrimary = p.IsPrimary,
                    Email = p.Email,
                    Icon = p.Icon,
                    PhotoUrl = !string.IsNullOrEmpty(p.PhotoKey) ? $"/api/user/players/{p.Id}/photo" : null,
                    KaraokeSettings = p.KaraokeSettings 
                })
                .ToList();
        }
    }
}
