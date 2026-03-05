using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Infrastructure.Seeds
{
    public static class SeedRunner
    {
        public static void RunAll(AudioVerseDbContext db)
        {
            GenreSeeder.SeedGenres(db);
        }
    }
}