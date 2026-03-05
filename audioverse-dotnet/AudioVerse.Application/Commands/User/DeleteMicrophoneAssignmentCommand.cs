using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record DeleteMicrophoneAssignmentCommand(int AssignmentId, int UserId) : IRequest<bool>;
}
