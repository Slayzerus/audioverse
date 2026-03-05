namespace AudioVerse.Application.Models.Admin
{
    public class PermissionChangeDetailDto
    {
        public int PlayerId { get; set; }
        public int Old { get; set; }
        public int New { get; set; }
    }
}
