using AudioVerse.Domain.Entities.Admin;

namespace AudioVerse.Application.Services.Security;

public interface IHoneyTokenService
{
    Task<HoneyToken> CreateHoneyTokenAsync(string type, string description);
    Task TriggerTokenAsync(int tokenId, string fromIp, Dictionary<string, object> details);
    Task<List<HoneyToken>> GetTriggeredTokensAsync();
    Task<HoneyToken?> GetTokenByIdAsync(string tokenId);
}
