using AudioVerse.Domain.Entities.News;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeder kategorii i feedów RSS — pokrywa wszystkie obszary zainteresowań
/// w językach: PL, EN, DE, FR, IT, ES, ZH, JA.
/// Wszystkie feedy domyślnie włączone (IsActive = true).
/// </summary>
public static class NewsFeedSeeder
{
    public static async Task SeedNewsFeedsAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AudioVerseDbContext>>();

        if (await db.NewsFeedCategories.AnyAsync())
        {
            logger.LogInformation("News feed categories already seeded — skipping");
            return;
        }

        logger.LogInformation("Seeding news feed categories and RSS feeds…");

        // ── Kategorie ──
        var muzyka     = new NewsFeedCategory { Name = "Muzyka",           Slug = "music",            SortOrder = 1 };
        var sport      = new NewsFeedCategory { Name = "Sport",            Slug = "sport",            SortOrder = 2 };
        var gryVideo   = new NewsFeedCategory { Name = "Gry video",        Slug = "video-games",      SortOrder = 3 };
        var gryPlan    = new NewsFeedCategory { Name = "Gry planszowe",    Slug = "board-games",      SortOrder = 4 };
        var filmy      = new NewsFeedCategory { Name = "Filmy",            Slug = "movies",           SortOrder = 5 };
        var seriale    = new NewsFeedCategory { Name = "Seriale",          Slug = "tv-series",        SortOrder = 6 };
        var technologia= new NewsFeedCategory { Name = "Technologia",      Slug = "technology",       SortOrder = 7 };
        var nauka      = new NewsFeedCategory { Name = "Nauka",            Slug = "science",          SortOrder = 8 };
        var anime      = new NewsFeedCategory { Name = "Anime & Manga",    Slug = "anime-manga",      SortOrder = 9 };
        var ksiazki    = new NewsFeedCategory { Name = "Książki",          Slug = "books",            SortOrder = 10 };
        var motoryzacja= new NewsFeedCategory { Name = "Motoryzacja",      Slug = "automotive",       SortOrder = 11 };
        var sztuka     = new NewsFeedCategory { Name = "Sztuka & Design",  Slug = "art-design",       SortOrder = 12 };
        var kulinaria  = new NewsFeedCategory { Name = "Kulinaria",        Slug = "food",             SortOrder = 13 };
        var podroze    = new NewsFeedCategory { Name = "Podróże",          Slug = "travel",           SortOrder = 14 };
        var biznes     = new NewsFeedCategory { Name = "Biznes & Finanse", Slug = "business",         SortOrder = 15 };

        db.NewsFeedCategories.AddRange(muzyka, sport, gryVideo, gryPlan, filmy, seriale, technologia, nauka, anime, ksiazki, motoryzacja, sztuka, kulinaria, podroze, biznes);
        await db.SaveChangesAsync();

        // ── Helper ──
        static NewsFeed F(NewsFeedCategory cat, string title, string url, string lang, string? site = null, int interval = 15)
            => new() { Category = cat, CategoryId = cat.Id, Title = title, FeedUrl = url, SiteUrl = site, Language = lang, RefreshIntervalMinutes = interval, IsActive = true };

        var feeds = new List<NewsFeed>
        {
            // ══════════════════════════ MUZYKA ══════════════════════════
            // PL
            F(muzyka, "Muzyka Onet (PL)",             "https://wiadomosci.onet.pl/muzyka.xml",                         "pl", "https://onet.pl"),
            F(muzyka, "Antyradio News (PL)",           "https://antyradio.pl/feed/",                                    "pl", "https://antyradio.pl"),
            F(muzyka, "Teraz Rock (PL)",               "https://terazrock.pl/feed/",                                    "pl", "https://terazrock.pl"),
            // EN
            F(muzyka, "Pitchfork News (EN)",           "https://pitchfork.com/feed/feed-news/rss",                      "en", "https://pitchfork.com"),
            F(muzyka, "Stereogum (EN)",                "https://www.stereogum.com/feed/",                               "en", "https://stereogum.com"),
            F(muzyka, "Consequence of Sound (EN)",     "https://consequence.net/feed/",                                 "en", "https://consequence.net"),
            F(muzyka, "NME Music (EN)",                "https://www.nme.com/music/feed",                                "en", "https://nme.com"),
            F(muzyka, "Billboard (EN)",                "https://www.billboard.com/feed/",                                "en", "https://billboard.com"),
            // DE
            F(muzyka, "Musikexpress (DE)",             "https://www.musikexpress.de/feed/",                              "de", "https://musikexpress.de"),
            F(muzyka, "laut.de News (DE)",             "https://www.laut.de/rss/news.rdf",                              "de", "https://laut.de"),
            // FR
            F(muzyka, "Les Inrockuptibles Musique (FR)","https://www.lesinrocks.com/musique/feed/",                     "fr", "https://lesinrocks.com"),
            // ES
            F(muzyka, "Jenesaispop (ES)",              "https://jenesaispop.com/feed/",                                 "es", "https://jenesaispop.com"),
            // IT
            F(muzyka, "Rockol (IT)",                   "https://www.rockol.it/rss.xml",                                 "it", "https://rockol.it"),
            // JA
            F(muzyka, "Natalie Music (JA)",            "https://natalie.mu/music/feed/news",                            "ja", "https://natalie.mu/music"),
            // ZH
            F(muzyka, "QQ Music Top (ZH)",             "https://c.y.qq.com/rss/musicnews.xml",                          "zh"),

            // ══════════════════════════ SPORT ══════════════════════════
            // PL
            F(sport, "Sport.pl (PL)",                  "https://www.sport.pl/rss.xml",                                  "pl", "https://sport.pl"),
            F(sport, "Przegląd Sportowy (PL)",         "https://www.przegladsportowy.pl/rss.xml",                       "pl", "https://przegladsportowy.pl"),
            F(sport, "Meczyki.pl (PL)",                "https://meczyki.pl/feed/",                                      "pl", "https://meczyki.pl"),
            // EN
            F(sport, "ESPN Top Headlines (EN)",        "https://www.espn.com/espn/rss/news",                            "en", "https://espn.com"),
            F(sport, "BBC Sport (EN)",                 "https://feeds.bbci.co.uk/sport/rss.xml",                        "en", "https://bbc.co.uk/sport"),
            F(sport, "The Athletic (EN)",              "https://theathletic.com/feed/",                                  "en", "https://theathletic.com"),
            // DE
            F(sport, "kicker.de (DE)",                 "https://rss.kicker.de/news/aktuell",                            "de", "https://kicker.de"),
            F(sport, "Sport1 (DE)",                    "https://www.sport1.de/rss/sport1_aktuell.xml",                   "de", "https://sport1.de"),
            // FR
            F(sport, "L'Équipe (FR)",                  "https://www.lequipe.fr/rss/actu_rss.xml",                       "fr", "https://lequipe.fr"),
            // ES
            F(sport, "Marca (ES)",                     "https://e00-marca.uecdn.es/rss/portada.xml",                    "es", "https://marca.com"),
            F(sport, "AS (ES)",                        "https://as.com/rss/tags/ultimas_noticias.xml",                   "es", "https://as.com"),
            // IT
            F(sport, "Gazzetta dello Sport (IT)",      "https://www.gazzetta.it/rss/home.xml",                          "it", "https://gazzetta.it"),
            // JA
            F(sport, "Number Web (JA)",                "https://number.bunshun.jp/list/rss",                            "ja", "https://number.bunshun.jp"),
            // ZH
            F(sport, "Sina Sports (ZH)",               "https://sports.sina.com.cn/rss/sports.xml",                     "zh", "https://sports.sina.com.cn"),

            // ══════════════════════════ GRY VIDEO ══════════════════════════
            // PL
            F(gryVideo, "Gry-Online.pl (PL)",          "https://www.gry-online.pl/rss/news.xml",                        "pl", "https://gry-online.pl"),
            F(gryVideo, "Eurogamer.pl (PL)",           "https://www.eurogamer.pl/feed",                                 "pl", "https://eurogamer.pl"),
            F(gryVideo, "PPE.pl (PL)",                 "https://ppe.pl/feed/",                                          "pl", "https://ppe.pl"),
            // EN
            F(gryVideo, "IGN (EN)",                    "https://feeds.feedburner.com/ign/all",                           "en", "https://ign.com"),
            F(gryVideo, "Kotaku (EN)",                 "https://kotaku.com/rss",                                        "en", "https://kotaku.com"),
            F(gryVideo, "PC Gamer (EN)",               "https://www.pcgamer.com/rss/",                                  "en", "https://pcgamer.com"),
            F(gryVideo, "Rock Paper Shotgun (EN)",     "https://www.rockpapershotgun.com/feed",                         "en", "https://rockpapershotgun.com"),
            F(gryVideo, "Eurogamer.net (EN)",          "https://www.eurogamer.net/feed",                                "en", "https://eurogamer.net"),
            // DE
            F(gryVideo, "GameStar (DE)",               "https://www.gamestar.de/rss/news.xml",                          "de", "https://gamestar.de"),
            F(gryVideo, "4Players (DE)",               "https://www.4players.de/4players.php/rss/Allgemein/",            "de", "https://4players.de"),
            // FR
            F(gryVideo, "Jeuxvideo.com (FR)",          "https://www.jeuxvideo.com/rss/rss.xml",                         "fr", "https://jeuxvideo.com"),
            F(gryVideo, "Gamekult (FR)",               "https://www.gamekult.com/feed.xml",                             "fr", "https://gamekult.com"),
            // ES
            F(gryVideo, "3DJuegos (ES)",               "https://www.3djuegos.com/universo/rss/rss.php?plataformas=1,2,3,4,5,6,7,8&tipos=noticia", "es", "https://3djuegos.com"),
            F(gryVideo, "Vandal (ES)",                 "https://vandal.elespanol.com/xml.cgi",                          "es", "https://vandal.elespanol.com"),
            // IT
            F(gryVideo, "Multiplayer.it (IT)",         "https://multiplayer.it/feed/rss/",                              "it", "https://multiplayer.it"),
            // JA
            F(gryVideo, "4Gamer.net (JA)",             "https://www.4gamer.net/rss/index.xml",                          "ja", "https://4gamer.net"),
            F(gryVideo, "Famitsu (JA)",                "https://www.famitsu.com/feed/",                                 "ja", "https://famitsu.com"),
            // ZH
            F(gryVideo, "游民星空 Gamersky (ZH)",       "https://www.gamersky.com/rss/",                                "zh", "https://gamersky.com"),

            // ══════════════════════════ GRY PLANSZOWE ══════════════════════════
            // PL
            F(gryPlan, "Planszeo (PL)",                "https://planszeo.pl/feed/",                                     "pl", "https://planszeo.pl"),
            F(gryPlan, "Portal Games Blog (PL)",       "https://portalgames.pl/pl/blog/feed/",                          "pl", "https://portalgames.pl"),
            // EN
            F(gryPlan, "BoardGameGeek News (EN)",      "https://boardgamegeek.com/rss/boardgamenews",                   "en", "https://boardgamegeek.com"),
            F(gryPlan, "Dice Tower News (EN)",         "https://www.dicetower.com/feed",                                "en", "https://dicetower.com"),
            F(gryPlan, "Shut Up & Sit Down (EN)",      "https://www.shutupandsitdown.com/feed/",                        "en", "https://shutupandsitdown.com"),
            // DE
            F(gryPlan, "Brettspiel News (DE)",         "https://www.brettspielbox.de/feed/",                            "de", "https://brettspielbox.de"),
            F(gryPlan, "Hunter & Cron (DE)",           "https://www.huntercron.de/feed/",                               "de", "https://huntercron.de"),
            // FR
            F(gryPlan, "Ludovox (FR)",                 "https://ludovox.fr/feed/",                                      "fr", "https://ludovox.fr"),
            // ES
            F(gryPlan, "Análisis Paralisis (ES)",      "https://analisisparalisis.es/feed/",                            "es", "https://analisisparalisis.es"),
            // JA
            F(gryPlan, "Board Game to Life (JA)",      "https://boardgametolife.com/feed/",                             "ja", "https://boardgametolife.com"),

            // ══════════════════════════ FILMY ══════════════════════════
            // PL
            F(filmy, "Filmweb News (PL)",              "https://www.filmweb.pl/feed/news/latest",                       "pl", "https://filmweb.pl"),
            // EN
            F(filmy, "Screen Rant (EN)",               "https://screenrant.com/feed/",                                  "en", "https://screenrant.com"),
            F(filmy, "The Hollywood Reporter (EN)",    "https://www.hollywoodreporter.com/feed/",                       "en", "https://hollywoodreporter.com"),
            F(filmy, "Collider (EN)",                  "https://collider.com/feed/",                                    "en", "https://collider.com"),
            F(filmy, "IndieWire (EN)",                 "https://www.indiewire.com/feed/",                               "en", "https://indiewire.com"),
            // DE
            F(filmy, "Filmstarts.de (DE)",             "https://www.filmstarts.de/rss/news.xml",                        "de", "https://filmstarts.de"),
            // FR
            F(filmy, "AlloCiné (FR)",                  "https://www.allocine.fr/rss/news.xml",                          "fr", "https://allocine.fr"),
            // ES
            F(filmy, "SensaCine (ES)",                 "https://www.sensacine.com/rss/noticias.xml",                    "es", "https://sensacine.com"),
            // IT
            F(filmy, "MYmovies (IT)",                  "https://www.mymovies.it/rss/news/",                             "it", "https://mymovies.it"),
            // JA
            F(filmy, "Eiga.com (JA)",                  "https://eiga.com/feed/",                                        "ja", "https://eiga.com"),
            // ZH
            F(filmy, "Mtime (ZH)",                     "https://rss.mtime.com/news/",                                  "zh", "https://mtime.com"),

            // ══════════════════════════ SERIALE ══════════════════════════
            // PL
            F(seriale, "naEKRANIE.pl Seriale (PL)",    "https://naekranie.pl/feed/seriale",                             "pl", "https://naekranie.pl"),
            // EN
            F(seriale, "TVLine (EN)",                  "https://tvline.com/feed/",                                      "en", "https://tvline.com"),
            F(seriale, "TV Insider (EN)",              "https://www.tvinsider.com/feed/",                               "en", "https://tvinsider.com"),
            F(seriale, "Deadline TV (EN)",             "https://deadline.com/category/tv/feed/",                        "en", "https://deadline.com"),
            // DE
            F(seriale, "Serienjunkies (DE)",           "https://www.serienjunkies.de/rss/news.xml",                     "de", "https://serienjunkies.de"),
            // FR
            F(seriale, "AlloCiné Séries (FR)",         "https://www.allocine.fr/rss/series.xml",                        "fr", "https://allocine.fr"),
            // ES
            F(seriale, "Espinof Series (ES)",          "https://www.espinof.com/category/series-de-television/feed",    "es", "https://espinof.com"),
            // JA
            F(seriale, "Natalie Drama (JA)",           "https://natalie.mu/eiga/feed/news",                             "ja", "https://natalie.mu/eiga"),

            // ══════════════════════════ TECHNOLOGIA ══════════════════════════
            // PL
            F(technologia, "Niebezpiecznik (PL)",      "https://niebezpiecznik.pl/feed/",                               "pl", "https://niebezpiecznik.pl"),
            F(technologia, "Antyweb (PL)",             "https://antyweb.pl/feed",                                       "pl", "https://antyweb.pl"),
            F(technologia, "Tabletowo (PL)",           "https://tabletowo.pl/feed/",                                    "pl", "https://tabletowo.pl"),
            // EN
            F(technologia, "Ars Technica (EN)",        "https://feeds.arstechnica.com/arstechnica/index",               "en", "https://arstechnica.com"),
            F(technologia, "The Verge (EN)",           "https://www.theverge.com/rss/index.xml",                        "en", "https://theverge.com"),
            F(technologia, "TechCrunch (EN)",          "https://techcrunch.com/feed/",                                  "en", "https://techcrunch.com"),
            F(technologia, "Hacker News Best (EN)",    "https://hnrss.org/best",                                        "en", "https://news.ycombinator.com"),
            F(technologia, "Wired (EN)",               "https://www.wired.com/feed/rss",                                "en", "https://wired.com"),
            // DE
            F(technologia, "Heise Online (DE)",        "https://www.heise.de/rss/heise-atom.xml",                       "de", "https://heise.de"),
            F(technologia, "Golem.de (DE)",            "https://rss.golem.de/rss.php?feed=ATOM1.0",                     "de", "https://golem.de"),
            // FR
            F(technologia, "Frandroid (FR)",           "https://www.frandroid.com/feed",                                "fr", "https://frandroid.com"),
            F(technologia, "01net (FR)",               "https://www.01net.com/rss/info/flux-rss/flux-toutes-les-actualites/", "fr", "https://01net.com"),
            // ES
            F(technologia, "Xataka (ES)",              "https://www.xataka.com/feedburner.xml",                         "es", "https://xataka.com"),
            // IT
            F(technologia, "Tom's Hardware IT (IT)",   "https://www.tomshw.it/feed/",                                   "it", "https://tomshw.it"),
            // JA
            F(technologia, "ITmedia (JA)",             "https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml",             "ja", "https://itmedia.co.jp"),
            F(technologia, "GIGAZINE (JA)",            "https://gigazine.net/news/rss_2.0/",                            "ja", "https://gigazine.net"),
            // ZH
            F(technologia, "36Kr (ZH)",                "https://36kr.com/feed",                                        "zh", "https://36kr.com"),

            // ══════════════════════════ NAUKA ══════════════════════════
            // PL
            F(nauka, "Crazy Nauka (PL)",               "https://www.crazynauka.pl/feed/",                               "pl", "https://crazynauka.pl"),
            // EN
            F(nauka, "Nature News (EN)",               "https://www.nature.com/nature.rss",                             "en", "https://nature.com"),
            F(nauka, "Science Daily (EN)",             "https://www.sciencedaily.com/rss/all.xml",                      "en", "https://sciencedaily.com"),
            F(nauka, "New Scientist (EN)",             "https://www.newscientist.com/feed/home/",                       "en", "https://newscientist.com"),
            // DE
            F(nauka, "Spektrum (DE)",                  "https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996d",    "de", "https://spektrum.de"),
            // FR
            F(nauka, "Futura Sciences (FR)",           "https://www.futura-sciences.com/rss/actualites.xml",            "fr", "https://futura-sciences.com"),
            // ES
            F(nauka, "Muy Interesante (ES)",           "https://www.muyinteresante.es/feed",                            "es", "https://muyinteresante.es"),
            // IT
            F(nauka, "Le Scienze (IT)",                "https://www.lescienze.it/rss/all/rss2.0.xml",                   "it", "https://lescienze.it"),
            // JA
            F(nauka, "Nikkei Science (JA)",            "https://www.nikkei-science.com/feed/",                          "ja", "https://nikkei-science.com"),

            // ══════════════════════════ ANIME & MANGA ══════════════════════════
            // PL
            F(anime, "Anime Online PL (PL)",           "https://anime-online.pl/feed/",                                 "pl", "https://anime-online.pl"),
            // EN
            F(anime, "Anime News Network (EN)",        "https://www.animenewsnetwork.com/all/rss.xml?ann-hierarchical", "en", "https://animenewsnetwork.com"),
            F(anime, "Crunchyroll News (EN)",          "https://www.crunchyroll.com/feed",                              "en", "https://crunchyroll.com"),
            F(anime, "MyAnimeList News (EN)",          "https://myanimelist.net/rss/news.xml",                          "en", "https://myanimelist.net"),
            // DE
            F(anime, "Anime2You (DE)",                 "https://www.anime2you.de/feed/",                                "de", "https://anime2you.de"),
            // FR
            F(anime, "Manga News (FR)",                "https://www.manga-news.com/index.php/rss",                      "fr", "https://manga-news.com"),
            // JA
            F(anime, "Anime!Anime! (JA)",              "https://animeanime.jp/rss/index.rdf",                           "ja", "https://animeanime.jp"),
            F(anime, "Natalie Comic (JA)",             "https://natalie.mu/comic/feed/news",                            "ja", "https://natalie.mu/comic"),

            // ══════════════════════════ KSIĄŻKI ══════════════════════════
            // PL
            F(ksiazki, "Lubimyczytac.pl (PL)",         "https://lubimyczytac.pl/rss",                                   "pl", "https://lubimyczytac.pl"),
            // EN
            F(ksiazki, "Book Riot (EN)",               "https://bookriot.com/feed/",                                    "en", "https://bookriot.com"),
            F(ksiazki, "Literary Hub (EN)",            "https://lithub.com/feed/",                                      "en", "https://lithub.com"),
            // DE
            F(ksiazki, "Buchreport (DE)",              "https://www.buchreport.de/feed/",                               "de", "https://buchreport.de"),
            // FR
            F(ksiazki, "Livres Hebdo (FR)",            "https://www.livreshebdo.fr/rss.xml",                            "fr", "https://livreshebdo.fr"),
            // ES
            F(ksiazki, "Lecturalia (ES)",              "https://www.lecturalia.com/rss/rss-ultimas-noticias.xml",        "es", "https://lecturalia.com"),
            // JA
            F(ksiazki, "Book Bang (JA)",               "https://www.bookbang.jp/feed",                                  "ja", "https://bookbang.jp"),

            // ══════════════════════════ MOTORYZACJA ══════════════════════════
            // PL
            F(motoryzacja, "Auto Świat (PL)",          "https://www.auto-swiat.pl/rss.xml",                             "pl", "https://auto-swiat.pl"),
            F(motoryzacja, "Moto.pl (PL)",             "https://moto.pl/feed/",                                         "pl", "https://moto.pl"),
            // EN
            F(motoryzacja, "Top Gear (EN)",            "https://www.topgear.com/feed/all/rss.xml",                      "en", "https://topgear.com"),
            F(motoryzacja, "Motor1 (EN)",              "https://www.motor1.com/rss/news/all/",                          "en", "https://motor1.com"),
            // DE
            F(motoryzacja, "Auto Motor Sport (DE)",    "https://www.auto-motor-und-sport.de/feed/",                     "de", "https://auto-motor-und-sport.de"),
            // FR
            F(motoryzacja, "Caradisiac (FR)",          "https://www.caradisiac.com/rss/",                               "fr", "https://caradisiac.com"),
            // ES
            F(motoryzacja, "Motorpasión (ES)",         "https://www.motorpasion.com/feedburner.xml",                    "es", "https://motorpasion.com"),
            // IT
            F(motoryzacja, "Quattroruote (IT)",        "https://www.quattroruote.it/rss.xml",                           "it", "https://quattroruote.it"),
            // JA
            F(motoryzacja, "Car Watch (JA)",           "https://car.watch.impress.co.jp/data/rss/1.0/car/feed.rdf",     "ja", "https://car.watch.impress.co.jp"),

            // ══════════════════════════ SZTUKA & DESIGN ══════════════════════════
            // EN
            F(sztuka, "Dezeen (EN)",                   "https://www.dezeen.com/feed/",                                  "en", "https://dezeen.com"),
            F(sztuka, "Colossal (EN)",                 "https://www.thisiscolossal.com/feed/",                          "en", "https://thisiscolossal.com"),
            F(sztuka, "It's Nice That (EN)",           "https://www.itsnicethat.com/feed",                              "en", "https://itsnicethat.com"),
            // DE
            F(sztuka, "Designtagebuch (DE)",           "https://www.designtagebuch.de/feed/",                           "de", "https://designtagebuch.de"),
            // FR
            F(sztuka, "Étapes (FR)",                   "https://etapes.com/feed/",                                      "fr", "https://etapes.com"),
            // JA
            F(sztuka, "JDN Design (JA)",               "https://www.japandesign.ne.jp/feed/",                           "ja", "https://japandesign.ne.jp"),

            // ══════════════════════════ KULINARIA ══════════════════════════
            // PL
            F(kulinaria, "Kwestia Smaku (PL)",         "https://www.kwestiasmaku.com/feed.xml",                         "pl", "https://kwestiasmaku.com"),
            // EN
            F(kulinaria, "Serious Eats (EN)",          "https://www.seriouseats.com/feed",                              "en", "https://seriouseats.com"),
            F(kulinaria, "Food52 (EN)",                "https://food52.com/blog.rss",                                   "en", "https://food52.com"),
            // DE
            F(kulinaria, "Chefkoch Magazin (DE)",      "https://www.chefkoch.de/magazin/rss",                           "de", "https://chefkoch.de"),
            // FR
            F(kulinaria, "Marmiton (FR)",              "https://www.marmiton.org/rss/recettes-du-jour.xml",             "fr", "https://marmiton.org"),
            // ES
            F(kulinaria, "Directo al Paladar (ES)",    "https://www.directoalpaladar.com/feedburner.xml",               "es", "https://directoalpaladar.com"),
            // IT
            F(kulinaria, "Giallo Zafferano (IT)",      "https://www.giallozafferano.it/rss.xml",                        "it", "https://giallozafferano.it"),
            // JA
            F(kulinaria, "Cookpad News (JA)",          "https://news.cookpad.com/feed",                                 "ja", "https://news.cookpad.com"),
            // ZH
            F(kulinaria, "下厨房 XiaChuFang (ZH)",     "https://www.xiachufang.com/feed/",                              "zh", "https://xiachufang.com"),

            // ══════════════════════════ PODRÓŻE ══════════════════════════
            // PL
            F(podroze, "Fly4free (PL)",                "https://www.fly4free.pl/feed/",                                 "pl", "https://fly4free.pl"),
            // EN
            F(podroze, "Lonely Planet (EN)",           "https://www.lonelyplanet.com/feed.xml",                         "en", "https://lonelyplanet.com"),
            F(podroze, "The Points Guy (EN)",          "https://thepointsguy.com/feed/",                                "en", "https://thepointsguy.com"),
            // DE
            F(podroze, "Urlaubsguru (DE)",             "https://www.urlaubsguru.de/feed/",                              "de", "https://urlaubsguru.de"),
            // FR
            F(podroze, "Le Routard (FR)",              "https://www.routard.com/rss/rss_actualites.xml",                "fr", "https://routard.com"),
            // ES
            F(podroze, "Viajeros Callejeros (ES)",     "https://www.viajeroscallejeros.com/feed/",                      "es", "https://viajeroscallejeros.com"),
            // IT
            F(podroze, "Viaggi (IT)",                  "https://viaggi.corriere.it/feed/",                              "it", "https://viaggi.corriere.it"),
            // JA
            F(podroze, "TABIPPO (JA)",                 "https://tabippo.net/feed/",                                     "ja", "https://tabippo.net"),

            // ══════════════════════════ BIZNES & FINANSE ══════════════════════════
            // PL
            F(biznes, "Money.pl (PL)",                 "https://www.money.pl/rss/rss.xml",                              "pl", "https://money.pl"),
            F(biznes, "Bankier.pl (PL)",               "https://www.bankier.pl/rss/wiadomosci.xml",                     "pl", "https://bankier.pl"),
            // EN
            F(biznes, "Bloomberg (EN)",                "https://feeds.bloomberg.com/markets/news.rss",                  "en", "https://bloomberg.com"),
            F(biznes, "Financial Times (EN)",          "https://www.ft.com/rss/home",                                   "en", "https://ft.com"),
            F(biznes, "CNBC (EN)",                     "https://www.cnbc.com/id/100003114/device/rss/rss.html",         "en", "https://cnbc.com"),
            // DE
            F(biznes, "Handelsblatt (DE)",             "https://www.handelsblatt.com/contentexport/feed/top-themen",    "de", "https://handelsblatt.com"),
            // FR
            F(biznes, "Les Échos (FR)",                "https://www.lesechos.fr/rss/rss_une.xml",                       "fr", "https://lesechos.fr"),
            // ES
            F(biznes, "Expansión (ES)",                "https://e00-expansion.uecdn.es/rss/portada.xml",                "es", "https://expansion.com"),
            // IT
            F(biznes, "Il Sole 24 Ore (IT)",           "https://www.ilsole24ore.com/rss/notizie.xml",                   "it", "https://ilsole24ore.com"),
            // JA
            F(biznes, "Nikkei (JA)",                   "https://www.nikkei.com/rss/",                                   "ja", "https://nikkei.com"),
            // ZH
            F(biznes, "Caixin (ZH)",                   "https://rss.caixin.com/feed/",                                  "zh", "https://caixin.com"),
        };

        db.NewsFeeds.AddRange(feeds);
        await db.SaveChangesAsync();

        logger.LogInformation("Seeded {CategoryCount} categories and {FeedCount} RSS feeds", 15, feeds.Count);
    }
}
