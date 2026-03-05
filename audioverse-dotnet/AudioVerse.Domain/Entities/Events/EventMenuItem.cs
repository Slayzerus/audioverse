using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventMenuItem
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MenuItemCategory Category { get; set; }
        public decimal? Price { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string? ImageKey { get; set; }
        public string? Allergens { get; set; }
        public bool IsVegetarian { get; set; }
        public bool IsVegan { get; set; }
    }
}
