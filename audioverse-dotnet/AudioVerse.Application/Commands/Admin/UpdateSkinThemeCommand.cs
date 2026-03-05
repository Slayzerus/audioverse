using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record UpdateSkinThemeCommand(
        int Id,
        string Name,
        string Emoji,
        string? Description,
        bool IsDark,
        string? BodyBackground,
        Dictionary<string, string> Vars,
        bool IsActive,
        int SortOrder,
        int? UserId,
        string? Username) : IRequest<bool>;
}
