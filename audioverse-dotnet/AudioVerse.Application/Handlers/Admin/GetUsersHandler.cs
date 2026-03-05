using AudioVerse.Application.Models.Admin;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetUsersHandler : IRequestHandler<GetUsersQuery, List<UserAdminDto>>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly UserManager<UserProfile> _userManager;
        
        public GetUsersHandler(IUserProfileRepository userProfileRepository, UserManager<UserProfile> userManager)
        {
            _userProfileRepository = userProfileRepository;
            _userManager = userManager;
        }

        public async Task<List<UserAdminDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        {
            var users = await _userProfileRepository.GetAllUsersAsync();
            var result = new List<UserAdminDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new UserAdminDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    IsBlocked = user.IsBlocked,
                    Roles = string.Join(",", roles),
                    IsGuest = roles.Contains("Guest")
                });
            }
            return result;
        }
    }
}
