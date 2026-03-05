using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record GetSoundfontByIdQuery(int Id) : IRequest<Soundfont?>;
