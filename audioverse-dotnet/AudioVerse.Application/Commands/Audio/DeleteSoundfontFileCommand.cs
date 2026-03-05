using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record DeleteSoundfontFileCommand(int FileId) : IRequest<bool>;
