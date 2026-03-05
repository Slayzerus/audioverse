namespace AudioVerse.Application.Services
{
    public interface ICurrentUserService
    {
        int? UserId { get; }
        bool IsAdmin { get; }
    }
}
