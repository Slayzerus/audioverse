using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<(string NewAccessToken, string NewRefreshToken)>;
}
