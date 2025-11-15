using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.Admin
{
    public class AdminCreateUserHandler : IRequestHandler<AdminCreateUserCommand, int>
    {
        private readonly UserManager<UserProfile> _userManager;

        public AdminCreateUserHandler(UserManager<UserProfile> userManager)
        {
            _userManager = userManager;
        }

        public async Task<int> Handle(AdminCreateUserCommand request, CancellationToken cancellationToken)
        {
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
                throw new Exception("Nazwa użytkownika już istnieje");

            var emailExists = await _userManager.FindByEmailAsync(request.Email);
            if (emailExists != null)
                throw new Exception("Email jest już używany");

            var user = new UserProfile
            {
                UserName = request.Username,
                Email = request.Email,
                FullName = request.FullName,
                RequirePasswordChange = true, // Użytkownik musi zmienić hasło przy pierwszym logowaniu
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.TemporaryPassword);
            if (!result.Succeeded)
                throw new Exception($"Utworzenie użytkownika nie powiodło się: {string.Join(", ", result.Errors.Select(e => e.Description))}");

            return user.Id;
        }
    }
}
