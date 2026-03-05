using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

BenchmarkSwitcher.FromAssembly(typeof(SongFilterBenchmarks).Assembly).Run(args);

/// <summary>Benchmark: in-memory song filtering (simulates hot-path FilterSongs logic)</summary>
[MemoryDiagnoser]
[SimpleJob(warmupCount: 3, iterationCount: 10)]
public class SongFilterBenchmarks
{
    private List<KaraokeSongFile> _songs = null!;

    [Params(100, 1000, 10000)]
    public int SongCount { get; set; }

    [GlobalSetup]
    public void Setup()
    {
        var genres = new[] { "Pop", "Rock", "Jazz", "Electronic", "Hip-Hop", "Classical" };
        var languages = new[] { "EN", "PL", "DE", "FR", "ES", "JP" };
        var rng = new Random(42);

        _songs = Enumerable.Range(1, SongCount).Select(i => new KaraokeSongFile
        {
            Id = i,
            Title = $"Song {i}",
            Artist = $"Artist {i % 50}",
            Genre = genres[rng.Next(genres.Length)],
            Language = languages[rng.Next(languages.Length)],
            Year = (2000 + rng.Next(25)).ToString(),
            Bpm = 80 + rng.Next(120),
            Format = (KaraokeFormat)(rng.Next(3)),
            InDevelopment = false
        }).ToList();
    }

    [Benchmark(Baseline = true)]
    public List<KaraokeSongFile> FilterByTitle()
    {
        return _songs.Where(s => s.Title.Contains("Song 5")).ToList();
    }

    [Benchmark]
    public List<KaraokeSongFile> FilterByGenreAndLanguage()
    {
        return _songs.Where(s => s.Genre == "Pop" && s.Language == "PL").ToList();
    }

    [Benchmark]
    public List<KaraokeSongFile> FilterByBpmRange()
    {
        return _songs.Where(s => s.Bpm >= 120 && s.Bpm <= 140).ToList();
    }

    [Benchmark]
    public List<KaraokeSongFile> FullTextSearch()
    {
        var q = "artist 1";
        return _songs.Where(s =>
            s.Title.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            s.Artist.Contains(q, StringComparison.OrdinalIgnoreCase)
        ).ToList();
    }

    [Benchmark]
    public List<KaraokeSongFile> SortByBpmDescending()
    {
        return _songs.OrderByDescending(s => s.Bpm).ToList();
    }

    [Benchmark]
    public List<KaraokeSongFile> CombinedFilterAndSort()
    {
        return _songs
            .Where(s => s.Genre == "Rock" && s.Bpm >= 100)
            .OrderBy(s => s.Title)
            .ToList();
    }
}

/// <summary>Benchmark: ranking/scoring computation</summary>
[MemoryDiagnoser]
[SimpleJob(warmupCount: 3, iterationCount: 10)]
public class RankingBenchmarks
{
    private List<(int PlayerId, decimal Score)> _scores = null!;

    [Params(100, 1000)]
    public int PlayerCount { get; set; }

    [GlobalSetup]
    public void Setup()
    {
        var rng = new Random(42);
        _scores = Enumerable.Range(1, PlayerCount)
            .SelectMany(p => Enumerable.Range(1, 10).Select(r => (PlayerId: p, Score: (decimal)(rng.NextDouble() * 100))))
            .ToList();
    }

    [Benchmark]
    public List<(int PlayerId, decimal AvgScore)> ComputeAverageRanking()
    {
        return _scores
            .GroupBy(s => s.PlayerId)
            .Select(g => (PlayerId: g.Key, AvgScore: g.Average(x => x.Score)))
            .OrderByDescending(x => x.AvgScore)
            .ToList();
    }

    [Benchmark]
    public List<(int PlayerId, decimal TotalScore)> ComputeTotalRanking()
    {
        return _scores
            .GroupBy(s => s.PlayerId)
            .Select(g => (PlayerId: g.Key, TotalScore: g.Sum(x => x.Score)))
            .OrderByDescending(x => x.TotalScore)
            .ToList();
    }
}
