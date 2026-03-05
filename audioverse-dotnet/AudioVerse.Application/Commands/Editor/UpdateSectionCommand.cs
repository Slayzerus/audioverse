using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record UpdateSectionCommand(int Id, string Name, int OrderNumber) : IRequest<bool>;
}
