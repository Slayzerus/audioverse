namespace AudioVerse.Domain.Entities.Design
{
    /// <summary>
    /// UI skin theme with CSS variables, colors, and font configuration.
    /// </summary>
    public class SkinTheme
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Emoji { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDark { get; set; }
        public string? BodyBackground { get; set; }
        public string Vars { get; set; } = "{}";
        public bool IsActive { get; set; } = true;
        public bool IsSystem { get; set; }
        public bool IsDeleted { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
