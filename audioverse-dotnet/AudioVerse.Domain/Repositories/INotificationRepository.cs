using AudioVerse.Domain.Entities;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for user notification operations: create, read, mark as read, and delete.
/// </summary>
public interface INotificationRepository
{
    Task<int> AddAsync(Notification notification);
    Task<IEnumerable<Notification>> GetByUserAsync(int userId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkAsReadAsync(int id);
    Task<int> MarkAllAsReadAsync(int userId);
    Task<bool> DeleteAsync(int id);
}
