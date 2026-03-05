using System.Text.Json;
using AudioVerse.SetupWizard;

// AudioVerse Setup Wizard
// Usage:
//   dotnet run --project AudioVerse.SetupWizard              — interactive wizard
//   dotnet run --project AudioVerse.SetupWizard manage       — management menu
//   dotnet run --project AudioVerse.SetupWizard --apply      — generate + deploy
//   dotnet run --project AudioVerse.SetupWizard --force      — overwrite existing files
//   dotnet run --project AudioVerse.SetupWizard --minimal    — quick debug setup (PostgreSQL + Redis only)
//   dotnet run --project AudioVerse.SetupWizard --minimal --gpu — minimal + CREPE on GPU

var force = args.Contains("--force");
var apply = args.Contains("--apply");
var enableCertbot = args.Contains("--certbot");
var manage = args.Contains("--manage") || args.Contains("manage");
var minimal = args.Contains("--minimal");
var gpu = args.Contains("--gpu");

var repoRoot = Directory.GetParent(AppContext.BaseDirectory)!.Parent!.Parent!.Parent!.FullName;
var targetRoot = Environment.GetEnvironmentVariable("AUDIOVERSE_ROOT") ?? repoRoot;

// Load optional config file
SetupConfig? cfg = null;
var configPath = Path.Combine(targetRoot, "setupwizard.json");
if (File.Exists(configPath))
{
    try
    {
        var json = await File.ReadAllTextAsync(configPath);
        cfg = JsonSerializer.Deserialize<SetupConfig>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        ConsoleHelper.Info($"Loaded config from {configPath}");
    }
    catch (Exception ex)
    {
        ConsoleHelper.Warn($"Failed to read config: {ex.Message}");
    }
}

// ── Management mode ──
if (manage)
{
    await ManageMenu.ShowAsync(targetRoot);
    return 0;
}

// ── Minimal mode — quick debug setup, no questions asked ──
if (minimal)
{
    try
    {
        if (!Directory.Exists(targetRoot))
            Directory.CreateDirectory(targetRoot);

        ConsoleHelper.Banner("AudioVerse \u2014 Minimal Debug Setup");
        ConsoleHelper.Info($"Target directory: {targetRoot}");
        ConsoleHelper.Info(gpu
            ? "Karaoke + Audio AI services. CREPE w trybie GPU (NVIDIA CUDA)."
            : "Karaoke + all CPU audio AI services. No GPU services.");
        ConsoleHelper.Info("API is NOT containerized \u2014 run it from Visual Studio with F5.");

        var opts = new WizardOptions
        {
            Domain = "localhost",
            Environment = "Development",
            DebugMode = true,
            EnableKaraoke = true,
            // Audio AI
            EnableAudioAnalysis = true,
            EnableAudioPitch = true,
            AudioPitchGpu = gpu,
            EnableAudioRhythm = true,
            EnableAudioSeparate = true,
            EnableAudioTags = true,
            EnableAudioTagsPanns = true,
            EnableAudioVad = true,
            EnableSingScore = true,
            EnableLibrosa = true,
            AutoGeneratePasswords = true,
            SslMode = SslMode.SelfSigned,
            Force = force
        };

        var secrets = await WizardRunner.GenerateFilesAsync(targetRoot, opts, cfg);

        if (apply)
            await DeploymentApplier.ApplyAsync(targetRoot, opts, cfg, secrets);

        // Sync Postgres password — volume may retain old password from previous install.
        // Use docker compose exec (not docker exec) so we don't need to guess container name.
        // Connect as superuser 'postgres' because the app user may have wrong password or not exist yet.
        ConsoleHelper.Info("Waiting for Postgres to be ready...");
        await Task.Delay(3000);

        ConsoleHelper.Info("Synchronizing database password...");
        var syncResult = await SyncPostgresPasswordAsync(secrets, targetRoot);
        if (syncResult)
            ConsoleHelper.Success("Database password synchronized.");
        else
            ConsoleHelper.Warn("Could not sync DB password — container may not be running yet. Start compose first, then re-run installer.");

        ConsoleHelper.Success("Minimal setup complete. Run 'docker compose up -d' then start API from Visual Studio.");
        return 0;
    }
    catch (Exception ex)
    {
        ConsoleHelper.Error(ex.Message);
        return 1;
    }
}

// ── Interactive wizard ──
try
{
    if (!Directory.Exists(targetRoot))
        Directory.CreateDirectory(targetRoot);

    ConsoleHelper.Info($"Target directory: {targetRoot}");

    var opts = WizardRunner.RunInteractive(cfg);
    opts.Force = force;
    opts.EnableCertbot = opts.EnableCertbot || enableCertbot;

    var S = WizardStrings.Get(opts.Language);

    // Final confirmation
    Console.WriteLine();
    if (!ConsoleHelper.AskYesNo(S.ProceedPrompt, true))
    {
        ConsoleHelper.Info(S.Aborted);
        return 0;
    }

    var secrets = await WizardRunner.GenerateFilesAsync(targetRoot, opts, cfg);

    if (apply)
        await DeploymentApplier.ApplyAsync(targetRoot, opts, cfg, secrets);

    return 0;
}
catch (Exception ex)
{
    ConsoleHelper.Error(ex.Message);
    return 1;
}

// Sync Postgres password using docker compose exec.
// The POSTGRES_USER from .env IS the superuser inside the container (not 'postgres'),
// because docker-entrypoint creates exactly one superuser from POSTGRES_USER env var.
// Inside the container, psql -U <that_user> works via peer/trust on the unix socket.
static async Task<bool> SyncPostgresPasswordAsync(DeploymentSecrets secrets, string workDir)
{
    var escapedPw = secrets.PostgresPassword.Replace("'", "''");
    var user = secrets.PostgresUser;

    // ALTER own password — the POSTGRES_USER is already superuser, just ensure password matches .env.
    // Must specify -d postgres because the default DB (=username) may not exist.
    if (!await ProcessHelper.RunAsync("docker",
        $"compose exec -T postgres psql -U {user} -d postgres -c \"ALTER USER {user} WITH PASSWORD '{escapedPw}';\"", workDir))
        return false;

    return true;
}
