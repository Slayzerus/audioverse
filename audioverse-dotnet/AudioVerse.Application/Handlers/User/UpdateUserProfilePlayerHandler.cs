using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class UpdateUserProfilePlayerHandler : IRequestHandler<UpdateUserProfilePlayerCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IPlayerLinkSyncService _linkSyncService;

        public UpdateUserProfilePlayerHandler(IUserProfileRepository userProfileRepository, IPlayerLinkSyncService linkSyncService)
        {
            _userProfileRepository = userProfileRepository;
            _linkSyncService = linkSyncService;
        }

        public async Task<bool> Handle(UpdateUserProfilePlayerCommand request, CancellationToken cancellationToken)
        {
            var entity = await _userProfileRepository.GetPlayerByIdAsync(request.PlayerId);
            if (entity == null || entity.ProfileId != request.ProfileId) 
                return false;

            entity.Name = request.Name;
            entity.PreferredColors = request.PreferredColors;
            entity.FillPattern = request.FillPattern;
            entity.IsPrimary = request.IsMainPlayer;
            entity.Email = request.Email;
            entity.Icon = request.Icon;
            if (request.KaraokeSettings != null)
                entity.KaraokeSettings = request.KaraokeSettings;

            var result = await _userProfileRepository.UpdatePlayerAsync(entity);

            if (result)
                await _linkSyncService.SyncLinkedPlayersAsync(entity.Id);

            return result;
        }
    }
}
