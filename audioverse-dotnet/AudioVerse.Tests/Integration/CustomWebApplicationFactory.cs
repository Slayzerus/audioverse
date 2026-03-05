using AudioVerse.API;
using AudioVerse.Application.Services.Security;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Tests.Seed;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using System.Data;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Custom web application factory for integration tests with in-memory database and fake services.
    /// </summary>
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        /// <summary>
        /// Configures the test host with in-memory infrastructure and seeded data.
        /// </summary>
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            var tempPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"audioverse_tests_{Guid.NewGuid():N}.db");
            var sqliteConn = $"Data Source={tempPath}";

            builder.UseEnvironment("Testing");
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");

            builder.ConfigureAppConfiguration((context, config) =>
            {
                var settings = new Dictionary<string, string>
                {
                    { "JwtSettings:Secret", "integration-test-secret-key-1234567890" },
                    { "RecaptchaSettings:SecretKey", "dummy" },
                    { "SkipMigrations", "true" },
                    { "Database:Provider", "Sqlite" },
                    { "ConnectionStrings:SqliteConnection", sqliteConn },
                    { "ConnectionStrings:Redis", "" }
                };
                config.AddInMemoryCollection(settings!);
            });

            builder.ConfigureServices(services =>
            {
                // Remove all background hosted services (they fail without real infra)
                var hostedServiceDescriptors = services
                    .Where(d => d.ServiceType == typeof(IHostedService))
                    .ToList();
                foreach (var d in hostedServiceDescriptors)
                    services.Remove(d);

                // ?? Replace Npgsql DbContext with SQLite ??
                // AddInfrastructure registers DbContext with Npgsql (config not yet overridden).
                // We must replace DbContextOptions<T> WITHOUT calling AddDbContext again,
                // to avoid registering a second IDatabaseProvider (dual-provider conflict).

                // 1. Remove the Npgsql-configured options
                services.RemoveAll<DbContextOptions<AudioVerseDbContext>>();
                services.RemoveAll<DbContextOptions>();

                // 2. Register fresh options pointing to SQLite only (no AddDbContext call)
                services.AddScoped<DbContextOptions<AudioVerseDbContext>>(_ =>
                {
                    var optionsBuilder = new DbContextOptionsBuilder<AudioVerseDbContext>();
                    optionsBuilder.UseSqlite(sqliteConn);
                    return optionsBuilder.Options;
                });
                services.AddScoped<DbContextOptions>(sp =>
                    sp.GetRequiredService<DbContextOptions<AudioVerseDbContext>>());

                // 3. Replace IDbConnection (Dapper) with SQLite
                services.RemoveAll<IDbConnection>();
                services.AddScoped<IDbConnection>(_ =>
                    new Microsoft.Data.Sqlite.SqliteConnection(sqliteConn));

                // Initialize and seed the SQLite database after host starts
                services.AddHostedService<TestDatabaseInitializer>();

                // Replace Recaptcha with fake
                services.RemoveAll<IRecaptchaService>();
                services.AddSingleton<IRecaptchaService, FakeRecaptchaService>();
            });
        }
    }
}
