using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record BlockUserCommand(int UserId, bool IsBlocked) : IRequest<bool>;
}
