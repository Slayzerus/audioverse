using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record DeleteProjectCommand(int Id) : IRequest<bool>;
}
