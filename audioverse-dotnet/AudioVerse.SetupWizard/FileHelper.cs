namespace AudioVerse.SetupWizard;

public static class FileHelper
{
    public static async Task WriteIfChangedAsync(string path, string content, bool force)
    {
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        if (File.Exists(path))
        {
            var existing = await File.ReadAllTextAsync(path);
            if (existing == content && !force)
            {
                ConsoleHelper.Skip($"Unchanged: {Path.GetFileName(path)}");
                return;
            }
            if (!force)
            {
                ConsoleHelper.Warn($"Exists: {Path.GetFileName(path)} (use --force to overwrite)");
                return;
            }
        }

        await File.WriteAllTextAsync(path, content);
        ConsoleHelper.Success(Path.GetFileName(path));
    }
}
