using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetAttractionByIdQuery(int Id) : IRequest<EventAttraction?>;
}
