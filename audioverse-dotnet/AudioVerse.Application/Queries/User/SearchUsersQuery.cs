using MediatR;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Queries.User
{
    public record SearchUsersQuery(string Term) : IRequest<IEnumerable<UserProfile>>;
}
