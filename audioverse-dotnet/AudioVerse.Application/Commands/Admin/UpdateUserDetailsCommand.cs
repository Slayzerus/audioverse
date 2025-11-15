using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record UpdateUserDetailsCommand(
        int UserId,
        string? FullName = null,
        string? Email = null,
        string? UserName = null
    ) : IRequest<bool>;
}
