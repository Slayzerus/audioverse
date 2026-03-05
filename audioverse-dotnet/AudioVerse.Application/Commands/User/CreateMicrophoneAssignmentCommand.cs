using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record CreateMicrophoneAssignmentCommand(int UserId, string MicrophoneId, string Color, int Slot) : IRequest<int>;
}
