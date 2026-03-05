using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record SetPrimaryUserProfilePlayerCommand(int ProfileId, int PlayerId) : IRequest<bool>;
}
