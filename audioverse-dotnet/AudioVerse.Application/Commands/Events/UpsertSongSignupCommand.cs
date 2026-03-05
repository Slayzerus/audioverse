using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpsertSongSignupCommand(EventSessionSongSignup Signup) : IRequest<int>;
