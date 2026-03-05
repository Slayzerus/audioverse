using MediatR;
using AudioVerse.Application.Models.Requests.Admin;

namespace AudioVerse.Application.Commands.Admin
{
    public record SaveScoringPresetsCommand(ScoringPresetsRequest Presets, int? ModifiedByUserId, string? ModifiedByUsername) : IRequest<bool>;
}
