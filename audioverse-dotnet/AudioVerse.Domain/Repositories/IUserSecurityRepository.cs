using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for user security-related operations including bans, login attempts, and password history.
/// </summary>
public interface IUserSecurityRepository
{
    // ????????????????????????????????????????????????????????????
    //  USER BANS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Creates a new user ban.
    /// </summary>
    /// <param name="ban">The ban to create</param>
    /// <returns>The ID of the created ban</returns>
    Task<int> CreateBanAsync(UserBan ban);

    /// <summary>
    /// Gets the currently active ban for a user, if any.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>The active ban, or null if user is not banned</returns>
    Task<UserBan?> GetActiveBanAsync(int userId);

    /// <summary>
    /// Gets all bans (active and inactive) for a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Collection of all bans for the user</returns>
    Task<IEnumerable<UserBan>> GetBanHistoryAsync(int userId);

    /// <summary>
    /// Deactivates a ban.
    /// </summary>
    /// <param name="banId">The ban ID to deactivate</param>
    /// <returns>True if deactivated successfully</returns>
    Task<bool> DeactivateBanAsync(int banId);

    /// <summary>
    /// Checks if a user is currently banned.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>True if user has an active ban</returns>
    Task<bool> IsUserBannedAsync(int userId);

    // ????????????????????????????????????????????????????????????
    //  LOGIN ATTEMPTS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Records a login attempt.
    /// </summary>
    /// <param name="attempt">The login attempt details</param>
    /// <returns>The ID of the recorded attempt</returns>
    Task<int> RecordLoginAttemptAsync(LoginAttempt attempt);

    /// <summary>
    /// Gets recent login attempts for a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="count">Maximum number of attempts to return</param>
    /// <returns>Collection of recent login attempts</returns>
    Task<IEnumerable<LoginAttempt>> GetRecentAttemptsAsync(int userId, int count = 10);

    /// <summary>
    /// Counts failed login attempts within a time window.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="window">The time window to check</param>
    /// <returns>Number of failed attempts</returns>
    Task<int> CountFailedAttemptsAsync(int userId, TimeSpan window);

    /// <summary>
    /// Counts failed login attempts by IP within a time window.
    /// </summary>
    /// <param name="ipAddress">The IP address</param>
    /// <param name="window">The time window to check</param>
    /// <returns>Number of failed attempts</returns>
    Task<int> CountFailedAttemptsByIpAsync(string ipAddress, TimeSpan window);

    // ????????????????????????????????????????????????????????????
    //  PASSWORD HISTORY
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Adds a password hash to the user's history.
    /// </summary>
    /// <param name="entry">The password history entry</param>
    /// <returns>The ID of the created entry</returns>
    Task<int> AddPasswordHistoryAsync(PasswordHistory entry);

    /// <summary>
    /// Gets recent password hashes for a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="count">Maximum number of entries to return</param>
    /// <returns>Collection of recent password history entries</returns>
    Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count = 5);

    // ????????????????????????????????????????????????????????????
    //  ONE-TIME PASSWORDS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Creates a new OTP for a user.
    /// </summary>
    /// <param name="otp">The OTP to create</param>
    /// <returns>The ID of the created OTP</returns>
    Task<int> CreateOtpAsync(OneTimePassword otp);

    /// <summary>
    /// Gets a valid (unused, not expired) OTP for a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="code">The OTP code</param>
    /// <returns>The OTP if valid, null otherwise</returns>
    Task<OneTimePassword?> GetValidOtpAsync(int userId, string code);

    /// <summary>
    /// Marks an OTP as used.
    /// </summary>
    /// <param name="otpId">The OTP ID</param>
    /// <returns>True if marked successfully</returns>
    Task<bool> MarkOtpUsedAsync(int otpId);

    /// <summary>
    /// Invalidates all unused OTPs for a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Number of invalidated OTPs</returns>
    Task<int> InvalidateUserOtpsAsync(int userId);

    /// <summary>Gets all OTPs ordered by creation date.</summary>
    Task<IEnumerable<OneTimePassword>> GetAllOtpsAsync(CancellationToken ct = default);

    // ════════════════════════════════════════════════════════════
    //  LOGIN ATTEMPTS (extended)
    // ════════════════════════════════════════════════════════════

    /// <summary>Deletes all login attempts for a user.</summary>
    Task DeleteLoginAttemptsAsync(int userId, CancellationToken ct = default);

    /// <summary>Gets all login attempts ordered by time.</summary>
    Task<IEnumerable<LoginAttempt>> GetAllLoginAttemptsAsync(CancellationToken ct = default);

    /// <summary>Gets failed login attempts since a given time.</summary>
    Task<IEnumerable<LoginAttempt>> GetFailedAttemptsSinceAsync(DateTime since, CancellationToken ct = default);

    /// <summary>Gets the last failed attempt for a user within a time window.</summary>
    Task<LoginAttempt?> GetLastFailedAttemptAsync(int userId, DateTime since, CancellationToken ct = default);

    // ════════════════════════════════════════════════════════════
    //  CAPTCHA
    // ════════════════════════════════════════════════════════════

    /// <summary>Saves a captcha entity.</summary>
    Task<int> SaveCaptchaAsync(Captcha captcha, CancellationToken ct = default);

    /// <summary>Gets a captcha by ID.</summary>
    Task<Captcha?> GetCaptchaByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Marks captcha as used and saves.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);

    // ════════════════════════════════════════════════════════════
    //  HONEY TOKENS
    // ════════════════════════════════════════════════════════════

    /// <summary>Adds a honey token.</summary>
    Task<int> AddHoneyTokenAsync(AudioVerse.Domain.Entities.Admin.HoneyToken token, CancellationToken ct = default);

    /// <summary>Gets a honey token by ID.</summary>
    Task<AudioVerse.Domain.Entities.Admin.HoneyToken?> GetHoneyTokenByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Gets all honey tokens.</summary>
    Task<IEnumerable<AudioVerse.Domain.Entities.Admin.HoneyToken>> GetAllHoneyTokensAsync(CancellationToken ct = default);

    /// <summary>Gets triggered honey tokens.</summary>
    Task<IEnumerable<AudioVerse.Domain.Entities.Admin.HoneyToken>> GetTriggeredHoneyTokensAsync(CancellationToken ct = default);
}
