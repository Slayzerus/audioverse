using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record AdminCreateUserCommand(
        string Username,
        string Email,
        string FullName,
        string TemporaryPassword
    ) : IRequest<int>;
}
