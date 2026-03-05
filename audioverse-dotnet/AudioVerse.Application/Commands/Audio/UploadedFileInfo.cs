using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record UploadedFileInfo(int Id, string FileName, string StorageKey, long SizeBytes, string Sha256);
