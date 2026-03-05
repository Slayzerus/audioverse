using AudioVerse.Application.Models.Utils;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Application.Services.Utils;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class ClassifySongDancesHandler(IDanceClassificationService svc) : IRequestHandler<ClassifySongDancesQuery, List<DanceClassificationResult>>
{
    public Task<List<DanceClassificationResult>> Handle(ClassifySongDancesQuery request, CancellationToken ct)
        => svc.ClassifySongAsync(request.SongId, ct);
}
