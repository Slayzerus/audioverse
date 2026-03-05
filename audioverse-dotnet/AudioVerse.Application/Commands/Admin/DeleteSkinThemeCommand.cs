using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record DeleteSkinThemeCommand(int Id, int? UserId, string? Username) : IRequest<bool>;
}
