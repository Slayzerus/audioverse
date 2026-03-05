using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddSongPickCommand(EventSessionSongPick Pick) : IRequest<int>;
