using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateInviteTemplateCommand(EventInviteTemplate Template) : IRequest<bool>;
