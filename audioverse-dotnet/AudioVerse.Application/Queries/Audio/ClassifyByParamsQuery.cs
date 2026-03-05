using AudioVerse.Application.Models.Utils;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record ClassifyByParamsQuery(decimal Bpm, int TimeSignature = 4, decimal? Energy = null, decimal? Valence = null) : IRequest<List<DanceClassificationResult>>;
