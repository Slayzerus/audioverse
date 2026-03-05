using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteEventPhotoCommand(int Id) : IRequest<bool>;
