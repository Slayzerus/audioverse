using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    public record GetUserProfilePlayerByIdQuery(int PlayerId) : IRequest<UserProfilePlayerDto?>;
}
