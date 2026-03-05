namespace AudioVerse.Application.Services.User;

public interface ITotpService
{
    string GenerateSecret();
    string GetProvisioningUri(string secret, string userEmail, string issuer = "AudioVerse");
    bool VerifyCode(string secret, string code);
}
