using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Games;

namespace AudioVerse.Domain.Repositories
{
    public interface IEventRepository
    {
        // Events — paged
        Task<(IEnumerable<Event> Items, int TotalCount)> GetEventsPagedAsync(
            string? query, List<int>? organizerIds, List<Enums.Events.EventType>? types,
            List<Enums.EventStatus>? statuses, List<Enums.Events.EventVisibility>? visibilities,
            DateTime? startFrom, DateTime? startTo,
            int page, int pageSize, string? sortBy, bool descending);

        // Schedule
        Task<int> AddScheduleItemAsync(EventScheduleItem item);
        Task<EventScheduleItem?> GetScheduleItemByIdAsync(int id);
        Task<IEnumerable<EventScheduleItem>> GetScheduleByEventAsync(int eventId);
        Task<bool> UpdateScheduleItemAsync(EventScheduleItem item);
        Task<bool> DeleteScheduleItemAsync(int id);

        // Tabs
        Task<int> AddTabAsync(EventTab tab);
        Task<EventTab?> GetTabByIdAsync(int id);
        Task<IEnumerable<EventTab>> GetTabsByEventAsync(int eventId);
        Task<bool> UpdateTabAsync(EventTab tab);
        Task<bool> DeleteTabAsync(int id);

        // Menu
        Task<int> AddMenuItemAsync(EventMenuItem item);
        Task<EventMenuItem?> GetMenuItemByIdAsync(int id);
        Task<IEnumerable<EventMenuItem>> GetMenuByEventAsync(int eventId);
        Task<bool> UpdateMenuItemAsync(EventMenuItem item);
        Task<bool> DeleteMenuItemAsync(int id);

        // Attractions
        Task<int> AddAttractionAsync(EventAttraction item);
        Task<EventAttraction?> GetAttractionByIdAsync(int id);
        Task<IEnumerable<EventAttraction>> GetAttractionsByEventAsync(int eventId);
        Task<bool> UpdateAttractionAsync(EventAttraction item);
        Task<bool> DeleteAttractionAsync(int id);

        // Board games (global catalog)
        Task<int> AddBoardGameAsync(BoardGame game);
        Task<BoardGame?> GetBoardGameByIdAsync(int id);
        Task<IEnumerable<BoardGame>> GetAllBoardGamesAsync();
        Task<bool> UpdateBoardGameAsync(BoardGame game);
        Task<bool> DeleteBoardGameAsync(int id);

        // Event ? Board game
        Task<int> AddEventBoardGameAsync(EventBoardGameSession link);
        Task<IEnumerable<EventBoardGameSession>> GetEventBoardGamesAsync(int eventId);
        Task<bool> UpdateEventBoardGameAsync(EventBoardGameSession link);
        Task<bool> DeleteEventBoardGameAsync(int id);

        // Couch games (global catalog)
        Task<int> AddVideoGameAsync(VideoGame game);
        Task<VideoGame?> GetVideoGameByIdAsync(int id);
        Task<IEnumerable<VideoGame>> GetAllVideoGamesAsync();
        Task<bool> UpdateVideoGameAsync(VideoGame game);
        Task<bool> DeleteVideoGameAsync(int id);

        // Event ? Couch game
        Task<int> AddEventVideoGameAsync(EventVideoGameSession link);
        Task<IEnumerable<EventVideoGameSession>> GetEventVideoGamesAsync(int eventId);
        Task<bool> UpdateEventVideoGameAsync(EventVideoGameSession link);
        Task<bool> DeleteEventVideoGameAsync(int id);

        // Polls
        Task<int> CreatePollAsync(EventPoll poll);
        Task<EventPoll?> GetPollByIdAsync(int pollId);
        Task<EventPoll?> GetPollByTokenAsync(string token);
        Task<IEnumerable<EventPoll>> GetPollsByEventAsync(int eventId);
        Task<bool> UpdatePollAsync(EventPoll poll);
        Task<bool> DeletePollAsync(int pollId);
        Task<int> AddPollResponseAsync(EventPollResponse response);
        Task<IEnumerable<EventPollResponse>> GetPollResponsesAsync(int pollId);
        Task<int> AddPollOptionAsync(EventPollOption option);

        // Billing � Expenses
        Task<int> AddExpenseAsync(EventExpense expense);
        Task<EventExpense?> GetExpenseByIdAsync(int id);
        Task<IEnumerable<EventExpense>> GetExpensesByEventAsync(int eventId);
        Task<bool> UpdateExpenseAsync(EventExpense expense);
        Task<bool> DeleteExpenseAsync(int id);

        // Billing � Payments
        Task<int> AddPaymentAsync(EventPayment payment);
        Task<EventPayment?> GetPaymentByIdAsync(int id);
        Task<IEnumerable<EventPayment>> GetPaymentsByEventAsync(int eventId);
        Task<bool> UpdatePaymentAsync(EventPayment payment);
        Task<bool> DeletePaymentAsync(int id);
        Task<bool> ConfirmPaymentAsync(int paymentId, int confirmedByUserId);

        // Billing � Expense shares
        Task<IEnumerable<EventExpenseShare>> GetExpenseSharesByExpenseAsync(int expenseId);
        Task<IEnumerable<EventExpenseShare>> GetExpenseSharesByEventAsync(int eventId);
        Task<int> AddExpenseShareAsync(EventExpenseShare share);
        Task<bool> DeleteExpenseSharesByExpenseAsync(int expenseId);

        // Polls � options
        Task<IEnumerable<EventPollOption>> GetPollOptionsAsync(int pollId);
        Task<bool> DeletePollOptionsAsync(int pollId);

        // Search
        Task<IEnumerable<VideoGame>> SearchVideoGamesAsync(string query, int limit);

        // Photos
        Task<int> AddPhotoAsync(EventPhoto photo);
        Task<EventPhoto?> GetPhotoByIdAsync(int id);
        Task<IEnumerable<EventPhoto>> GetPhotosByEventAsync(int eventId);
        Task<IEnumerable<EventPhoto>> GetPhotoVersionsAsync(int originalId);
        Task<bool> DeletePhotoAsync(int id);

        // Videos
        Task<int> AddVideoAsync(EventVideo video);
        Task<EventVideo?> GetVideoByIdAsync(int id);
        Task<IEnumerable<EventVideo>> GetVideosByEventAsync(int eventId);
        Task<bool> DeleteVideoAsync(int id);

        // Media Tags (photos & videos)
        Task<int> AddMediaTagAsync(EventMediaTag tag);
        Task<IEnumerable<EventMediaTag>> GetMediaTagsByPhotoAsync(int photoId);
        Task<IEnumerable<EventMediaTag>> GetMediaTagsByVideoAsync(int videoId);
        Task<bool> DeleteMediaTagAsync(int id);

        // Invite Templates
        Task<int> AddInviteTemplateAsync(EventInviteTemplate template);
        Task<EventInviteTemplate?> GetInviteTemplateByIdAsync(int id);
        Task<IEnumerable<EventInviteTemplate>> GetInviteTemplatesByEventAsync(int eventId);
        Task<IEnumerable<EventInviteTemplate>> GetInviteTemplatesByOrganizationAsync(int orgId);
        Task<bool> UpdateInviteTemplateAsync(EventInviteTemplate template);
        Task<bool> DeleteInviteTemplateAsync(int id);

        // Bulk Invite Jobs
        Task<int> AddBulkInviteJobAsync(BulkInviteJob job);
        Task<BulkInviteJob?> GetBulkInviteJobByIdAsync(int id);
        Task<bool> UpdateBulkInviteJobAsync(BulkInviteJob job);

        // Media Collections
        Task<int> AddMediaCollectionAsync(EventMediaCollection collection);
        Task<EventMediaCollection?> GetMediaCollectionByIdAsync(int id);
        Task<IEnumerable<EventMediaCollection>> GetMediaCollectionsByEventAsync(int eventId);
        Task<bool> UpdateMediaCollectionAsync(EventMediaCollection collection);
        Task<bool> DeleteMediaCollectionAsync(int id);

        // Collages
        Task<int> AddCollageAsync(EventCollage collage);
        Task<EventCollage?> GetCollageByIdAsync(int id);
        Task<IEnumerable<EventCollage>> GetCollagesByEventAsync(int eventId);
        Task<bool> UpdateCollageAsync(EventCollage collage);
        Task<bool> DeleteCollageAsync(int id);
        Task<int> AddCollageItemAsync(EventCollageItem item);
        Task<bool> UpdateCollageItemAsync(EventCollageItem item);
        Task<bool> DeleteCollageItemAsync(int id);

        // Comments
        Task<int> AddCommentAsync(EventComment comment);
        Task<IEnumerable<EventComment>> GetCommentsByEventAsync(int eventId);
        Task<bool> DeleteCommentAsync(int id);

        // Date proposals
        Task<int> AddDateProposalAsync(EventDateProposal proposal);
        Task<IEnumerable<EventDateProposal>> GetDateProposalsByEventAsync(int eventId);
        Task<EventDateProposal?> GetDateProposalByIdAsync(int id);
        Task<bool> DeleteDateProposalAsync(int id);
        Task<int> UpsertDateVoteAsync(EventDateVote vote);
        Task<bool> DeleteDateVoteAsync(int proposalId, int userId);

        // Session game picks (voting)
        Task<int> AddGamePickAsync(EventSessionGamePick pick);
        Task<int> ImportGamePicksFromCollectionAsync(int eventId, int collectionId, bool boardGames);
        Task<IEnumerable<EventSessionGamePick>> GetGamePicksByEventAsync(int eventId);
        Task<bool> DeleteGamePickAsync(int id);
        Task<int> UpsertGameVoteAsync(EventSessionGameVote vote);
        Task<bool> DeleteGameVoteAsync(int pickId, int userId);

        // Session song picks (signup)
        Task<int> AddSongPickAsync(EventSessionSongPick pick);
        Task<int> ImportSongPicksFromPlaylistAsync(int eventId, int sessionId, int playlistId);
        Task<IEnumerable<EventSessionSongPick>> GetSongPicksBySessionAsync(int eventId, int sessionId);
        Task<bool> DeleteSongPickAsync(int id);
        Task<int> UpsertSongSignupAsync(EventSessionSongSignup signup);
        Task<bool> DeleteSongSignupAsync(int pickId, int userId);

        // Event by ID
        Task<Event?> GetEventByIdAsync(int id);
        Task<Event?> GetEventWithLocationAsync(int id);
        Task<bool> UpdateEventAsync(Event ev);
        Task<IEnumerable<Event>> GetPublicEventsFromAsync(DateTime fromDate, int limit);

        // Access
        Task<Event?> FindByAccessTokenAsync(string token);

        // Soft-delete
        Task<bool> SoftDeleteEventAsync(int eventId, int deletedByUserId, CancellationToken ct = default);
        Task<bool> RestoreEventAsync(int eventId, CancellationToken ct = default);

        // Contacts for bulk invites
        Task<IEnumerable<Domain.Entities.Contacts.Contact>> GetContactsByIdsAsync(IEnumerable<int> contactIds, CancellationToken ct = default);
        Task AddEventInviteAsync(Domain.Entities.Events.EventInvite invite, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);

        // ── Queryable access for dynamic filtering ──
        IQueryable<Event> GetEventsQueryable();

        // ── Organizers dropdown ──

        /// <summary>Get distinct organizers (Id + Name) across all events.</summary>
        Task<IEnumerable<(int Id, string Name)>> GetDistinctOrganizersAsync();

        // ── Event Participants (user-level) ──

        /// <summary>Add a user as participant to an event (RSVP).</summary>
        Task<int> AddParticipantAsync(EventParticipant participant, CancellationToken ct = default);

        /// <summary>Get participant record for a specific user in an event.</summary>
        Task<EventParticipant?> GetParticipantAsync(int eventId, int userId, CancellationToken ct = default);

        /// <summary>Get all participants for an event.</summary>
        Task<IEnumerable<EventParticipant>> GetParticipantsByEventAsync(int eventId, CancellationToken ct = default);

        /// <summary>Update participant status (e.g. Registered → Waiting → Inside).</summary>
        Task<bool> UpdateParticipantStatusAsync(int eventId, int userId, EventParticipantStatus status, CancellationToken ct = default);

        /// <summary>Remove participant from event (cancel RSVP).</summary>
        Task<bool> RemoveParticipantAsync(int eventId, int userId, CancellationToken ct = default);
    }
}
