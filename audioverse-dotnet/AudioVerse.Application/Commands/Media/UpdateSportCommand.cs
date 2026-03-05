using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing sport activity.</summary>
public record UpdateSportCommand(SportActivity Sport) : IRequest<bool>;
