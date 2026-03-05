using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record SoundfontFileUpload(string FileName, string ContentType, long SizeBytes, System.IO.Stream Stream);
