using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class BulkPermissionUpdate
    {
        public int PlayerId { get; set; }
        public EventPermission Permission { get; set; }
    }
}
