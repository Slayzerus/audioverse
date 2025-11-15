namespace AudioVerse.Application.Models
{
    public class PasswordRequirementsDto
    {
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireDigit { get; set; }
        public bool RequireSpecialChar { get; set; }
        public int MinLength { get; set; }
        public int MaxLength { get; set; }
    }
}
