using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteInviteTemplateCommand(int Id) : IRequest<bool>;
