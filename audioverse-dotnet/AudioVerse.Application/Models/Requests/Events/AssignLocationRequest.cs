namespace AudioVerse.API.Areas.Events.Controllers;

public class AssignLocationRequest
{
    public int? LocationId { get; set; }
    public CreateLocationRequest? Location { get; set; }
}
