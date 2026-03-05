using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record GetSoundfontFilesQuery(int SoundfontId) : IRequest<IEnumerable<SoundfontFile>>;
