using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Handlers.User
{
    public class SearchUsersHandler : IRequestHandler<SearchUsersQuery, IEnumerable<UserProfile>>
    {
        private readonly IUserProfileRepository _repo;
        public SearchUsersHandler(IUserProfileRepository repo) { _repo = repo; }

        public async Task<IEnumerable<UserProfile>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Term) || request.Term.Length < 3) return new List<UserProfile>();
            var term = request.Term.ToLower();
            return await _repo.SearchUsersAsync(request.Term, 20);
        }
    }
}
