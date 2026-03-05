using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Infrastructure.Seeds
{
    public static class GenreSeeder
    {
        public static void SeedGenres(AudioVerseDbContext db)
        {
            if (db.MusicGenres.Any()) return;

            // Top-level genres
            var top = new List<MusicGenre>
            {
                new MusicGenre { Name = "Rock" },
                new MusicGenre { Name = "Pop" },
                new MusicGenre { Name = "Electronic" },
                new MusicGenre { Name = "Hip Hop" },
                new MusicGenre { Name = "Classical" },
                new MusicGenre { Name = "Jazz" },
                new MusicGenre { Name = "Country" },
                new MusicGenre { Name = "Reggae" },
                new MusicGenre { Name = "Blues" },
                new MusicGenre { Name = "Folk" },
                new MusicGenre { Name = "Metal" },
                new MusicGenre { Name = "R&B" },
                new MusicGenre { Name = "Latin" },
                new MusicGenre { Name = "World" },
                new MusicGenre { Name = "Soul" },
                new MusicGenre { Name = "Gospel" },
                new MusicGenre { Name = "Punk" },
                new MusicGenre { Name = "Funk" },
                new MusicGenre { Name = "Ambient" },
                new MusicGenre { Name = "Experimental" }
            };

            db.MusicGenres.AddRange(top);
            db.SaveChanges();

            // Build subgenres (level 2)
            void AddSub(string parentName, params string[] subs)
            {
                var parent = db.MusicGenres.FirstOrDefault(g => g.Name == parentName);
                if (parent == null) return;
                foreach (var s in subs)
                {
                    if (!db.MusicGenres.Any(g => g.Name == s && g.ParentGenreId == parent.Id))
                        db.MusicGenres.Add(new MusicGenre { Name = s, ParentGenreId = parent.Id });
                }
                db.SaveChanges();
            }

            AddSub("Rock", "Alternative Rock", "Hard Rock", "Progressive Rock", "Indie Rock", "Psychedelic Rock");
            AddSub("Electronic", "House", "Techno", "Drum and Bass", "Trance", "Dubstep", "IDM");
            AddSub("Jazz", "Bebop", "Swing", "Fusion", "Smooth Jazz", "Free Jazz");
            AddSub("Metal", "Heavy Metal", "Black Metal", "Death Metal", "Thrash Metal", "Doom Metal");
            AddSub("Hip Hop", "Trap", "Boom Bap", "Gangsta Rap", "Conscious Hip Hop");
            AddSub("Pop", "Dance Pop", "Synthpop", "K-Pop", "Electropop");
            AddSub("R&B", "Contemporary R&B", "Neo-Soul", "Quiet Storm");
            AddSub("Classical", "Baroque", "Romantic", "20th Century", "Contemporary Classical");
            AddSub("Latin", "Salsa", "Reggaeton", "Bossa Nova", "Tango");
            AddSub("Folk", "Celtic", "Americana", "Singer-Songwriter");
            AddSub("Blues", "Delta Blues", "Chicago Blues", "Electric Blues");
            AddSub("Country", "Country Pop", "Bluegrass", "Alt-Country");
            AddSub("Reggae", "Roots Reggae", "Dancehall", "Dub");
            AddSub("World", "Afrobeat", "Celtic", "Klezmer", "Middle Eastern");
            AddSub("Soul", "Motown", "Southern Soul", "Psychedelic Soul");
            AddSub("Punk", "Hardcore Punk", "Post-Punk", "Pop Punk");
            AddSub("Funk", "P-Funk", "Nu-Funk", "Funk Rock");
            AddSub("Ambient", "Dark Ambient", "Space Ambient", "Drone");
            AddSub("Experimental", "Noise", "Avant-Garde", "Electroacoustic");

            // Level 3 examples
            void AddSubLevel3(string grandParent, string parent, params string[] subs)
            {
                var gp = db.MusicGenres.FirstOrDefault(g => g.Name == grandParent);
                if (gp == null) return;
                var p = db.MusicGenres.FirstOrDefault(g => g.Name == parent && g.ParentGenreId == gp.Id);
                if (p == null) return;
                foreach (var s in subs)
                {
                    if (!db.MusicGenres.Any(g => g.Name == s && g.ParentGenreId == p.Id))
                        db.MusicGenres.Add(new MusicGenre { Name = s, ParentGenreId = p.Id });
                }
                db.SaveChanges();
            }

            AddSubLevel3("Electronic", "House", "Deep House", "Progressive House", "Tech House");
            AddSubLevel3("Electronic", "Drum and Bass", "Liquid Drum and Bass", "Neurofunk");
            AddSubLevel3("Rock", "Alternative Rock", "Grunge", "Shoegaze");
            AddSubLevel3("Jazz", "Bebop", "Hard Bop");
            AddSubLevel3("Metal", "Black Metal", "Symphonic Black Metal", "Atmospheric Black Metal");

            // final save
            db.SaveChanges();
        }
    }
}

