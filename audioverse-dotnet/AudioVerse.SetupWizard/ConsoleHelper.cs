namespace AudioVerse.SetupWizard;

public static class ConsoleHelper
{
    public static void Banner(string text)
    {
        var line = new string('═', text.Length + 4);
        Console.WriteLine();
        Write(line, ConsoleColor.Cyan);
        Write($"  {text}  ", ConsoleColor.Cyan);
        Write(line, ConsoleColor.Cyan);
        Console.WriteLine();
    }

    public static void Section(string title)
    {
        Console.WriteLine();
        var line = new string('─', 50);
        Write(line, ConsoleColor.DarkGray);
        Write($"  {title}", ConsoleColor.Yellow);
        Write(line, ConsoleColor.DarkGray);
    }

    public static void Success(string text) => Write($"  ✓ {text}", ConsoleColor.Green);
    public static void Skip(string text) => Write($"  ✗ {text}", ConsoleColor.DarkGray);
    public static void Warn(string text) => Write($"  ⚠ {text}", ConsoleColor.DarkYellow);
    public static void Info(string text) => Write($"  ℹ {text}", ConsoleColor.DarkCyan);
    public static void Error(string text) => Write($"  ✗ {text}", ConsoleColor.Red);

    public static void Write(string text, ConsoleColor color)
    {
        var prev = Console.ForegroundColor;
        Console.ForegroundColor = color;
        Console.WriteLine(text);
        Console.ForegroundColor = prev;
    }

    public static string Ask(string prompt, string defaultValue = "")
    {
        var hint = string.IsNullOrEmpty(defaultValue) ? "" : $" [{defaultValue}]";
        Console.Write($"  {prompt}{hint}: ");
        var input = Console.ReadLine()?.Trim();
        return string.IsNullOrEmpty(input) ? defaultValue : input;
    }

    public static bool AskYesNo(string prompt, bool defaultYes)
    {
        var hint = defaultYes ? "[Y/n]" : "[y/N]";
        Console.Write($"  {prompt} {hint}: ");
        var input = Console.ReadLine()?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(input)) return defaultYes;
        return input is "y" or "yes";
    }

    public static int AskChoice(string prompt, string[] options, int defaultIndex = 0)
    {
        Console.WriteLine($"  {prompt}");
        for (int i = 0; i < options.Length; i++)
        {
            var marker = i == defaultIndex ? "*" : " ";
            Console.WriteLine($"    {marker} {i + 1}) {options[i]}");
        }
        Console.Write($"  Choice [{defaultIndex + 1}]: ");
        var input = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(input)) return defaultIndex;
        return int.TryParse(input, out var idx) && idx >= 1 && idx <= options.Length ? idx - 1 : defaultIndex;
    }

    public static void TableRow(string label, string value, ConsoleColor valueColor = ConsoleColor.White)
    {
        var padded = label.PadRight(32, '.');
        Console.Write($"  {padded} ");
        var prev = Console.ForegroundColor;
        Console.ForegroundColor = valueColor;
        Console.WriteLine(value);
        Console.ForegroundColor = prev;
    }
}
