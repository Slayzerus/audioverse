using System.Diagnostics;

namespace AudioVerse.SetupWizard;

public static class ProcessHelper
{
    public static Task<bool> RunAsync(string fileName, string arguments, string workingDirectory)
    {
        var tcs = new TaskCompletionSource<bool>();
        try
        {
            var psi = new ProcessStartInfo(fileName, arguments)
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            var p = Process.Start(psi)!;
            p.OutputDataReceived += (_, e) => { if (e.Data != null) Console.WriteLine(e.Data); };
            p.ErrorDataReceived += (_, e) => { if (e.Data != null) Console.Error.WriteLine(e.Data); };
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            p.EnableRaisingEvents = true;
            p.Exited += (_, _) => tcs.SetResult(p.ExitCode == 0);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to run process: {ex.Message}");
            tcs.SetResult(false);
        }
        return tcs.Task;
    }

    public static async Task<bool> CaptureToFileAsync(string fileName, string arguments, string workingDirectory, string outputFile)
    {
        try
        {
            var psi = new ProcessStartInfo(fileName, arguments)
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var p = Process.Start(psi)!;
            await using var fs = new FileStream(outputFile, FileMode.Create, FileAccess.Write, FileShare.None);
            await p.StandardOutput.BaseStream.CopyToAsync(fs);
            p.WaitForExit();
            if (p.ExitCode != 0)
            {
                var err = await p.StandardError.ReadToEndAsync();
                Console.Error.WriteLine(err);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to capture process output: {ex.Message}");
            return false;
        }
    }

    public static async Task<bool> PipeFileToProcessAsync(string fileName, string arguments, string workingDirectory, string inputFile)
    {
        try
        {
            var psi = new ProcessStartInfo(fileName, arguments)
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var p = Process.Start(psi)!;
            await using var fs = new FileStream(inputFile, FileMode.Open, FileAccess.Read, FileShare.Read);
            await fs.CopyToAsync(p.StandardInput.BaseStream);
            p.StandardInput.Close();
            await p.StandardOutput.ReadToEndAsync();
            var error = await p.StandardError.ReadToEndAsync();
            p.WaitForExit();
            if (p.ExitCode != 0)
            {
                Console.Error.WriteLine(error);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to pipe file to process: {ex.Message}");
            return false;
        }
    }

    public static async Task<bool> CheckTcpAsync(string host, int port, int timeoutMs = 1000)
    {
        try
        {
            using var c = new System.Net.Sockets.TcpClient();
            var task = c.ConnectAsync(host, port);
            var completed = await Task.WhenAny(task, Task.Delay(timeoutMs));
            return completed == task && c.Connected;
        }
        catch { return false; }
    }
}
