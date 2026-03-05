using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio;

public record UploadSoundfontFilesCommand(int SoundfontId, List<SoundfontFileUpload> Files, SoundfontFileType FileType) : IRequest<UploadSoundfontFilesResult?>;
