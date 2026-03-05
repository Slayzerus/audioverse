namespace AudioVerse.SetupWizard;

public static class BackupScheduler
{
    public static async Task RunAsync(string workingDirectory, TimeSpan interval, int retention, CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            try
            {
                var backupDir = Path.Combine(workingDirectory, "backups");
                Directory.CreateDirectory(backupDir);
                var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                var backupFile = Path.Combine(backupDir, $"audioverse_db_{timestamp}.sql");

                var (pgUser, pgDb) = await ReadDbSettingsAsync(workingDirectory);

                Console.WriteLine($"[Scheduler] Running backup to {backupFile}");
                var args = $"compose exec -T postgres pg_dump -U {pgUser} {pgDb}";
                var ok = await ProcessHelper.CaptureToFileAsync("docker", args, workingDirectory, backupFile);
                Console.WriteLine(ok ? $"[Scheduler] Backup saved to {backupFile}" : "[Scheduler] Backup failed");

                RotateBackups(backupDir, retention);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                Console.WriteLine($"[Scheduler] Error: {ex.Message}");
            }

            try { await Task.Delay(interval, token); }
            catch (TaskCanceledException) { break; }
        }
    }

    public static async Task<(string user, string db)> ReadDbSettingsAsync(string workingDirectory)
    {
        var envPath = Path.Combine(workingDirectory, ".env");
        var pgUser = "audioverse";
        var pgDb = "audioverse_db";

        if (File.Exists(envPath))
        {
            var lines = await File.ReadAllLinesAsync(envPath);
            foreach (var ln in lines)
            {
                if (ln.StartsWith("POSTGRES_USER=")) pgUser = ln["POSTGRES_USER=".Length..].Trim();
                if (ln.StartsWith("POSTGRES_DB=")) pgDb = ln["POSTGRES_DB=".Length..].Trim();
            }
        }

        return (pgUser, pgDb);
    }

    private static void RotateBackups(string backupDir, int retention)
    {
        var files = Directory.GetFiles(backupDir, "*.sql");
        Array.Sort(files);
        if (files.Length <= retention) return;
        var toDelete = files.Length - retention;
        for (int i = 0; i < toDelete; i++)
        {
            try { File.Delete(files[i]); }
            catch { /* non-fatal */ }
        }
    }
}
