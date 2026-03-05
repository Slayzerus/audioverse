using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddCollageCommand(EventCollage Collage) : IRequest<int>;
