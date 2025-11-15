namespace AudioVerse.Application.Models.Requests.Admin
{
    public class UpdateUserDetailsRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? UserName { get; set; }
    }
}
