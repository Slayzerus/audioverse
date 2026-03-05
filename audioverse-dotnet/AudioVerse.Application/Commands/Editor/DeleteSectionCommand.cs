using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record DeleteSectionCommand(int Id) : IRequest<bool>;
}
