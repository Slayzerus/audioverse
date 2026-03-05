using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record DeleteUserProfilePlayerCommand(int PlayerId, int ProfileId) : IRequest<bool>;
}
