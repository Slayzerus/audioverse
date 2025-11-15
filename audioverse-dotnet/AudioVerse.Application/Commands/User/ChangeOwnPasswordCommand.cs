using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record ChangeOwnPasswordCommand(int UserId, string OldPassword, string NewPassword) : IRequest<bool>;
}
