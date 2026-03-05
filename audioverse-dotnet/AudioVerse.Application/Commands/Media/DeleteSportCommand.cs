using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a sport activity by ID.</summary>
public record DeleteSportCommand(int Id) : IRequest<bool>;
