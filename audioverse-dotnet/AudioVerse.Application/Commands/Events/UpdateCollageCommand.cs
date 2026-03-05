using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateCollageCommand(EventCollage Collage) : IRequest<bool>;
