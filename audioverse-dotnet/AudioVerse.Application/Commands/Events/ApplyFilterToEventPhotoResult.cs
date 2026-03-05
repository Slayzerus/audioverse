using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ApplyFilterToEventPhotoResult(int NewPhotoId, int OriginalId, string ObjectKey, string[] AppliedFilters);
