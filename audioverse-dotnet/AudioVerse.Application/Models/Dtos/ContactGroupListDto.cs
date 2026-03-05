namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Grupa kontaktów — widok listy z liczbą członków.
    /// </summary>
    public class ContactGroupListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public int? OrganizationId { get; set; }
        public int MemberCount { get; set; }
    }
}
