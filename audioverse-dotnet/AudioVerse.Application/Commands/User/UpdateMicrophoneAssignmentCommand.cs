using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record UpdateMicrophoneAssignmentCommand(int AssignmentId, int UserId, string Color, int Slot) : IRequest<bool>;
}
