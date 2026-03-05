using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ApplyFilterToEventPhotoCommand(int PhotoId, string[] Filters, int? UserId) : IRequest<ApplyFilterToEventPhotoResult?>;
