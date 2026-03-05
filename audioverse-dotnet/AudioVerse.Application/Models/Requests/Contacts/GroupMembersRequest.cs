namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Request dodania kontaktów do grupy (batch).
    /// </summary>
    public class GroupMembersRequest
    {
        public List<int> ContactIds { get; set; } = [];
    }
}
