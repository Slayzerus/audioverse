using AudioVerse.Application.Models.Utils;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Application.Services.Utils;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class ClassifyByParamsHandler(IDanceClassificationService svc) : IRequestHandler<ClassifyByParamsQuery, List<DanceClassificationResult>>
{
    public Task<List<DanceClassificationResult>> Handle(ClassifyByParamsQuery request, CancellationToken ct)
        => Task.FromResult(svc.ClassifyByParams(request.Bpm, request.TimeSignature, request.Energy, request.Valence));
}
