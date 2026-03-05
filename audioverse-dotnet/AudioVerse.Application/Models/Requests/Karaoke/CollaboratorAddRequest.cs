namespace AudioVerse.API.Areas.Karaoke.Controllers;

public class CollaboratorAddRequest
{
    public int UserId { get; set; }
    public AudioVerse.Domain.Enums.CollaborationPermission Permission { get; set; } = AudioVerse.Domain.Enums.CollaborationPermission.Read;
}
