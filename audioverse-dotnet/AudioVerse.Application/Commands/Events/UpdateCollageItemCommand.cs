using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateCollageItemCommand(EventCollageItem Item) : IRequest<bool>;
