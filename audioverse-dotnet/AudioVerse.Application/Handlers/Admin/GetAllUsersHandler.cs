using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetAllUsersHandler : IRequestHandler<GetAllUsersQuery, List<UserDto>>
    {
        private readonly IUserProfileRepository _repository;

        public GetAllUsersHandler(IUserProfileRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        {
            var users = await _repository.GetAllUsersAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                FullName = u.FullName,
                IsBlocked = u.IsBlocked,
                RequirePasswordChange = u.RequirePasswordChange,
                PasswordExpiryDate = u.PasswordExpiryDate,
                PasswordValidityDays = u.PasswordValidityDays,
                CreatedAt = u.CreatedAt,
                LastPasswordChangeDate = u.LastPasswordChangeDate,
                IsAdmin = u.UserName == "ADMIN"
            }).ToList();
        }
    }
}
