using AudioVerse.Domain.Services;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Infrastructure.Repositories
{
    public class EncryptedExternalAccountRepository : IExternalAccountRepository
    {
        private readonly IExternalAccountRepository _inner;
        private readonly ITokenEncryptionService _crypto;

        public EncryptedExternalAccountRepository(ExternalAccountRepositoryEF inner, ITokenEncryptionService crypto)
        {
            _inner = inner;
            _crypto = crypto;
        }

        public async Task<int> LinkAccountAsync(UserExternalAccount account)
        {
            account.AccessToken = EncryptIfPresent(account.AccessToken);
            account.RefreshToken = EncryptIfPresent(account.RefreshToken);
            return await _inner.LinkAccountAsync(account);
        }

        public async Task<UserExternalAccount?> GetByPlatformAsync(int userId, ExternalPlatform platform)
        {
            var account = await _inner.GetByPlatformAsync(userId, platform);
            if (account != null) DecryptTokens(account);
            return account;
        }

        public async Task<IEnumerable<UserExternalAccount>> GetUserAccountsAsync(int userId)
        {
            var accounts = await _inner.GetUserAccountsAsync(userId);
            foreach (var a in accounts) DecryptTokens(a);
            return accounts;
        }

        public async Task<bool> UpdateTokensAsync(int id, string accessToken, string? refreshToken, DateTime? expiresAt)
        {
            var encAccess = _crypto.Encrypt(accessToken);
            var encRefresh = refreshToken != null ? _crypto.Encrypt(refreshToken) : null;
            return await _inner.UpdateTokensAsync(id, encAccess, encRefresh, expiresAt);
        }

        public Task<bool> UnlinkAccountAsync(int userId, ExternalPlatform platform)
            => _inner.UnlinkAccountAsync(userId, platform);

        public async Task<UserExternalAccount?> FindByExternalIdAsync(ExternalPlatform platform, string externalUserId)
        {
            var account = await _inner.FindByExternalIdAsync(platform, externalUserId);
            if (account != null) DecryptTokens(account);
            return account;
        }

        public Task<bool> UpdateLastUsedAsync(int id)
            => _inner.UpdateLastUsedAsync(id);

        public Task<bool> IsLinkedAsync(int userId, ExternalPlatform platform)
            => _inner.IsLinkedAsync(userId, platform);

        public async Task<IEnumerable<UserExternalAccount>> GetExpiredAccountsAsync(int bufferMinutes = 5)
        {
            var accounts = await _inner.GetExpiredAccountsAsync(bufferMinutes);
            foreach (var a in accounts) DecryptTokens(a);
            return accounts;
        }

        public async Task<IEnumerable<UserExternalAccount>> GetActiveAccountsAsync(int userId)
        {
            var accounts = await _inner.GetActiveAccountsAsync(userId);
            foreach (var a in accounts) DecryptTokens(a);
            return accounts;
        }

        public async Task<UserExternalAccount> SaveOrUpdateConnectionAsync(int userId, ExternalPlatform platform, UserExternalAccount data)
        {
            data.AccessToken = EncryptIfPresent(data.AccessToken);
            data.RefreshToken = EncryptIfPresent(data.RefreshToken);
            var result = await _inner.SaveOrUpdateConnectionAsync(userId, platform, data);
            DecryptTokens(result);
            return result;
        }

        public Task RemoveAsync(UserExternalAccount account)
            => _inner.RemoveAsync(account);

        public Task SaveChangesAsync()
            => _inner.SaveChangesAsync();

        private void DecryptTokens(UserExternalAccount account)
        {
            account.AccessToken = DecryptIfPresent(account.AccessToken);
            account.RefreshToken = DecryptIfPresent(account.RefreshToken);
        }

        private string? EncryptIfPresent(string? value)
            => string.IsNullOrEmpty(value) ? value : _crypto.Encrypt(value);

        private string? DecryptIfPresent(string? value)
            => string.IsNullOrEmpty(value) ? value : _crypto.Decrypt(value);
    }
}
