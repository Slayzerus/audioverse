using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class DeleteUserHandler : IRequestHandler<DeleteUserCommand, bool>
    {
        private readonly IUserProfileRepository _repository;

        public DeleteUserHandler(IUserProfileRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            if (user.UserName == "ADMIN")
                throw new Exception("Nie można usunąć konta administratora");

            await _repository.DeleteAsync(request.UserId);
            return true;
        }
    }
}
