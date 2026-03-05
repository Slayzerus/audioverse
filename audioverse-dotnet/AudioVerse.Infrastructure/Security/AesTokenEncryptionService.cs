using System.Security.Cryptography;
using System.Text;
using AudioVerse.Domain.Services;
using Microsoft.Extensions.Options;

namespace AudioVerse.Infrastructure.Security
{
    public class AesTokenEncryptionService : ITokenEncryptionService
    {
        private readonly TokenEncryptionOptions _options;

        public AesTokenEncryptionService(IOptions<TokenEncryptionOptions> options)
        {
            _options = options.Value;

            if (string.IsNullOrEmpty(_options.CurrentKeyId) || !_options.Keys.ContainsKey(_options.CurrentKeyId))
                throw new InvalidOperationException("TokenEncryption: CurrentKeyId must reference a valid key in Keys.");
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            var keyBytes = Convert.FromBase64String(_options.Keys[_options.CurrentKeyId]);
            using var aes = Aes.Create();
            aes.Key = keyBytes;
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            // Format: keyId:iv:cipher (all base64)
            return $"{_options.CurrentKeyId}:{Convert.ToBase64String(aes.IV)}:{Convert.ToBase64String(cipherBytes)}";
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            // If not in our format, return as-is (backward compat with unencrypted tokens)
            var parts = cipherText.Split(':');
            if (parts.Length != 3) return cipherText;

            var keyId = parts[0];
            if (!_options.Keys.TryGetValue(keyId, out var keyBase64))
                throw new CryptographicException($"TokenEncryption: Unknown key ID '{keyId}'. Key rotation may require adding old keys to config.");

            var iv = Convert.FromBase64String(parts[1]);
            var cipher = Convert.FromBase64String(parts[2]);
            var keyBytes = Convert.FromBase64String(keyBase64);

            using var aes = Aes.Create();
            aes.Key = keyBytes;
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
    }
}
