namespace AudioVerse.SetupWizard;

public static class ManageMenu
{
    public static async Task ShowAsync(string workingDirectory)
    {
        CancellationTokenSource? schedulerCts = null;
        Task? schedulerTask = null;

        while (true)
        {
            ConsoleHelper.Banner("AudioVerse Management");
            Console.WriteLine("   1) Start        (docker compose up -d)");
            Console.WriteLine("   2) Stop         (docker compose down)");
            Console.WriteLine("   3) Rebuild      (build --no-cache && up)");
            Console.WriteLine("   4) Backup DB    (pg_dump)");
            Console.WriteLine("   5) Restore DB   (from backup file)");
            Console.WriteLine("   6) Logs         (docker compose logs -f api)");
            Console.WriteLine("   7) Shell        (exec into api container)");
            Console.WriteLine("   8) Start backup scheduler");
            Console.WriteLine("   9) Stop backup scheduler");
            Console.WriteLine("  10) Health check (port scan)");
            Console.WriteLine("  11) Exit");
            Console.Write("  Choose: ");

            var key = Console.ReadLine()?.Trim();
            if (string.IsNullOrEmpty(key)) continue;

            switch (key)
            {
                case "1":
                    await ProcessHelper.RunAsync("docker", "compose up -d", workingDirectory);
                    break;

                case "2":
                    await ProcessHelper.RunAsync("docker", "compose down", workingDirectory);
                    break;

                case "3":
                    await ProcessHelper.RunAsync("docker", "compose build --no-cache", workingDirectory);
                    await ProcessHelper.RunAsync("docker", "compose up -d", workingDirectory);
                    break;

                case "4":
                    await RunBackupAsync(workingDirectory);
                    break;

                case "5":
                    await RunRestoreAsync(workingDirectory);
                    break;

                case "6":
                    await ProcessHelper.RunAsync("docker", "compose logs -f api", workingDirectory);
                    break;

                case "7":
                    await ProcessHelper.RunAsync("docker", "compose exec api sh", workingDirectory);
                    break;

                case "8":
                    if (schedulerTask != null && !schedulerTask.IsCompleted)
                    {
                        ConsoleHelper.Warn("Scheduler already running.");
                    }
                    else
                    {
                        var minutes = int.TryParse(ConsoleHelper.Ask("Backup interval (minutes)", "1440"), out var m) ? m : 1440;
                        var retention = int.TryParse(ConsoleHelper.Ask("Retention count", "7"), out var r) ? r : 7;
                        schedulerCts = new CancellationTokenSource();
                        schedulerTask = BackupScheduler.RunAsync(workingDirectory, TimeSpan.FromMinutes(minutes), retention, schedulerCts.Token);
                        ConsoleHelper.Success("Backup scheduler started.");
                    }
                    break;

                case "9":
                    if (schedulerCts != null)
                    {
                        await schedulerCts.CancelAsync();
                        schedulerCts = null;
                        schedulerTask = null;
                        ConsoleHelper.Success("Scheduler stopped.");
                    }
                    else
                    {
                        ConsoleHelper.Warn("Scheduler not running.");
                    }
                    break;

                case "10":
                    await RunHealthCheckAsync(workingDirectory);
                    break;

                case "11":
                    return;

                default:
                    ConsoleHelper.Warn("Unknown option.");
                    break;
            }
        }
    }

    private static async Task RunBackupAsync(string workingDirectory)
    {
        var backupDir = Path.Combine(workingDirectory, "backups");
        Directory.CreateDirectory(backupDir);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var backupFile = Path.Combine(backupDir, $"audioverse_db_{timestamp}.sql");

        var (pgUser, pgDb) = await BackupScheduler.ReadDbSettingsAsync(workingDirectory);

        ConsoleHelper.Info("Running DB backup (pg_dump)...");
        var args = $"compose exec -T postgres pg_dump -U {pgUser} {pgDb}";
        var ok = await ProcessHelper.CaptureToFileAsync("docker", args, workingDirectory, backupFile);
        if (ok) ConsoleHelper.Success($"Backup saved: {backupFile}");
        else ConsoleHelper.Error("Backup failed.");
    }

    private static async Task RunRestoreAsync(string workingDirectory)
    {
        var backupDir = Path.Combine(workingDirectory, "backups");
        if (!Directory.Exists(backupDir)) { ConsoleHelper.Warn("No backups directory found."); return; }

        var files = Directory.GetFiles(backupDir, "*.sql");
        if (files.Length == 0) { ConsoleHelper.Warn("No backup files found."); return; }

        Array.Sort(files);
        Console.WriteLine("  Available backups:");
        for (int i = 0; i < files.Length; i++)
            Console.WriteLine($"    {i + 1}) {Path.GetFileName(files[i])}");

        var sel = ConsoleHelper.Ask("Choose file number");
        if (!int.TryParse(sel, out var idx) || idx < 1 || idx > files.Length)
        {
            ConsoleHelper.Warn("Invalid selection.");
            return;
        }

        var fileToRestore = files[idx - 1];
        if (!ConsoleHelper.AskYesNo($"Restore from {Path.GetFileName(fileToRestore)}? This will OVERWRITE the database", false))
        {
            ConsoleHelper.Info("Aborted.");
            return;
        }

        var (pgUser, pgDb) = await BackupScheduler.ReadDbSettingsAsync(workingDirectory);
        var args = $"compose exec -T postgres psql -U {pgUser} {pgDb}";
        var ok = await ProcessHelper.PipeFileToProcessAsync("docker", args, workingDirectory, fileToRestore);
        if (ok) ConsoleHelper.Success("Restore completed.");
        else ConsoleHelper.Error("Restore failed.");
    }

    private static async Task RunHealthCheckAsync(string workingDirectory)
    {
        await ProcessHelper.RunAsync("docker", "compose ps", workingDirectory);

        ConsoleHelper.Info("TCP port scan (localhost):");
        var ports = new (string name, int port)[]
        {
            ("API", 5000), ("PostgreSQL", 5432), ("Redis", 6379),
            ("MinIO", 9000), ("HTTP", 80), ("HTTPS", 443),
            ("Elasticsearch", 9200), ("Kafka", 9092)
        };

        foreach (var (name, port) in ports)
        {
            var ok = await ProcessHelper.CheckTcpAsync("127.0.0.1", port);
            ConsoleHelper.TableRow($"{name} (:{port})", ok ? "OPEN" : "closed",
                ok ? ConsoleColor.Green : ConsoleColor.DarkGray);
        }
    }
}
