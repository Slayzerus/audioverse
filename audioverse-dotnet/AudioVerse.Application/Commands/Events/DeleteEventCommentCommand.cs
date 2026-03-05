using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteEventCommentCommand(int Id) : IRequest<bool>;
