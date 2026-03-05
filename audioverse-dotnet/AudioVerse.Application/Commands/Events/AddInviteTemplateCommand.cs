using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddInviteTemplateCommand(EventInviteTemplate Template) : IRequest<int>;
