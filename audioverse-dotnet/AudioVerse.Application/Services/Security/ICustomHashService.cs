namespace AudioVerse.Application.Services.Security;

public interface ICustomHashService
{
    string HashPassword(string userId, string password);
    bool VerifyPassword(string userId, string password, string hash);
}
