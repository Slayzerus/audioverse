using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Services.User;
using AudioVerse.Application.Services.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AudioVerse.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<DmxState>();
            services.AddSingleton<IDmxPort, FtdiD2xxDmxPort>();
            services.AddSingleton<DmxWorker>();
            services.AddHostedService<DmxWorker>();
            services.AddScoped<IPasswordService, PasswordService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAuditLogService, AuditLogService>();
            services.AddScoped<IOtpService, OtpService>();
            services.AddScoped<ILoginAttemptService, LoginAttemptService>();
            services.AddScoped<ICaptchaService, CaptchaService>();
            services.AddScoped<IHoneyTokenService, HoneyTokenService>();
            services.AddScoped<IRecaptchaService, RecaptchaService>();
            services.AddScoped<ICustomHashService, CustomHashService>();
            services.AddScoped<AudioVerse.Application.Services.Utils.IDanceClassificationService, AudioVerse.Application.Services.Utils.DanceClassificationService>();
            services.AddScoped<IPlayerLinkSyncService, PlayerLinkSyncService>();

            return services;
        }
    }
}
