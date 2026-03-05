namespace AudioVerse.SetupWizard;

public static class DeploymentApplier
{
    public static async Task<bool> ApplyAsync(string targetRoot, WizardOptions opts, SetupConfig? cfg, DeploymentSecrets? secrets = null)
    {
        ConsoleHelper.Section("APPLYING DEPLOYMENT");

        ConsoleHelper.Info("Starting docker compose...");
        if (!await ProcessHelper.RunAsync("docker", "compose up -d", targetRoot))
            return false;

        // Sync Postgres password — POSTGRES_PASSWORD only works on first init,
        // existing volumes keep the old password. ALTER USER ensures it matches.
        // Use docker exec (not compose exec) to avoid .env variable interpolation.
        if (secrets != null)
        {
            ConsoleHelper.Info("Synchronizing database password...");
            if (await SyncPasswordAsync(secrets, targetRoot))
                ConsoleHelper.Success("Database password synchronized.");
            else
                ConsoleHelper.Warn("Could not sync DB password — you may need to reset it manually.");
        }

        ConsoleHelper.Info("Running database migrations...");
        var migrateCmd = "compose exec api dotnet ef database update --project AudioVerse.Infrastructure --startup-project AudioVerse.API";
        if (!await ProcessHelper.RunAsync("docker", migrateCmd, targetRoot))
            return false;

        ConsoleHelper.Info("Restarting API to trigger startup tasks...");
        if (!await ProcessHelper.RunAsync("docker", "compose restart api", targetRoot))
            return false;

        // Reload nginx to pick up any config changes (volume-mounted nginx.conf)
        ConsoleHelper.Info("Reloading nginx configuration...");
        if (await ProcessHelper.RunAsync("docker", "compose exec -T nginx nginx -t", targetRoot))
        {
            await ProcessHelper.RunAsync("docker", "compose exec -T nginx nginx -s reload", targetRoot);
            ConsoleHelper.Success("Nginx configuration reloaded.");
        }
        else
        {
            ConsoleHelper.Warn("Nginx config test failed — skipping reload. Check nginx/nginx.conf manually.");
        }

        if (opts.EnableCertbot && cfg != null && !string.IsNullOrEmpty(cfg.Domain) && !string.IsNullOrEmpty(cfg.Email))
            await ObtainCertificateAsync(targetRoot, cfg);

        ConsoleHelper.Success("Deployment applied successfully.");
        return true;
    }

    private static async Task ObtainCertificateAsync(string targetRoot, SetupConfig cfg)
    {
        ConsoleHelper.Info($"Obtaining Let's Encrypt cert for {cfg.Domain}...");
        Directory.CreateDirectory(Path.Combine(targetRoot, "nginx", "www"));

        var certCmd = $"compose run --rm certbot certonly --webroot -w /var/www/certbot -d {cfg.Domain} --email {cfg.Email} --agree-tos --non-interactive";
        var attempts = cfg.RetryAttempts > 0 ? cfg.RetryAttempts : 3;
        var delay = cfg.RetryDelaySeconds > 0 ? cfg.RetryDelaySeconds : 10;
        var success = false;

        for (int i = 1; i <= attempts; i++)
        {
            ConsoleHelper.Info($"certbot attempt {i}/{attempts}...");
            if (await ProcessHelper.RunAsync("docker", certCmd, targetRoot))
            {
                success = true;
                break;
            }
            ConsoleHelper.Warn($"Attempt {i} failed, retrying in {delay}s...");
            await Task.Delay(delay * 1000);
        }

        if (!success)
        {
            ConsoleHelper.Error("certbot failed after all retries.");
            return;
        }

        var letsPath = Path.Combine(targetRoot, "certs", "live", cfg.Domain!);
        var dest = Path.Combine(targetRoot, "certs");
        try
        {
            if (Directory.Exists(letsPath))
            {
                File.Copy(Path.Combine(letsPath, "fullchain.pem"), Path.Combine(dest, "fullchain.pem"), true);
                File.Copy(Path.Combine(letsPath, "privkey.pem"), Path.Combine(dest, "privkey.pem"), true);
                ConsoleHelper.Success("Certificates obtained and copied.");
            }
        }
        catch (Exception ex)
        {
            ConsoleHelper.Error($"Failed to copy certs: {ex.Message}");
        }

        await ProcessHelper.RunAsync("docker", "compose exec nginx nginx -s reload", targetRoot);
    }

    private static async Task<bool> SyncPasswordAsync(DeploymentSecrets secrets, string workDir)
    {
        var escapedPw = secrets.PostgresPassword.Replace("'", "''");
        var user = secrets.PostgresUser;

        // POSTGRES_USER is the superuser inside the container — use it directly
        return await ProcessHelper.RunAsync("docker",
            $"compose exec -T postgres psql -U {user} -d postgres -c \"ALTER USER {user} WITH PASSWORD '{escapedPw}';\"", workDir);
    }
}
