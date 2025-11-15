using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record SetPasswordValidityCommand(int UserId, int? ValidityDays) : IRequest<bool>;
}
