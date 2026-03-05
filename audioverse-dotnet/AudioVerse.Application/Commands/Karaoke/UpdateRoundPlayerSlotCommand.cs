using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateRoundPlayerSlotCommand(int RoundId, int AssignmentId, int Slot) : IRequest<bool>;
}
