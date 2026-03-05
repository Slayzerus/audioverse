using System.ComponentModel.DataAnnotations.Schema;

namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// Password policy requirements (min length, uppercase, digits, special chars).
    /// </summary>
    public class PasswordRequirements
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool Active { get; set; } = false;
        
        // Liczba wymaganych znaków
        public int MinLength { get; set; } = 0;
        public int MaxLength { get; set; } = 128;
        
        // Wymagane typy znaków
        public bool RequireUppercase { get; set; } = false;
        public bool RequireLowercase { get; set; } = false;
        public bool RequireDigit { get; set; } = false;
        public bool RequireSpecialChar { get; set; } = false;
        
        // Wymagane liczby
        [NotMapped]
        public int RequiredDigitCount { get; set; } = 0;
        [NotMapped]
        public int RequiredSpecialCharCount { get; set; } = 0;
        [NotMapped]
        public int RequiredUppercaseCount { get; set; } = 0;
        
        // Zaawansowane reguły
        [NotMapped]
        public bool RequireNoRepeatingChars { get; set; } = false;
        [NotMapped]
        public bool RequireOnlyDigitsAndSpecialChars { get; set; } = false;
        [NotMapped]
        public bool RequireOnlyLettersAndSpecialChars { get; set; } = false;
        [NotMapped]
        public bool RequireOnlyLettersAndDigits { get; set; } = false;

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

            // Wymagana liczba cyfr
            var digitCount = password.Count(char.IsDigit);
            if (digitCount < RequiredDigitCount)
                errors.Add($"Hasło musi zawierać co najmniej {RequiredDigitCount} cyfr");

            // Wymagana liczba znaków specjalnych
            var specialCharCount = password.Count(ch => !char.IsLetterOrDigit(ch));
            if (specialCharCount < RequiredSpecialCharCount)
                errors.Add($"Hasło musi zawierać co najmniej {RequiredSpecialCharCount} znaków specjalnych");

            // Wymagana liczba wielkich liter
            var uppercaseCount = password.Count(char.IsUpper);
            if (uppercaseCount < RequiredUppercaseCount)
                errors.Add($"Hasło musi zawierać co najmniej {RequiredUppercaseCount} wielkich liter");

            // Brak powtarzających się znaków
            if (RequireNoRepeatingChars && password.Distinct().Count() < password.Length)
                errors.Add("Hasło nie może zawierać powtarzających się znaków");

            // Tylko cyfry i znaki specjalne
            if (RequireOnlyDigitsAndSpecialChars && password.Any(char.IsLetter))
                errors.Add("Hasło może zawierać tylko cyfry i znaki specjalne");

            // Tylko wielkie litery, małe litery i znaki specjalne (bez cyfr)
            if (RequireOnlyLettersAndSpecialChars && password.Any(char.IsDigit))
                errors.Add("Hasło może zawierać tylko litery i znaki specjalne");

            // Tylko małe litery i cyfry (bez wielkich liter i znaków specjalnych)
            if (RequireOnlyLettersAndDigits && password.Any(ch => !char.IsLetterOrDigit(ch)))
                errors.Add("Hasło może zawierać tylko litery i cyfry");

            return (errors.Count == 0, errors);
        }
    }
}

