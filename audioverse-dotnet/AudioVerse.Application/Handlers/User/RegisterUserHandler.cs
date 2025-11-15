using MediatR;
using AudioVerse.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Application.Commands.User;

namespace AudioVerse.Application.Handlers.User
{   
    public class RegisterUserHandler : IRequestHandler<RegisterUserCommand, int>
    {
        private readonly UserManager<UserProfile> _userManager;

        public RegisterUserHandler(UserManager<UserProfile> userManager)
        {
            _userManager = userManager;
        }

        public async Task<int> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null) throw new Exception("Username already exists");

            var user = new UserProfile
            {
                UserName = request.Username,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                throw new Exception($"User creation failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            return user.Id;
        }
    }

}
