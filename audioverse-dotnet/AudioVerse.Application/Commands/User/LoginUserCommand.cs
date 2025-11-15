using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record LoginUserCommand(string Username, string Password) : IRequest<(string accessToken, string refreshToken)>;
}
