using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemoveRoundPlayerCommand(int RoundId, int PlayerId) : IRequest<bool>;
}
