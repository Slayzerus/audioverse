using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record GetSoundfontFileDownloadUrlQuery(int FileId) : IRequest<string?>;
