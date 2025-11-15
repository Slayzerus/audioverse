using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record ChangeAdminPasswordCommand(string OldPassword, string NewPassword) : IRequest<bool>;
}
