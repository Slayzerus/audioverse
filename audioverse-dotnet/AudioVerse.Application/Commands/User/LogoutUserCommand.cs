using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record LogoutUserCommand(int UserId) : IRequest<bool>;
}
