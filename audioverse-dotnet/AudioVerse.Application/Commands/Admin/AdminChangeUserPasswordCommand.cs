using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record AdminChangeUserPasswordCommand(int UserId, string NewPassword) : IRequest<bool>;
}
