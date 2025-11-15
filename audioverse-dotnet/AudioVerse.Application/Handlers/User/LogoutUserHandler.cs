using MediatR;
using AudioVerse.Domain.Repositories;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.User;

namespace AudioVerse.Application.Handlers.User
{
    public class LogoutUserHandler : IRequestHandler<LogoutUserCommand, bool>
    {
        private readonly IUserProfileRepository _repository;

        public LogoutUserHandler(IUserProfileRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(LogoutUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null) return false;

            user.RefreshToken = string.Empty; // Inwalidacja tokena
            await _repository.UpdateAsync(user);
            return true;
        }
    }
}
