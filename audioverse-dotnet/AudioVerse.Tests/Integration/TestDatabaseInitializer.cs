using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using AudioVerse.Infrastructure.Persistence;
using System.Threading.Tasks;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Hosted service used only in tests to initialize/seeds the SQLite in-memory database after host starts.
    /// </summary>
    public class TestDatabaseInitializer : IHostedService
    {
        private readonly IServiceProvider _provider;

        public TestDatabaseInitializer(IServiceProvider provider)
        {
            _provider = provider;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var scope = _provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            // Ensure DB schema and seed
            db.Database.EnsureCreated();
            await AudioVerse.Tests.Seed.TestDataSeeder.SeedWithAuditAsync(db);
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
