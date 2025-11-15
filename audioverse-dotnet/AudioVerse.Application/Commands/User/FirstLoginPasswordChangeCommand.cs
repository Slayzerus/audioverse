using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record FirstLoginPasswordChangeCommand(int UserId, string NewPassword, string ConfirmPassword) : IRequest<bool>;
}
