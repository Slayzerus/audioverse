namespace AudioVerse.API.Models.Requests.Events;

public class BulkInviteRequest
{
    public int TemplateId { get; set; }
    public int[] ContactIds { get; set; } = [];
    public int? UserId { get; set; }
}
