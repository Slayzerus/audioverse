using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record ActivateSkinThemeCommand(int Id, bool IsActive, int? UserId, string? Username) : IRequest<bool>;
}
