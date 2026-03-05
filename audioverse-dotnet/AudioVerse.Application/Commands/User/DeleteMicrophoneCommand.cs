using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record DeleteMicrophoneCommand(int MicrophoneRecordId, int UserId) : IRequest<bool>;
}
