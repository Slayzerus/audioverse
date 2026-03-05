using System.Security.Cryptography;
using System.Text;

namespace AudioVerse.SetupWizard;

public static class SecretGenerator
{
    // Safe chars: no $, %, ^, &, !, @, (, ) — these break Docker Compose .env,
    // PowerShell, and bash variable expansion.
    private const string Chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-#.+=";

    public static string GeneratePassword(int length = 24)
    {
        var data = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(data);
        var sb = new StringBuilder(length);
        for (int i = 0; i < length; i++)
            sb.Append(Chars[data[i] % Chars.Length]);
        return sb.ToString();
    }
}
