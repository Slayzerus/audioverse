namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioProjectCollaborator
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public AudioProject? Project { get; set; }
        public int UserId { get; set; }
        public CollaboratorPermission Permission { get; set; } = CollaboratorPermission.View;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
