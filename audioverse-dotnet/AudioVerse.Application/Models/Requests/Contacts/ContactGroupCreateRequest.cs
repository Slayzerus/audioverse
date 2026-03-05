namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Request tworzenia/aktualizacji grupy kontaktów.
    /// </summary>
    public class ContactGroupCreateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public int? OrganizationId { get; set; }
    }
}
