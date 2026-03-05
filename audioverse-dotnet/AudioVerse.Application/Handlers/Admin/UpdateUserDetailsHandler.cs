using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.Admin
{
    public class UpdateUserDetailsHandler : IRequestHandler<UpdateUserDetailsCommand, bool>
    {
        private readonly IUserProfileRepository _repository;
        private readonly UserManager<UserProfile> _userManager;

        public UpdateUserDetailsHandler(
            IUserProfileRepository repository,
            UserManager<UserProfile> userManager)
        {
            _repository = repository;
            _userManager = userManager;
        }

        public async Task<bool> Handle(UpdateUserDetailsCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            // Aktualizacja FullName
            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName;

            // Aktualizacja Email
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var emailExists = await _userManager.FindByEmailAsync(request.Email);
                if (emailExists != null && emailExists.Id != user.Id)
                    throw new Exception("Email jest już używany");
                user.Email = request.Email;
            }

            // Aktualizacja UserName
            if (!string.IsNullOrWhiteSpace(request.UserName))
            {
                var usernameExists = await _userManager.FindByNameAsync(request.UserName);
                if (usernameExists != null && usernameExists.Id != user.Id)
                    throw new Exception("Nazwa użytkownika jest już zajęta");
                user.UserName = request.UserName;
            }

            // Aktualizacja RequirePasswordChange
            if (request.RequirePasswordChange.HasValue)
                user.RequirePasswordChange = request.RequirePasswordChange.Value;

            // Aktualizacja PasswordExpiryDate
            if (request.PasswordExpiryDate.HasValue)
            {
                var date = request.PasswordExpiryDate.Value;
                // PostgreSQL wymaga UTC - konwertuj jeśli Unspecified
                if (date.Kind == DateTimeKind.Unspecified)
                    date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                else if (date.Kind == DateTimeKind.Local)
                    date = date.ToUniversalTime();
                
                user.PasswordExpiryDate = date;
            }

            await _repository.UpdateAsync(user);
            return true;
        }
    }
}

