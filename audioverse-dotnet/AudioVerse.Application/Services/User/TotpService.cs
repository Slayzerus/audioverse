using OtpNet;

namespace AudioVerse.Application.Services.User
{
    public class TotpService : ITotpService
    {
        public string GenerateSecret()
        {
            var key = KeyGeneration.GenerateRandomKey(20);
            return Base32Encoding.ToString(key);
        }

        public string GetProvisioningUri(string secret, string userEmail, string issuer = "AudioVerse")
        {
            return $"otpauth://totp/{issuer}:{userEmail}?secret={secret}&issuer={issuer}&digits=6&period=30";
        }

        public bool VerifyCode(string secret, string code)
        {
            if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code))
                return false;

            var keyBytes = Base32Encoding.ToBytes(secret);
            var totp = new Totp(keyBytes);
            return totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));
        }
    }
}
