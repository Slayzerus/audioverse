using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetCollageByIdQuery(int Id) : IRequest<EventCollage?>;
