using MediatR;
using AudioVerse.Domain.Entities;

namespace AudioVerse.Application.Commands.User
{
    public record RegisterUserCommand(string Username, string Email, string Password) : IRequest<int>;
}
