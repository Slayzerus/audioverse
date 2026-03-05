namespace AudioVerse.Application.Models.Requests.Admin
{
    public class UpdatePasswordRequirementsRequest
    {
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireDigit { get; set; }
        public bool RequireSpecialChar { get; set; }
        public int MinLength { get; set; }
    }
}
