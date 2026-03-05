using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>
    /// Weryfikuje credentials drugiego profilu i zwraca listę jego graczy do zlinkowania.
    /// </summary>
    public class SearchPlayersForLinkHandler : IRequestHandler<SearchPlayersForLinkCommand, List<LinkCandidatePlayerDto>>
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly IUserProfileRepository _userProfileRepository;

        public SearchPlayersForLinkHandler(UserManager<UserProfile> userManager, IUserProfileRepository userProfileRepository)
        {
            _userManager = userManager;
            _userProfileRepository = userProfileRepository;
        }

        public async Task<List<LinkCandidatePlayerDto>> Handle(SearchPlayersForLinkCommand request, CancellationToken cancellationToken)
        {
            var sourcePlayer = await _userProfileRepository.GetPlayerByIdAsync(request.SourcePlayerId);
            if (sourcePlayer == null || sourcePlayer.ProfileId != request.SourceProfileId)
                return [];

            var targetUser = await _userManager.FindByNameAsync(request.Login);
            if (targetUser == null)
                return [];

            var isPasswordValid = await _userManager.CheckPasswordAsync(targetUser, request.Password);
            if (!isPasswordValid)
                return [];

            if (targetUser.Id == request.SourceProfileId)
                return [];

            var players = await _userProfileRepository.GetPlayersByUserAsync(targetUser.Id);

            return players.Select(p => new LinkCandidatePlayerDto
            {
                PlayerId = p.Id,
                PlayerName = p.Name,
                IsPrimary = p.IsPrimary,
                PreferredColors = p.PreferredColors
            }).ToList();
        }
    }
}
