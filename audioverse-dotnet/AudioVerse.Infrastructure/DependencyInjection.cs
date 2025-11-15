using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Repositories;
using System.Data;
using Npgsql;

namespace AudioVerse.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // ✅ Rejestracja DbContext dla EF Core
            services.AddDbContext<AudioVerseDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("PostgresConnection"), b => b.MigrationsAssembly("AudioVerse.API")));

            // ✅ Rejestracja Dapper i IDbConnection
            services.AddScoped<IDbConnection>(sp =>
                new NpgsqlConnection(configuration.GetConnectionString("PostgresConnection")));

            // ✅ Możliwość przełączania repozytoriów (używane jednocześnie)
            services.AddScoped<IKaraokeRepository, KaraokeRepository>(); // Dapper
            services.AddScoped<IKaraokeRepository, KaraokeRepositoryEF>(); // EF Core

            services.AddScoped<IUserProfileRepository, UserProfileRepository>(); // Dapper
            services.AddScoped<IUserProfileRepository, UserProfileRepositoryEF>(); // EF Core

            services.AddScoped<IEditorRepository, EditorRepository>(); // Dapper
            services.AddScoped<IEditorRepository, EditorRepositoryEF>(); // EF Core

            return services;
        }
    }
}
