using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories
{
    public class EventRepositoryEF : IEventRepository
    {
        private readonly AudioVerseDbContext _db;
        public EventRepositoryEF(AudioVerseDbContext db) { _db = db; }

        // ── Events paged ──

        public async Task<(IEnumerable<Event> Items, int TotalCount)> GetEventsPagedAsync(
            string? query, List<int>? organizerIds, List<AudioVerse.Domain.Enums.Events.EventType>? types,
            List<AudioVerse.Domain.Enums.EventStatus>? statuses, List<AudioVerse.Domain.Enums.Events.EventVisibility>? visibilities,
            DateTime? startFrom, DateTime? startTo,
            int page, int pageSize, string? sortBy, bool descending)
        {
            var q = _db.Events.AsQueryable();

            // Filtrowanie po soft delete
            if (query != null && query.Contains("isDeleted=false"))
                q = q.Where(e => !e.IsDeleted);
            // Filtrowanie po niepustej nazwie
            if (query != null && query.Contains("titleNotEmpty=true"))
                q = q.Where(e => !string.IsNullOrWhiteSpace(e.Title));

            // Standardowe filtrowanie po fragmencie nazwy/opisu
            if (!string.IsNullOrWhiteSpace(query) && !query.Contains("isDeleted") && !query.Contains("titleNotEmpty"))
                q = q.Where(e => e.Title.Contains(query) || (e.Description != null && e.Description.Contains(query)));
            if (organizerIds is { Count: > 0 })
                q = q.Where(e => e.OrganizerId.HasValue && organizerIds.Contains(e.OrganizerId.Value));
            if (types is { Count: > 0 })
                q = q.Where(e => types.Contains(e.Type));
            if (statuses is { Count: > 0 })
                q = q.Where(e => statuses.Contains(e.Status));
            if (visibilities is { Count: > 0 })
                q = q.Where(e => visibilities.Contains(e.Visibility));
            if (startFrom.HasValue)
                q = q.Where(e => e.StartTime >= startFrom.Value);
            if (startTo.HasValue)
                q = q.Where(e => e.StartTime <= startTo.Value);

            var total = await q.CountAsync();

            q = (sortBy?.ToLowerInvariant()) switch
            {
                "title" or "name" => descending ? q.OrderByDescending(e => e.Title) : q.OrderBy(e => e.Title),
                "organizerid" => descending ? q.OrderByDescending(e => e.OrganizerId) : q.OrderBy(e => e.OrganizerId),
                "type" => descending ? q.OrderByDescending(e => e.Type) : q.OrderBy(e => e.Type),
                _ => descending ? q.OrderByDescending(e => e.StartTime) : q.OrderBy(e => e.StartTime),
            };

            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, total);
        }

        // ── Schedule ──

        public async Task<int> AddScheduleItemAsync(EventScheduleItem item)
        {
            _db.EventScheduleItems.Add(item);
            await _db.SaveChangesAsync();
            return item.Id;
        }

        public async Task<EventScheduleItem?> GetScheduleItemByIdAsync(int id)
            => await _db.EventScheduleItems.FindAsync(id);

        public async Task<IEnumerable<EventScheduleItem>> GetScheduleByEventAsync(int eventId)
            => await _db.EventScheduleItems.Where(s => s.EventId == eventId).OrderBy(s => s.SortOrder).ThenBy(s => s.StartTime).ToListAsync();

        public async Task<bool> UpdateScheduleItemAsync(EventScheduleItem item)
        {
            var e = await _db.EventScheduleItems.FindAsync(item.Id);
            if (e == null) return false;
            e.Title = item.Title; e.Description = item.Description; e.StartTime = item.StartTime;
            e.EndTime = item.EndTime; e.Category = item.Category; e.Location = item.Location; e.SortOrder = item.SortOrder;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteScheduleItemAsync(int id)
        {
            var e = await _db.EventScheduleItems.FindAsync(id);
            if (e == null) return false;
            _db.EventScheduleItems.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Tabs ──

        public async Task<int> AddTabAsync(EventTab tab)
        {
            _db.EventTabs.Add(tab);
            await _db.SaveChangesAsync();
            return tab.Id;
        }

        public async Task<EventTab?> GetTabByIdAsync(int id)
            => await _db.EventTabs.FindAsync(id);

        public async Task<IEnumerable<EventTab>> GetTabsByEventAsync(int eventId)
            => await _db.EventTabs.Where(t => t.EventId == eventId).OrderBy(t => t.SortOrder).ToListAsync();

        public async Task<bool> UpdateTabAsync(EventTab tab)
        {
            _db.EventTabs.Update(tab);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTabAsync(int id)
        {
            var t = await _db.EventTabs.FindAsync(id);
            if (t == null) return false;
            _db.EventTabs.Remove(t);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Menu ──

        public async Task<int> AddMenuItemAsync(EventMenuItem item)
        {
            _db.EventMenuItems.Add(item);
            await _db.SaveChangesAsync();
            return item.Id;
        }

        public async Task<EventMenuItem?> GetMenuItemByIdAsync(int id)
            => await _db.EventMenuItems.FindAsync(id);

        public async Task<IEnumerable<EventMenuItem>> GetMenuByEventAsync(int eventId)
            => await _db.EventMenuItems.Where(m => m.EventId == eventId).ToListAsync();

        public async Task<bool> UpdateMenuItemAsync(EventMenuItem item)
        {
            var e = await _db.EventMenuItems.FindAsync(item.Id);
            if (e == null) return false;
            e.Name = item.Name; e.Description = item.Description; e.Category = item.Category;
            e.Price = item.Price; e.IsAvailable = item.IsAvailable; e.ImageKey = item.ImageKey;
            e.Allergens = item.Allergens; e.IsVegetarian = item.IsVegetarian; e.IsVegan = item.IsVegan;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMenuItemAsync(int id)
        {
            var e = await _db.EventMenuItems.FindAsync(id);
            if (e == null) return false;
            _db.EventMenuItems.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? Attractions ??

        public async Task<int> AddAttractionAsync(EventAttraction item)
        {
            _db.EventAttractions.Add(item);
            await _db.SaveChangesAsync();
            return item.Id;
        }

        public async Task<EventAttraction?> GetAttractionByIdAsync(int id)
            => await _db.EventAttractions.FindAsync(id);

        public async Task<IEnumerable<EventAttraction>> GetAttractionsByEventAsync(int eventId)
            => await _db.EventAttractions.Where(a => a.EventId == eventId).ToListAsync();

        public async Task<bool> UpdateAttractionAsync(EventAttraction item)
        {
            var e = await _db.EventAttractions.FindAsync(item.Id);
            if (e == null) return false;
            e.Name = item.Name; e.Description = item.Description; e.Type = item.Type;
            e.Location = item.Location; e.Capacity = item.Capacity; e.IsActive = item.IsActive; e.ImageKey = item.ImageKey;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAttractionAsync(int id)
        {
            var e = await _db.EventAttractions.FindAsync(id);
            if (e == null) return false;
            _db.EventAttractions.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? BoardGame (global) ??

        public async Task<int> AddBoardGameAsync(BoardGame game)
        {
            _db.BoardGames.Add(game);
            await _db.SaveChangesAsync();
            return game.Id;
        }

        public async Task<BoardGame?> GetBoardGameByIdAsync(int id) => await _db.BoardGames.FindAsync(id);
        public async Task<IEnumerable<BoardGame>> GetAllBoardGamesAsync() => await _db.BoardGames.ToListAsync();

        public async Task<bool> UpdateBoardGameAsync(BoardGame game)
        {
            var e = await _db.BoardGames.FindAsync(game.Id);
            if (e == null) return false;
            e.Name = game.Name; e.Description = game.Description; e.MinPlayers = game.MinPlayers;
            e.MaxPlayers = game.MaxPlayers; e.EstimatedDurationMinutes = game.EstimatedDurationMinutes;
            e.Genre = game.Genre; e.ImageKey = game.ImageKey; e.OwnerId = game.OwnerId;
            e.BggId = game.BggId; e.BggImageUrl = game.BggImageUrl;
            e.BggRating = game.BggRating; e.BggYearPublished = game.BggYearPublished;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteBoardGameAsync(int id)
        {
            var e = await _db.BoardGames.FindAsync(id);
            if (e == null) return false;
            _db.BoardGames.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? EventBoardGame ??

        public async Task<int> AddEventBoardGameAsync(EventBoardGameSession link)
        {
            _db.EventBoardGames.Add(link);
            await _db.SaveChangesAsync();
            return link.Id;
        }

        public async Task<IEnumerable<EventBoardGameSession>> GetEventBoardGamesAsync(int eventId)
            => await _db.EventBoardGames.Include(e => e.BoardGame).Where(e => e.EventId == eventId).ToListAsync();

        public async Task<bool> UpdateEventBoardGameAsync(EventBoardGameSession link)
        {
            var e = await _db.EventBoardGames.FindAsync(link.Id);
            if (e == null) return false;
            e.CopyCount = link.CopyCount; e.Location = link.Location; e.Status = link.Status;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEventBoardGameAsync(int id)
        {
            var e = await _db.EventBoardGames.FindAsync(id);
            if (e == null) return false;
            _db.EventBoardGames.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? VideoGame (global) ??

        public async Task<int> AddVideoGameAsync(VideoGame game)
        {
            _db.VideoGames.Add(game);
            await _db.SaveChangesAsync();
            return game.Id;
        }

        public async Task<VideoGame?> GetVideoGameByIdAsync(int id) => await _db.VideoGames.FindAsync(id);
        public async Task<IEnumerable<VideoGame>> GetAllVideoGamesAsync() => await _db.VideoGames.ToListAsync();

        public async Task<bool> UpdateVideoGameAsync(VideoGame game)
        {
            var e = await _db.VideoGames.FindAsync(game.Id);
            if (e == null) return false;
            e.Name = game.Name; e.Description = game.Description; e.Platform = game.Platform;
            e.MinPlayers = game.MinPlayers; e.MaxPlayers = game.MaxPlayers;
            e.Genre = game.Genre; e.ImageKey = game.ImageKey; e.IsLocal = game.IsLocal; e.IsOnline = game.IsOnline;
            e.SteamAppId = game.SteamAppId; e.SteamHeaderImageUrl = game.SteamHeaderImageUrl;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVideoGameAsync(int id)
        {
            var e = await _db.VideoGames.FindAsync(id);
            if (e == null) return false;
            _db.VideoGames.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? EventVideoGame ??

        public async Task<int> AddEventVideoGameAsync(EventVideoGameSession link)
        {
            _db.EventVideoGames.Add(link);
            await _db.SaveChangesAsync();
            return link.Id;
        }

        public async Task<IEnumerable<EventVideoGameSession>> GetEventVideoGamesAsync(int eventId)
            => await _db.EventVideoGames.Include(e => e.VideoGame).Where(e => e.EventId == eventId).ToListAsync();

        public async Task<bool> UpdateEventVideoGameAsync(EventVideoGameSession link)
        {
            var e = await _db.EventVideoGames.FindAsync(link.Id);
            if (e == null) return false;
            e.Station = link.Station; e.Status = link.Status;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEventVideoGameAsync(int id)
        {
            var e = await _db.EventVideoGames.FindAsync(id);
            if (e == null) return false;
            _db.EventVideoGames.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? Polls ??

        public async Task<int> CreatePollAsync(EventPoll poll)
        {
            // auto-generate YesNo options
            if (poll.Type == EventPollType.YesNo && poll.Options.Count == 0)
            {
                poll.Options.Add(new EventPollOption { Text = "Tak", SortOrder = 0 });
                poll.Options.Add(new EventPollOption { Text = "Nie", SortOrder = 1 });
            }
            _db.EventPolls.Add(poll);
            await _db.SaveChangesAsync();
            return poll.Id;
        }

        public async Task<EventPoll?> GetPollByIdAsync(int pollId)
            => await _db.EventPolls.Include(p => p.Options.OrderBy(o => o.SortOrder))
                                   .Include(p => p.Responses).ThenInclude(r => r.Option)
                                   .FirstOrDefaultAsync(p => p.Id == pollId);

        public async Task<EventPoll?> GetPollByTokenAsync(string token)
            => await _db.EventPolls.Include(p => p.Options.OrderBy(o => o.SortOrder))
                                   .FirstOrDefaultAsync(p => p.Token == token);

        public async Task<IEnumerable<EventPoll>> GetPollsByEventAsync(int eventId)
            => await _db.EventPolls.Include(p => p.Options.OrderBy(o => o.SortOrder))
                                   .Where(p => p.EventId == eventId)
                                   .OrderByDescending(p => p.CreatedAt)
                                   .ToListAsync();

        public async Task<bool> UpdatePollAsync(EventPoll poll)
        {
            var e = await _db.EventPolls.FindAsync(poll.Id);
            if (e == null) return false;
            e.Title = poll.Title; e.Description = poll.Description;
            e.IsActive = poll.IsActive; e.ExpiresAt = poll.ExpiresAt;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePollAsync(int pollId)
        {
            var e = await _db.EventPolls.FindAsync(pollId);
            if (e == null) return false;
            _db.EventPolls.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> AddPollResponseAsync(EventPollResponse response)
        {
            _db.EventPollResponses.Add(response);
            await _db.SaveChangesAsync();
            return response.Id;
        }

        public async Task<IEnumerable<EventPollResponse>> GetPollResponsesAsync(int pollId)
            => await _db.EventPollResponses.Include(r => r.Option)
                                           .Where(r => r.PollId == pollId)
                                           .OrderBy(r => r.RespondedAt)
                                           .ToListAsync();

        public async Task<int> AddPollOptionAsync(EventPollOption option)
        {
            _db.EventPollOptions.Add(option);
            await _db.SaveChangesAsync();
            return option.Id;
        }

        // ?? Billing � Expenses ??

        public async Task<int> AddExpenseAsync(EventExpense expense)
        {
            _db.EventExpenses.Add(expense);
            await _db.SaveChangesAsync();
            return expense.Id;
        }

        public async Task<EventExpense?> GetExpenseByIdAsync(int id)
            => await _db.EventExpenses.Include(e => e.Shares).FirstOrDefaultAsync(e => e.Id == id);

        public async Task<IEnumerable<EventExpense>> GetExpensesByEventAsync(int eventId)
            => await _db.EventExpenses.Include(e => e.Shares)
                .Where(e => e.EventId == eventId).OrderByDescending(e => e.CreatedAt).ToListAsync();

        public async Task<bool> UpdateExpenseAsync(EventExpense expense)
        {
            var e = await _db.EventExpenses.FindAsync(expense.Id);
            if (e == null) return false;
            e.Title = expense.Title; e.Description = expense.Description;
            e.Category = expense.Category; e.Amount = expense.Amount;
            e.SplitMethod = expense.SplitMethod; e.PaidByUserId = expense.PaidByUserId;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteExpenseAsync(int id)
        {
            var e = await _db.EventExpenses.FindAsync(id);
            if (e == null) return false;
            _db.EventExpenses.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // ?? Billing � Payments ??

        public async Task<int> AddPaymentAsync(EventPayment payment)
        {
            _db.EventPayments.Add(payment);
            await _db.SaveChangesAsync();
            return payment.Id;
        }

        public async Task<EventPayment?> GetPaymentByIdAsync(int id)
            => await _db.EventPayments.FindAsync(id);

        public async Task<IEnumerable<EventPayment>> GetPaymentsByEventAsync(int eventId)
            => await _db.EventPayments.Where(p => p.EventId == eventId).OrderByDescending(p => p.PaidAt).ToListAsync();

        public async Task<bool> UpdatePaymentAsync(EventPayment payment)
        {
            var e = await _db.EventPayments.FindAsync(payment.Id);
            if (e == null) return false;
            e.Amount = payment.Amount; e.Method = payment.Method;
            e.Status = payment.Status; e.Reference = payment.Reference;
            e.Note = payment.Note; e.ConfirmedByUserId = payment.ConfirmedByUserId;
            e.ConfirmedAt = payment.ConfirmedAt;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePaymentAsync(int id)
        {
            var e = await _db.EventPayments.FindAsync(id);
            if (e == null) return false;
            _db.EventPayments.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ConfirmPaymentAsync(int paymentId, int confirmedByUserId)
        {
            var p = await _db.EventPayments.FindAsync(paymentId);
            if (p == null) return false;
            p.Status = Domain.Enums.PaymentStatus.Confirmed;
            p.ConfirmedByUserId = confirmedByUserId;
            p.ConfirmedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<EventExpenseShare>> GetExpenseSharesByExpenseAsync(int expenseId)
            => await _db.EventExpenseShares.Where(s => s.ExpenseId == expenseId).ToListAsync();

        public async Task<IEnumerable<EventExpenseShare>> GetExpenseSharesByEventAsync(int eventId)
        {
            var expenseIds = await _db.EventExpenses.Where(e => e.EventId == eventId).Select(e => e.Id).ToListAsync();
            return await _db.EventExpenseShares.Where(s => expenseIds.Contains(s.ExpenseId)).ToListAsync();
        }

        public async Task<int> AddExpenseShareAsync(EventExpenseShare share)
        {
            _db.EventExpenseShares.Add(share);
            await _db.SaveChangesAsync();
            return share.Id;
        }

        public async Task<bool> DeleteExpenseSharesByExpenseAsync(int expenseId)
        {
            var shares = await _db.EventExpenseShares.Where(s => s.ExpenseId == expenseId).ToListAsync();
            _db.EventExpenseShares.RemoveRange(shares);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<EventPollOption>> GetPollOptionsAsync(int pollId)
            => await _db.EventPollOptions.Where(o => o.PollId == pollId).ToListAsync();

        public async Task<bool> DeletePollOptionsAsync(int pollId)
        {
            var opts = await _db.EventPollOptions.Where(o => o.PollId == pollId).ToListAsync();
            _db.EventPollOptions.RemoveRange(opts);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<VideoGame>> SearchVideoGamesAsync(string query, int limit)
            => await _db.VideoGames.Where(g => g.Name.Contains(query)).Take(limit).ToListAsync();

        // ── Photos ──

        public async Task<int> AddPhotoAsync(EventPhoto photo)
        {
            _db.EventPhotos.Add(photo);
            await _db.SaveChangesAsync();
            return photo.Id;
        }

        public async Task<EventPhoto?> GetPhotoByIdAsync(int id)
            => await _db.EventPhotos.FirstOrDefaultAsync(p => p.Id == id);

        public async Task<IEnumerable<EventPhoto>> GetPhotosByEventAsync(int eventId)
            => await _db.EventPhotos.Where(p => p.EventId == eventId).OrderByDescending(p => p.CreatedAt).ToListAsync();

        public async Task<IEnumerable<EventPhoto>> GetPhotoVersionsAsync(int originalId)
            => await _db.EventPhotos
                .Where(p => p.OriginalId == originalId || p.Id == originalId)
                .OrderBy(p => p.CreatedAt)
                .ToListAsync();

        public async Task<bool> DeletePhotoAsync(int id)
        {
            var p = await _db.EventPhotos.FindAsync(id);
            if (p == null) return false;
            _db.EventPhotos.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Videos ──

        public async Task<int> AddVideoAsync(EventVideo video)
        {
            _db.EventVideos.Add(video);
            await _db.SaveChangesAsync();
            return video.Id;
        }

        public async Task<EventVideo?> GetVideoByIdAsync(int id)
            => await _db.EventVideos.FirstOrDefaultAsync(v => v.Id == id);

        public async Task<IEnumerable<EventVideo>> GetVideosByEventAsync(int eventId)
            => await _db.EventVideos.Where(v => v.EventId == eventId).OrderByDescending(v => v.CreatedAt).ToListAsync();

        public async Task<bool> DeleteVideoAsync(int id)
        {
            var v = await _db.EventVideos.FindAsync(id);
            if (v == null) return false;
            _db.EventVideos.Remove(v);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Media Tags ──

        public async Task<int> AddMediaTagAsync(EventMediaTag tag)
        {
            _db.EventMediaTags.Add(tag);
            await _db.SaveChangesAsync();
            return tag.Id;
        }

        public async Task<IEnumerable<EventMediaTag>> GetMediaTagsByPhotoAsync(int photoId)
            => await _db.EventMediaTags.Where(t => t.PhotoId == photoId).ToListAsync();

        public async Task<IEnumerable<EventMediaTag>> GetMediaTagsByVideoAsync(int videoId)
            => await _db.EventMediaTags.Where(t => t.VideoId == videoId).ToListAsync();

        public async Task<bool> DeleteMediaTagAsync(int id)
        {
            var t = await _db.EventMediaTags.FindAsync(id);
            if (t == null) return false;
            _db.EventMediaTags.Remove(t);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Invite Templates ──

        public async Task<int> AddInviteTemplateAsync(EventInviteTemplate template)
        {
            _db.EventInviteTemplates.Add(template);
            await _db.SaveChangesAsync();
            return template.Id;
        }

        public async Task<EventInviteTemplate?> GetInviteTemplateByIdAsync(int id)
            => await _db.EventInviteTemplates.FirstOrDefaultAsync(t => t.Id == id);

        public async Task<IEnumerable<EventInviteTemplate>> GetInviteTemplatesByEventAsync(int eventId)
            => await _db.EventInviteTemplates.Where(t => t.EventId == eventId).ToListAsync();

        public async Task<IEnumerable<EventInviteTemplate>> GetInviteTemplatesByOrganizationAsync(int orgId)
            => await _db.EventInviteTemplates.Where(t => t.OrganizationId == orgId).ToListAsync();

        public async Task<bool> UpdateInviteTemplateAsync(EventInviteTemplate template)
        {
            _db.EventInviteTemplates.Update(template);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteInviteTemplateAsync(int id)
        {
            var t = await _db.EventInviteTemplates.FindAsync(id);
            if (t == null) return false;
            _db.EventInviteTemplates.Remove(t);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Bulk Invite Jobs ──

        public async Task<int> AddBulkInviteJobAsync(BulkInviteJob job)
        {
            _db.BulkInviteJobs.Add(job);
            await _db.SaveChangesAsync();
            return job.Id;
        }

        public async Task<BulkInviteJob?> GetBulkInviteJobByIdAsync(int id)
            => await _db.BulkInviteJobs.Include(j => j.Template).FirstOrDefaultAsync(j => j.Id == id);

        public async Task<bool> UpdateBulkInviteJobAsync(BulkInviteJob job)
        {
            _db.BulkInviteJobs.Update(job);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Media Collections ──

        public async Task<int> AddMediaCollectionAsync(EventMediaCollection collection)
        {
            _db.EventMediaCollections.Add(collection);
            await _db.SaveChangesAsync();
            return collection.Id;
        }

        public async Task<EventMediaCollection?> GetMediaCollectionByIdAsync(int id)
            => await _db.EventMediaCollections
                .Include(c => c.Photos)
                .Include(c => c.Videos)
                .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<IEnumerable<EventMediaCollection>> GetMediaCollectionsByEventAsync(int eventId)
            => await _db.EventMediaCollections
                .Where(c => c.EventId == eventId)
                .OrderBy(c => c.OrderNumber)
                .ToListAsync();

        public async Task<bool> UpdateMediaCollectionAsync(EventMediaCollection collection)
        {
            _db.EventMediaCollections.Update(collection);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMediaCollectionAsync(int id)
        {
            var c = await _db.EventMediaCollections.FindAsync(id);
            if (c == null) return false;
            _db.EventMediaCollections.Remove(c);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Collages ──

        public async Task<int> AddCollageAsync(EventCollage collage)
        {
            _db.EventCollages.Add(collage);
            await _db.SaveChangesAsync();
            return collage.Id;
        }

        public async Task<EventCollage?> GetCollageByIdAsync(int id)
            => await _db.EventCollages
                .Include(c => c.Items).ThenInclude(i => i.Photo)
                .Include(c => c.Items).ThenInclude(i => i.Video)
                .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<IEnumerable<EventCollage>> GetCollagesByEventAsync(int eventId)
            => await _db.EventCollages
                .Where(c => c.EventId == eventId)
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();

        public async Task<bool> UpdateCollageAsync(EventCollage collage)
        {
            _db.EventCollages.Update(collage);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCollageAsync(int id)
        {
            var c = await _db.EventCollages.FindAsync(id);
            if (c == null) return false;
            _db.EventCollages.Remove(c);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> AddCollageItemAsync(EventCollageItem item)
        {
            _db.EventCollageItems.Add(item);
            await _db.SaveChangesAsync();
            return item.Id;
        }

        public async Task<bool> UpdateCollageItemAsync(EventCollageItem item)
        {
            _db.EventCollageItems.Update(item);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCollageItemAsync(int id)
        {
            var i = await _db.EventCollageItems.FindAsync(id);
            if (i == null) return false;
            _db.EventCollageItems.Remove(i);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Comments ──

        public async Task<int> AddCommentAsync(EventComment comment)
        {
            _db.EventComments.Add(comment);
            await _db.SaveChangesAsync();
            return comment.Id;
        }

        public async Task<IEnumerable<EventComment>> GetCommentsByEventAsync(int eventId)
            => await _db.EventComments
                .Where(c => c.EventId == eventId && c.ParentId == null)
                .Include(c => c.Replies)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

        public async Task<bool> DeleteCommentAsync(int id)
        {
            var c = await _db.EventComments.FindAsync(id);
            if (c == null) return false;
            _db.EventComments.Remove(c);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Date proposals ──

        public async Task<int> AddDateProposalAsync(EventDateProposal proposal)
        {
            _db.EventDateProposals.Add(proposal);
            await _db.SaveChangesAsync();
            return proposal.Id;
        }

        public async Task<IEnumerable<EventDateProposal>> GetDateProposalsByEventAsync(int eventId) =>
            await _db.EventDateProposals
                .Where(p => p.EventId == eventId)
                .Include(p => p.Votes)
                .OrderBy(p => p.ProposedStart)
                .ToListAsync();

        public async Task<EventDateProposal?> GetDateProposalByIdAsync(int id) =>
            await _db.EventDateProposals
                .Include(p => p.Votes)
                .FirstOrDefaultAsync(p => p.Id == id);

        public async Task<bool> DeleteDateProposalAsync(int id)
        {
            var p = await _db.EventDateProposals.FindAsync(id);
            if (p == null) return false;
            _db.EventDateProposals.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> UpsertDateVoteAsync(EventDateVote vote)
        {
            var existing = await _db.EventDateVotes
                .FirstOrDefaultAsync(v => v.ProposalId == vote.ProposalId && v.UserId == vote.UserId);
            if (existing != null)
            {
                existing.Status = vote.Status;
                existing.Comment = vote.Comment;
                existing.VotedAt = DateTime.UtcNow;
            }
            else
            {
                _db.EventDateVotes.Add(vote);
            }
            await _db.SaveChangesAsync();
            return existing?.Id ?? vote.Id;
        }

        public async Task<bool> DeleteDateVoteAsync(int proposalId, int userId)
        {
            var v = await _db.EventDateVotes
                .FirstOrDefaultAsync(x => x.ProposalId == proposalId && x.UserId == userId);
            if (v == null) return false;
            _db.EventDateVotes.Remove(v);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Session game picks ──

        public async Task<int> AddGamePickAsync(EventSessionGamePick pick)
        {
            _db.EventSessionGamePicks.Add(pick);
            await _db.SaveChangesAsync();
            return pick.Id;
        }

        public async Task<int> ImportGamePicksFromCollectionAsync(int eventId, int collectionId, bool boardGames)
        {
            int count = 0;
            if (boardGames)
            {
                var items = await _db.Set<Domain.Entities.Games.BoardGameCollectionBoardGame>()
                    .Where(i => i.CollectionId == collectionId)
                    .Include(i => i.BoardGame)
                    .ToListAsync();
                foreach (var item in items)
                {
                    _db.EventSessionGamePicks.Add(new EventSessionGamePick
                    {
                        EventId = eventId,
                        SourceCollectionId = collectionId,
                        BoardGameId = item.BoardGameId,
                        GameName = item.BoardGame?.Name ?? $"BoardGame#{item.BoardGameId}"
                    });
                    count++;
                }
            }
            else
            {
                var items = await _db.Set<Domain.Entities.Games.VideoGameCollectionVideoGame>()
                    .Where(i => i.CollectionId == collectionId)
                    .Include(i => i.VideoGame)
                    .ToListAsync();
                foreach (var item in items)
                {
                    _db.EventSessionGamePicks.Add(new EventSessionGamePick
                    {
                        EventId = eventId,
                        SourceCollectionId = collectionId,
                        VideoGameId = item.VideoGameId,
                        GameName = item.VideoGame?.Name ?? $"VideoGame#{item.VideoGameId}"
                    });
                    count++;
                }
            }
            await _db.SaveChangesAsync();
            return count;
        }

        public async Task<IEnumerable<EventSessionGamePick>> GetGamePicksByEventAsync(int eventId) =>
            await _db.EventSessionGamePicks
                .Where(p => p.EventId == eventId)
                .Include(p => p.Votes)
                .OrderByDescending(p => p.Votes.Count)
                .ToListAsync();

        public async Task<bool> DeleteGamePickAsync(int id)
        {
            var p = await _db.EventSessionGamePicks.FindAsync(id);
            if (p == null) return false;
            _db.EventSessionGamePicks.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> UpsertGameVoteAsync(EventSessionGameVote vote)
        {
            var existing = await _db.EventSessionGameVotes
                .FirstOrDefaultAsync(v => v.PickId == vote.PickId && v.UserId == vote.UserId);
            if (existing != null)
            {
                existing.Priority = vote.Priority;
                existing.VotedAt = DateTime.UtcNow;
            }
            else
            {
                _db.EventSessionGameVotes.Add(vote);
            }
            await _db.SaveChangesAsync();
            return existing?.Id ?? vote.Id;
        }

        public async Task<bool> DeleteGameVoteAsync(int pickId, int userId)
        {
            var v = await _db.EventSessionGameVotes
                .FirstOrDefaultAsync(x => x.PickId == pickId && x.UserId == userId);
            if (v == null) return false;
            _db.EventSessionGameVotes.Remove(v);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Session song picks ──

        public async Task<int> AddSongPickAsync(EventSessionSongPick pick)
        {
            _db.EventSessionSongPicks.Add(pick);
            await _db.SaveChangesAsync();
            return pick.Id;
        }

        public async Task<int> ImportSongPicksFromPlaylistAsync(int eventId, int sessionId, int playlistId)
        {
            var songs = await _db.Set<Domain.Entities.Karaoke.KaraokePlayLists.KaraokePlaylistSong>()
                .Where(ps => ps.PlaylistId == playlistId)
                .Include(ps => ps.Song)
                .ToListAsync();
            int count = 0;
            foreach (var ps in songs)
            {
                _db.EventSessionSongPicks.Add(new EventSessionSongPick
                {
                    EventId = eventId,
                    SessionId = sessionId,
                    SourcePlaylistId = playlistId,
                    SongId = ps.SongId,
                    SongTitle = ps.Song?.Title ?? $"Song#{ps.SongId}"
                });
                count++;
            }
            await _db.SaveChangesAsync();
            return count;
        }

        public async Task<IEnumerable<EventSessionSongPick>> GetSongPicksBySessionAsync(int eventId, int sessionId) =>
            await _db.EventSessionSongPicks
                .Where(p => p.EventId == eventId && p.SessionId == sessionId)
                .Include(p => p.Signups)
                .OrderByDescending(p => p.Signups.Count)
                .ToListAsync();

        public async Task<bool> DeleteSongPickAsync(int id)
        {
            var p = await _db.EventSessionSongPicks.FindAsync(id);
            if (p == null) return false;
            _db.EventSessionSongPicks.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> UpsertSongSignupAsync(EventSessionSongSignup signup)
        {
            var existing = await _db.EventSessionSongSignups
                .FirstOrDefaultAsync(s => s.PickId == signup.PickId && s.UserId == signup.UserId);
            if (existing != null)
            {
                existing.PreferredSlot = signup.PreferredSlot;
                existing.SignedUpAt = DateTime.UtcNow;
            }
            else
            {
                _db.EventSessionSongSignups.Add(signup);
            }
            await _db.SaveChangesAsync();
            return existing?.Id ?? signup.Id;
        }

        public async Task<bool> DeleteSongSignupAsync(int pickId, int userId)
        {
            var s = await _db.EventSessionSongSignups
                .FirstOrDefaultAsync(x => x.PickId == pickId && x.UserId == userId);
            if (s == null) return false;
            _db.EventSessionSongSignups.Remove(s);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Event by ID ──

        public async Task<Event?> GetEventByIdAsync(int id)
            => await _db.Events.Include(e => e.Tabs.OrderBy(t => t.SortOrder))
                .FirstOrDefaultAsync(e => e.Id == id);

        public async Task<Event?> GetEventWithLocationAsync(int id)
            => await _db.Events.Include(e => e.Location)
                .Include(e => e.Tabs.OrderBy(t => t.SortOrder))
                .FirstOrDefaultAsync(e => e.Id == id);

        public async Task<bool> UpdateEventAsync(Event ev)
        {
            _db.Events.Update(ev);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Event>> GetPublicEventsFromAsync(DateTime fromDate, int limit)
            => await _db.Events
                .Where(e => e.Visibility == Domain.Enums.Events.EventVisibility.Public)
                .Where(e => e.StartTime >= fromDate)
                .OrderBy(e => e.StartTime)
                .Take(limit)
                .ToListAsync();

        public async Task<Event?> FindByAccessTokenAsync(string token)
            => await _db.Events.FirstOrDefaultAsync(e => e.AccessToken == token);

        public async Task<bool> SoftDeleteEventAsync(int eventId, int deletedByUserId, CancellationToken ct = default)
        {
            var ev = await _db.Events.FindAsync([eventId], ct);
            if (ev == null) return false;
            ev.IsDeleted = true;
            ev.DeletedAt = DateTime.UtcNow;
            ev.DeletedByUserId = deletedByUserId;
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> RestoreEventAsync(int eventId, CancellationToken ct = default)
        {
            var ev = await _db.Events.IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == eventId && e.IsDeleted, ct);
            if (ev == null) return false;
            ev.IsDeleted = false;
            ev.DeletedAt = null;
            ev.DeletedByUserId = null;
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<IEnumerable<Domain.Entities.Contacts.Contact>> GetContactsByIdsAsync(IEnumerable<int> contactIds, CancellationToken ct = default)
            => await _db.Set<Domain.Entities.Contacts.Contact>()
                .Where(c => contactIds.Contains(c.Id))
                .Include(c => c.Emails)
                .Include(c => c.Phones)
                .AsNoTracking()
                .ToListAsync(ct);

        public async Task AddEventInviteAsync(Domain.Entities.Events.EventInvite invite, CancellationToken ct = default)
        {
            _db.Set<Domain.Entities.Events.EventInvite>().Add(invite);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync(CancellationToken ct = default)
            => await _db.SaveChangesAsync(ct);

        public IQueryable<Event> GetEventsQueryable() => _db.Events.AsQueryable();

        public async Task<IEnumerable<(int Id, string Name)>> GetDistinctOrganizersAsync()
        {
            var raw = await _db.Events
                .Where(e => e.OrganizerId != null)
                .Select(e => new { e.Organizer!.Id, Name = e.Organizer.FullName ?? e.Organizer.UserName ?? "?" })
                .Distinct()
                .OrderBy(o => o.Name)
                .AsNoTracking()
                .ToListAsync();

            return raw.Select(o => (o.Id, o.Name));
        }

        // ── Event Participants (user-level) ──

        public async Task<int> AddParticipantAsync(EventParticipant participant, CancellationToken ct = default)
        {
            _db.EventParticipants.Add(participant);
            await _db.SaveChangesAsync(ct);
            return participant.Id;
        }

        public async Task<EventParticipant?> GetParticipantAsync(int eventId, int userId, CancellationToken ct = default)
            => await _db.EventParticipants
                .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId, ct);

        public async Task<IEnumerable<EventParticipant>> GetParticipantsByEventAsync(int eventId, CancellationToken ct = default)
            => await _db.EventParticipants
                .Where(p => p.EventId == eventId)
                .Include(p => p.User)
                    .ThenInclude(u => u!.Contact)
                .OrderBy(p => p.RegisteredAt)
                .ToListAsync(ct);

        public async Task<bool> UpdateParticipantStatusAsync(int eventId, int userId, EventParticipantStatus status, CancellationToken ct = default)
        {
            var p = await _db.EventParticipants
                .FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == userId, ct);
            if (p == null) return false;
            p.Status = status;
            if (status == EventParticipantStatus.Waiting && p.ArrivedAt == null)
                p.ArrivedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> RemoveParticipantAsync(int eventId, int userId, CancellationToken ct = default)
        {
            var p = await _db.EventParticipants
                .FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == userId, ct);
            if (p == null) return false;
            _db.EventParticipants.Remove(p);
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}
