using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record UpdateSoundfontCommand(Soundfont Soundfont) : IRequest<bool>;
