using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record CreateSkinThemeCommand(
        string Name,
        string Emoji,
        string? Description,
        bool IsDark,
        string? BodyBackground,
        Dictionary<string, string> Vars,
        bool IsActive,
        bool IsSystem,
        int SortOrder,
        int? UserId,
        string? Username) : IRequest<int>;
}
