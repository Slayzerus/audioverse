namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Referencja do grupy w szczegółach kontaktu.
    /// </summary>
    public class ContactGroupRefDto
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; } = string.Empty;
    }
}
