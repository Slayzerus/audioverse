using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemoveCollaboratorCommand(int SongId, int UserId) : IRequest<bool>;
}
