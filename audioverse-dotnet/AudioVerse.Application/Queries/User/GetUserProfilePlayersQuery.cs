using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    public record GetUserProfilePlayersQuery(int ProfileId) : IRequest<List<UserProfilePlayerDto>>;
}
