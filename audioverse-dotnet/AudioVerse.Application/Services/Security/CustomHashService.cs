using System.Security.Cryptography;
using System.Text;

namespace AudioVerse.Application.Services.Security
{
    public class CustomHashService : ICustomHashService
    {
        private const int SaltSize = 16; // 16 bajt�w soli
        private const int HashSize = 32; // 32 bajt�w hash (SHA256)
        private const int Iterations = 10000; // Liczba iteracji PBKDF2

        /// <summary>
        /// Haszuje has?o u?ywaj?c funkcji lg(a*x) gdzie:
        /// a = d?ugo?? username'u
        /// x = d?ugo?? has?a
        /// </summary>
        public string HashPassword(string userId, string password)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentNullException(nameof(userId));
            if (string.IsNullOrEmpty(password))
                throw new ArgumentNullException(nameof(password));

            // Oblicz parametr funkcji:
            // a = d?ugo?? userId
            // x = d?ugo?? password
            // Function: lg(a*x) = log10(a * x)
            int a = userId.Length;
            int x = password.Length;
            double logValue = Math.Log10(a * x);
            
            // U?yj logValue do wygenerowania dodatkowego komponentu do soli
            int additionalIterations = (int)(Iterations * (1 + logValue / 10)); // Dynamiczne iteracje bazowane na lg(a*x)

            // Generuj losow? s�l
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] salt = new byte[SaltSize];
                rng.GetBytes(salt);

                // U?ywaj PBKDF2 z SHA256
                {
                    byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, additionalIterations, HashAlgorithmName.SHA256, HashSize);

                    // ??cz iteracje, s�l i hash w jeden string base64
                    byte[] hashWithSalt = new byte[sizeof(int) + SaltSize + HashSize];
                    Buffer.BlockCopy(BitConverter.GetBytes(additionalIterations), 0, hashWithSalt, 0, sizeof(int));
                    Buffer.BlockCopy(salt, 0, hashWithSalt, sizeof(int), SaltSize);
                    Buffer.BlockCopy(hash, 0, hashWithSalt, sizeof(int) + SaltSize, HashSize);

                    return Convert.ToBase64String(hashWithSalt);
                }
            }
        }

        /// <summary>
        /// Weryfikuje has?o por�wnuj?c z zapami?tanym hash'em
        /// </summary>
        public bool VerifyPassword(string userId, string password, string hash)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentNullException(nameof(userId));
            if (string.IsNullOrEmpty(password))
                throw new ArgumentNullException(nameof(password));
            if (string.IsNullOrEmpty(hash))
                throw new ArgumentNullException(nameof(hash));

            try
            {
                // Rozpakuj dane z hash'a
                byte[] hashBytes = Convert.FromBase64String(hash);
                
                // Odczytaj parametry
                int iterations = BitConverter.ToInt32(hashBytes, 0);
                byte[] salt = new byte[SaltSize];
                Buffer.BlockCopy(hashBytes, sizeof(int), salt, 0, SaltSize);
                byte[] expectedHash = new byte[HashSize];
                Buffer.BlockCopy(hashBytes, sizeof(int) + SaltSize, expectedHash, 0, HashSize);

                // Oblicz hash has?a z t? sam? sol? i iteracjami
                {
                    byte[] computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, HashSize);

                    // Por�wnaj constanttime aby unikn?? timing attacks
                    return ConstantTimeComparison(expectedHash, computedHash);
                }
            }
            catch (FormatException) {
                return false;
            }
        }

        /// <summary>
        /// Por�wnanie constant-time aby unikn?? timing attacks
        /// </summary>
        private static bool ConstantTimeComparison(byte[] a, byte[] b)
        {
            if (a.Length != b.Length)
                return false;

            int result = 0;
            for (int i = 0; i < a.Length; i++)
            {
                result |= a[i] ^ b[i];
            }

            return result == 0;
        }
    }

    /// <summary>
    /// Dokumentacja funkcji lg(a*x):
    /// 
    /// Parametry:
    /// a = d?ugo?? identyfikatora u?ytkownika (username) - zakreq 1-20
    /// x = d?ugo?? has?a - zakres 8-128
    /// 
    /// Przyk?ady:
    /// - User: "john" (a=4), Password: "Pass123" (x=7) ? lg(4*7) = lg(28) ? 1.447
    ///   Iteracje: 10000 * (1 + 1.447/10) = ~11447
    /// 
    /// - User: "administrator" (a=13), Password: "VerySecurePass123!" (x=18) ? lg(13*18) = lg(234) ? 2.369
    ///   Iteracje: 10000 * (1 + 2.369/10) = ~12369
    ///
    /// Liczba iteracji PBKDF2 dynamicznie wzrasta z czasem obliczeniowym (lg-based),
    /// co skutkuje lepsz? ochron? przed brute-force'em dla d?u?szych hase?.
    /// </summary>
}
