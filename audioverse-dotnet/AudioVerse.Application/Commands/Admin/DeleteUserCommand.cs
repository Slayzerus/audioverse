using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record DeleteUserCommand(int UserId) : IRequest<bool>;
}
