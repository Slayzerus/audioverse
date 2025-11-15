using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class BlockUserHandler : IRequestHandler<BlockUserCommand, bool>
    {
        private readonly IUserProfileRepository _repository;

        public BlockUserHandler(IUserProfileRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(BlockUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            if (user.UserName == "ADMIN")
                throw new Exception("Nie można zablokować konta administratora");

            user.IsBlocked = request.IsBlocked;
            await _repository.UpdateAsync(user);
            return true;
        }
    }
}
