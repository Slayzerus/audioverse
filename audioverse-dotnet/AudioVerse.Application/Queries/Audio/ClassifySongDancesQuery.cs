using AudioVerse.Application.Models.Utils;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record ClassifySongDancesQuery(int SongId) : IRequest<List<DanceClassificationResult>>;
