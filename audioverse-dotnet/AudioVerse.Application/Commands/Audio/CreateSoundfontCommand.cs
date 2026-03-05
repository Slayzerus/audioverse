using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record CreateSoundfontCommand(Soundfont Soundfont) : IRequest<int>;
