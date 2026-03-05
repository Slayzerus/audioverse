using MediatR;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Models;

namespace AudioVerse.Application.Handlers.User
{
    public class GetUserProfilePlayerByIdHandler : IRequestHandler<GetUserProfilePlayerByIdQuery, UserProfilePlayerDto?>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        public GetUserProfilePlayerByIdHandler(IUserProfileRepository userProfileRepository) 
        { 
            _userProfileRepository = userProfileRepository; 
        }
        
        public async Task<UserProfilePlayerDto?> Handle(GetUserProfilePlayerByIdQuery request, CancellationToken cancellationToken)
        {
            var p = await _userProfileRepository.GetPlayerByIdAsync(request.PlayerId);
            if (p == null) return null;
            return new UserProfilePlayerDto 
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
            };
        }
    }
}
