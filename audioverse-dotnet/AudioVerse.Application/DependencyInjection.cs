using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AudioVerse.Application.Services.DMX;

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

            return services;
        }
    }
}
