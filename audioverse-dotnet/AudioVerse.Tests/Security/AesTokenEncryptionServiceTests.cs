using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using AudioVerse.Infrastructure.Security;
using Microsoft.Extensions.Options;
using Xunit;

namespace AudioVerse.Tests.Security
{
    public class AesTokenEncryptionServiceTests
    {
        private static AesTokenEncryptionService CreateService(string currentKeyId = "key1", Dictionary<string, string>? keys = null)
        {
            keys ??= new Dictionary<string, string>
            {
                ["key1"] = GenerateKey(),
                ["key2"] = GenerateKey()
            };
            var opts = Options.Create(new TokenEncryptionOptions { CurrentKeyId = currentKeyId, Keys = keys });
            return new AesTokenEncryptionService(opts);
        }

        private static string GenerateKey()
        {
            var key = new byte[32]; // AES-256
            RandomNumberGenerator.Fill(key);
            return Convert.ToBase64String(key);
        }

        [Fact]
        public void Encrypt_Decrypt_RoundTrip()
        {
            var service = CreateService();
            var plain = "my-secret-access-token-12345";
            var encrypted = service.Encrypt(plain);

            Assert.NotEqual(plain, encrypted);
            Assert.Contains("key1:", encrypted);

            var decrypted = service.Decrypt(encrypted);
            Assert.Equal(plain, decrypted);
        }

        [Fact]
        public void Decrypt_UnencryptedText_ReturnsAsIs()
        {
            var service = CreateService();
            var plain = "not-encrypted-token";
            var result = service.Decrypt(plain);
            Assert.Equal(plain, result);
        }

        [Fact]
        public void Decrypt_WithOldKey_WorksAfterRotation()
        {
            var key1 = GenerateKey();
            var key2 = GenerateKey();
            var keys = new Dictionary<string, string> { ["key1"] = key1, ["key2"] = key2 };

            // Encrypt with key1
            var serviceV1 = CreateService("key1", new Dictionary<string, string>(keys));
            var encrypted = serviceV1.Encrypt("secret-data");
            Assert.Contains("key1:", encrypted);

            // Rotate: new service uses key2 as current, but key1 still in Keys
            var serviceV2 = CreateService("key2", new Dictionary<string, string>(keys));
            var decrypted = serviceV2.Decrypt(encrypted);
            Assert.Equal("secret-data", decrypted);
        }

        [Fact]
        public void Decrypt_WithMissingKey_Throws()
        {
            var service = CreateService("key1", new Dictionary<string, string> { ["key1"] = GenerateKey() });
            var fakeEncrypted = "key99:AAAA:BBBB";

            Assert.Throws<CryptographicException>(() => service.Decrypt(fakeEncrypted));
        }

        [Fact]
        public void Encrypt_EmptyString_ReturnsEmpty()
        {
            var service = CreateService();
            Assert.Equal("", service.Encrypt(""));
        }

        [Fact]
        public void Decrypt_EmptyString_ReturnsEmpty()
        {
            var service = CreateService();
            Assert.Equal("", service.Decrypt(""));
        }

        [Fact]
        public void Constructor_Throws_WhenCurrentKeyIdMissing()
        {
            Assert.Throws<InvalidOperationException>(() =>
                CreateService("nonexistent", new Dictionary<string, string> { ["key1"] = GenerateKey() }));
        }

        [Fact]
        public void Encrypt_ProducesDifferentCiphertexts_ForSamePlaintext()
        {
            var service = CreateService();
            var plain = "same-token";
            var enc1 = service.Encrypt(plain);
            var enc2 = service.Encrypt(plain);

            Assert.NotEqual(enc1, enc2); // different IVs
            Assert.Equal(plain, service.Decrypt(enc1));
            Assert.Equal(plain, service.Decrypt(enc2));
        }
    }
}
