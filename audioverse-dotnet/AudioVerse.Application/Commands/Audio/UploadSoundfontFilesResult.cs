using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record UploadSoundfontFilesResult(int SoundfontId, int FilesUploaded, List<UploadedFileInfo> Files);
