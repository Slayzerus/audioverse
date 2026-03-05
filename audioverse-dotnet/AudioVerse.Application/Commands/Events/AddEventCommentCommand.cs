using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddEventCommentCommand(EventComment Comment) : IRequest<int>;
