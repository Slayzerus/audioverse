using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.Persistence
{
    public class AudioVerseDbContextFactory : IDesignTimeDbContextFactory<AudioVerseDbContext>
    {
        public AudioVerseDbContext CreateDbContext(string[] args)
        {
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "AudioVerse.API");
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.Exists(basePath) ? basePath : Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var builder = new DbContextOptionsBuilder<AudioVerseDbContext>();

            var provider = configuration["Database:Provider"];
            if (!string.IsNullOrEmpty(provider) && provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                var sqliteConn = configuration.GetConnectionString("SqliteConnection")
                    ?? configuration["ConnectionStrings:SqliteConnection"]
                    ?? "Data Source=audioverse.db";
                builder.UseSqlite(sqliteConn);
            }
            else
            {
                var pgConn = configuration.GetConnectionString("PostgresConnection")
                    ?? "Host=localhost;Database=audioverse;Username=postgres;Password=postgres";
                builder.UseNpgsql(pgConn, b => b.MigrationsAssembly("AudioVerse.API"));
            }

            return new AudioVerseDbContext(builder.Options);
        }
    }
}
