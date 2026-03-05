using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record UpdateProjectCommand(int Id, string Name, bool IsTemplate, int Volume = 100) : IRequest<bool>;
}
