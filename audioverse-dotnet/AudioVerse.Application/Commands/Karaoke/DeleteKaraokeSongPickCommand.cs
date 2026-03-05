using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke;

public record DeleteKaraokeSongPickCommand(int Id) : IRequest<bool>;
