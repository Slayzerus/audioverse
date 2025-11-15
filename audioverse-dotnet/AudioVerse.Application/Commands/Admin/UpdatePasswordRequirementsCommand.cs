using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record UpdatePasswordRequirementsCommand(
        bool RequireUppercase,
        bool RequireLowercase,
        bool RequireDigit,
        bool RequireSpecialChar,
        int MinLength
    ) : IRequest<bool>;
}
