using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class SetPasswordValidityHandler : IRequestHandler<SetPasswordValidityCommand, bool>
    {
        private readonly IUserProfileRepository _repository;
        private readonly IPasswordService _passwordService;

        public SetPasswordValidityHandler(
            IUserProfileRepository repository,
            IPasswordService passwordService)
        {
            _repository = repository;
            _passwordService = passwordService;
        }

        public async Task<bool> Handle(SetPasswordValidityCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            user.PasswordValidityDays = request.ValidityDays;
            _passwordService.UpdatePasswordExpiry(user);
            await _repository.UpdateAsync(user);

            return true;
        }
    }
}
