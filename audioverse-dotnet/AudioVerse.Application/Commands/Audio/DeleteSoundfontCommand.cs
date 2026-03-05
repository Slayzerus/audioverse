using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record DeleteSoundfontCommand(int Id) : IRequest<bool>;
