namespace AudioVerse.Domain.Entities
{
    public class PasswordRequirements
    {
        public bool RequireUppercase { get; set; } = true;
        public bool RequireLowercase { get; set; } = true;
        public bool RequireDigit { get; set; } = true;
        public bool RequireSpecialChar { get; set; } = true;
        public int MinLength { get; set; } = 8;
        public int MaxLength { get; set; } = 128;

        public (bool IsValid, List<string> Errors) ValidatePassword(string password)
        {
            var errors = new List<string>();

            if (string.IsNullOrEmpty(password))
            {
                errors.Add("Hasło nie może być puste");
                return (false, errors);
            }

            if (password.Length < MinLength)
                errors.Add($"Hasło musi mieć co najmniej {MinLength} znaków");

            if (password.Length > MaxLength)
                errors.Add($"Hasło nie może przekraczać {MaxLength} znaków");

            if (RequireUppercase && !password.Any(char.IsUpper))
                errors.Add("Hasło musi zawierać co najmniej jedną wielką literę");

            if (RequireLowercase && !password.Any(char.IsLower))
                errors.Add("Hasło musi zawierać co najmniej jedną małą literę");

            if (RequireDigit && !password.Any(char.IsDigit))
                errors.Add("Hasło musi zawierać co najmniej jedną cyfrę");

            if (RequireSpecialChar && !password.Any(ch => !char.IsLetterOrDigit(ch)))
                errors.Add("Hasło musi zawierać co najmniej jeden znak specjalny");

            return (errors.Count == 0, errors);
        }
    }
}
