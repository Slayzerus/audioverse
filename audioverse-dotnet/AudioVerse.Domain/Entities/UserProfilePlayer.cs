namespace AudioVerse.Domain.Entities
{
    public class UserProfilePlayer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProfileId { get; set; }
        public UserProfile Profile { get; set; }
    }
}
