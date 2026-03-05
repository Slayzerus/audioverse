using System.Globalization;
using System.Text;
using AudioVerse.Application.Models.Laboratory;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;

namespace AudioVerse.API.Services;

/// <summary>
/// Generates a scientific laboratory PDF report with AudioVerse branding,
/// Times New Roman typography, QR experiment identifier, SVG-rendered
/// pitch charts, and latency bar diagrams.
/// </summary>
public static class LaboratoryReportPdfService
{
    private const string Primary = "#1a1a2e";
    private const string Accent = "#e94560";
    private const string Accent2 = "#0f3460";
    private const string CrepeClr = "#c62828";
    private const string PyinClr = "#1565c0";
    private const string Good = "#2e7d32";
    private const string Warn = "#ef6c00";
    private const string Bg = "#f5f5f8";
    private const string Border = "#d0d0d8";
    private const string TextDark = "#1a1a1a";
    private const string TextMuted = "#666666";
    private const string Font = "Times New Roman";

    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    public static byte[] Generate(LaboratoryReportData data, Guid? experimentGuid = null)
    {
        var guid = experimentGuid ?? Guid.NewGuid();
        var qrBytes = GenerateQrPng(guid);

        // Dynamic section numbers — sections 3+ are conditional; compute before rendering
        int _sn = 3;
        bool _hasPitchBench = data.BenchmarkResults?.Any(r =>
            r.ServiceName.Contains("CREPE", StringComparison.OrdinalIgnoreCase) ||
            r.ServiceName.Contains("pYIN", StringComparison.OrdinalIgnoreCase)) == true;
        int snHealth      = data.HealthResults?.Count > 0    ? _sn++ : -1;
        int snBenchmark   = _hasPitchBench                   ? _sn++ : -1;
        int snCalib       = data.CalibrationRows?.Count > 0  ? _sn++ : -1;
        int snCompare     = data.ComparisonRows?.Count > 0   ? _sn++ : -1;
        int snContour     = data.PitchContours?.Count > 0    ? _sn++ : -1;
        int snSeparation  = data.SeparationRows?.Count > 0   ? _sn++ : -1;
        int snDtw         = data.DtwRows?.Count > 0          ? _sn++ : -1;
        int snConclusions = _sn++;
        int snRefs        = _sn;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(0);
                page.MarginBottom(28);
                page.MarginHorizontal(0);
                page.DefaultTextStyle(x => x.FontFamily(Font).FontSize(10).FontColor(TextDark));

                page.Header().Element(c => Header(c, qrBytes));
                page.Content().PaddingHorizontal(42).PaddingTop(8).Column(col =>
                {
                    col.Spacing(14);
                    col.Item().Element(c => TitleBlock(c, data, guid));
                    col.Item().Element(c => Abstract(c, data));
                    col.Item().Element(c => SectionMeta(c, data));
                    col.Item().Element(c => SectionKpi(c, data));
                    if (data.HealthResults?.Count > 0)
                        col.Item().Element(c => SectionHealth(c, data.HealthResults, snHealth));
                    col.Item().PageBreak();
                    if (data.BenchmarkResults?.Count > 0)
                    {
                        var pitchBench = data.BenchmarkResults
                            .Where(r => r.ServiceName.Contains("CREPE", StringComparison.OrdinalIgnoreCase)
                                        || r.ServiceName.Contains("pYIN", StringComparison.OrdinalIgnoreCase))
                            .ToList();
                        if (pitchBench.Count > 0)
                            col.Item().Element(c => SectionBenchmark(c, pitchBench, snBenchmark));
                    }
                    if (data.CalibrationRows?.Count > 0)
                        col.Item().Element(c => SectionCalibration(c, data.CalibrationRows, snCalib));
                    if (data.ComparisonRows?.Count > 0)
                        col.Item().Element(c => SectionComparison(c, data.ComparisonRows, snCompare));
                    if (data.PitchContours?.Count > 0)
                        col.Item().Element(c => SectionPitchContour(c, data.PitchContours, snContour));
                    if (data.SeparationRows?.Count > 0)
                        col.Item().Element(c => SectionSeparation(c, data.SeparationRows, snSeparation));
                    if (data.DtwRows?.Count > 0)
                        col.Item().Element(c => SectionDtw(c, data.DtwRows, snDtw));
                    col.Item().Element(c => SectionConclusions(c, data, snConclusions));
                    col.Item().Element(c => References(c, snRefs));
                });
                page.Footer().Element(Footer);
            });
        });

        return doc.GeneratePdf();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HEADER
    // ═══════════════════════════════════════════════════════════════════════
    private static void Header(IContainer c, byte[] qrBytes)
    {
        c.Column(outer =>
        {
            outer.Item().Background(Primary).PaddingHorizontal(42).PaddingVertical(16).Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("AudioVerse").FontSize(28).Bold().FontColor(Colors.White);
                    inner.Item().Text("Pitch Detection Laboratory").FontSize(10)
                        .FontColor("#b0b0cc").Italic();
                });
                row.ConstantItem(64).AlignRight().AlignMiddle().Image(qrBytes).FitArea();
            });
            outer.Item().Height(3).Background(Accent);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════════════════════════
    private static void Footer(IContainer c)
    {
        c.PaddingHorizontal(42).BorderTop(0.5f).BorderColor(Border).PaddingTop(5).Row(row =>
        {
            row.RelativeItem().Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(7.5f).FontColor(TextMuted));
                t.Span("AudioVerse Laboratory Report").Bold().FontColor(Accent2);
                t.Span($"   ·   Generated {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
            });
            row.AutoItem().AlignRight().Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(7.5f).FontColor(TextMuted));
                t.CurrentPageNumber();
                t.Span(" / ");
                t.TotalPages();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TITLE
    // ═══════════════════════════════════════════════════════════════════════
    private static void TitleBlock(IContainer c, LaboratoryReportData data, Guid guid)
    {
        c.Column(col =>
        {
            col.Item().Text(data.ReportTitle ?? "Pitch Detection Algorithm Comparison")
               .FontSize(16).Bold().FontColor(Primary);
            col.Item().PaddingTop(2).Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(9).FontColor(TextMuted));
                t.Span("Operator: ");
                t.Span(data.Operator ?? "AudioVerse System").Bold().FontColor(TextDark);
                t.Span("   |   ");
                t.Span(data.ExperimentDate.ToString("yyyy-MM-dd HH:mm:ss UTC"));
            });
            col.Item().PaddingTop(2).Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(8).FontColor(TextMuted));
                t.Span("Experiment ID: ");
                t.Span(guid.ToString("D")).FontColor(Accent2);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ABSTRACT
    // ═══════════════════════════════════════════════════════════════════════
    private static void Abstract(IContainer c, LaboratoryReportData data)
    {
        c.Background(Bg).Border(0.5f).BorderColor(Border).Padding(14).Column(col =>
        {
            col.Item().Text("Abstract").FontSize(11).Bold().FontColor(Accent2);
            col.Item().PaddingTop(6).Text(
                "This report presents a comparative experiment on two fundamental frequency (F0) " +
                "detection algorithms: CREPE (Kim et al., ICASSP 2018) and pYIN (Mauch & Dixon, " +
                "ICASSP 2014). Experiments were conducted via the AudioVerse Laboratory module " +
                "(/api/karaoke/lab). Primary metrics: RMSE in cents, Accuracy@50c, Pearson " +
                "correlation, microservice response latency. " +
                (data.SeparationRows?.Count > 0
                    ? "Demucs source separation impact was additionally evaluated. " : "") +
                (data.DtwRows?.Count > 0
                    ? "Singing quality was scored using Dynamic Time Warping (DTW)." : "")
            ).FontSize(9).LineHeight(1.4f);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. PARAMETERS
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionMeta(IContainer c, LaboratoryReportData data)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, "1", "Experiment Parameters"));
            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(cd => { cd.RelativeColumn(3); cd.RelativeColumn(5); });
                MetaRow(table, "Report title", data.ReportTitle ?? "—");
                MetaRow(table, "Operator", data.Operator ?? "Administrator");
                MetaRow(table, "Experiment date", data.ExperimentDate.ToString("yyyy-MM-dd HH:mm:ss UTC"));
                MetaRow(table, "Files analysed", data.TestedFiles?.Count.ToString() ?? "0");
                MetaRow(table, "Benchmark runs", data.BenchmarkRuns.ToString());
                MetaRow(table, "API version", data.ApiVersion ?? "AudioVerse.API .NET 10");
                if (data.TestedFiles is { Count: > 0 })
                    MetaRow(table, "File names", string.Join(", ", data.TestedFiles));
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2. KPI
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionKpi(IContainer c, LaboratoryReportData data)
    {
        if (data.ComparisonRows is not { Count: > 0 }) return;

        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, "2", "Executive Summary"));

            var crepe = data.ComparisonRows.Where(r => r.Algorithm == "CREPE").ToList();
            var pyin = data.ComparisonRows.Where(r => r.Algorithm == "pYIN").ToList();

            var bestRmse = data.ComparisonRows.OrderBy(r => r.RmseCents).First();
            var bestAcc = data.ComparisonRows.OrderByDescending(r => r.Accuracy50c).First();

            var rmseEqual = crepe.Count > 0 && pyin.Count > 0
                && Math.Abs(crepe.Average(r => r.RmseCents) - pyin.Average(r => r.RmseCents)) < 0.5;
            var accEqual = crepe.Count > 0 && pyin.Count > 0
                && Math.Abs(crepe.Average(r => r.Accuracy50c) - pyin.Average(r => r.Accuracy50c)) < 0.005;

            var cLatAvg = crepe.Count > 0 ? crepe.Average(r => r.LatencyMs) : 0;
            var pLatAvg = pyin.Count > 0 ? pyin.Average(r => r.LatencyMs) : 0;
            var faster = cLatAvg <= pLatAvg ? "CREPE" : "pYIN";
            var fasterMs = Math.Min(cLatAvg, pLatAvg);

            col.Item().PaddingTop(8).Row(row =>
            {
                row.RelativeItem().Element(b => KpiBox(b,
                    rmseEqual ? "RMSE (agreement)" : "Best RMSE",
                    $"{bestRmse.RmseCents:F1} ct",
                    rmseEqual ? "CREPE ≈ pYIN" : bestRmse.Algorithm,
                    rmseEqual ? Accent2 : CrepeClr));
                row.ConstantItem(10);
                row.RelativeItem().Element(b => KpiBox(b,
                    accEqual ? "Acc@50c (agreement)" : "Best Acc@50c",
                    $"{bestAcc.Accuracy50c * 100:F1}%",
                    accEqual ? "CREPE ≈ pYIN" : bestAcc.Algorithm,
                    accEqual ? Accent2 : PyinClr));
                row.ConstantItem(10);
                row.RelativeItem().Element(b => KpiBox(b, "Fastest",
                    $"{fasterMs:F0} ms", faster, Good));
                row.ConstantItem(10);
                row.RelativeItem().Element(b => KpiBox(b, "Files Tested",
                    data.ComparisonRows.Select(r => r.FileName).Distinct().Count().ToString(), "samples", Accent2));
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  3. HEALTH
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionHealth(IContainer c, Dictionary<string, string> health, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "AI Microservice Health"));
            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(cd => { cd.RelativeColumn(4); cd.RelativeColumn(3); });
                Th(table, "Microservice", "Status");
                foreach (var (name, status) in health)
                {
                    var ok = status.StartsWith("ok", StringComparison.OrdinalIgnoreCase);
                    Td(table, name);
                    table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5)
                         .Text(status).FontSize(9).Bold().FontColor(ok ? Good : Warn);
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  4. BENCHMARK + BAR CHART (SVG)
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionBenchmark(IContainer c, List<BenchmarkRow> rows, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "Latency Benchmark"));
            col.Item().PaddingTop(4).Text("Each AI microservice called N times. Requirement: real-time < 150 ms.")
             .FontSize(8).Italic().FontColor(TextMuted);

            col.Item().PaddingTop(6).Table(table =>
        {
            table.ColumnsDefinition(cd =>
            {
                cd.RelativeColumn(5); cd.RelativeColumn(2); cd.RelativeColumn(2);
                cd.RelativeColumn(2); cd.RelativeColumn(2); cd.RelativeColumn(2);
            });
            Th(table, "Service", "Avg ms", "Min ms", "Max ms", "σ ms", "< 150 ms");
            foreach (var r in rows)
            {
                var ok = r.AvgMs < 150;
                Td(table, r.ServiceName);
                TdR(table, r.AvgMs.ToString("F1"));
                TdR(table, r.MinMs.ToString());
                TdR(table, r.MaxMs.ToString());
                TdR(table, r.StdDevMs.ToString("F1"));
                table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5).AlignCenter()
                     .Text(ok ? "✓ PASS" : "✗ FAIL").FontSize(8).Bold().FontColor(ok ? Good : Warn);
            }
        });

        // SVG bar chart
        col.Item().PaddingTop(12).Text($"Fig {sN}.1. Average latency by service [ms]")
         .FontSize(8).Bold().FontColor(Accent2);

        var sorted = rows.OrderByDescending(x => x.AvgMs).ToList();
        var maxVal = sorted.Max(r => r.AvgMs);
        if (maxVal <= 0) maxVal = 1;
        var barH = 18;
        var gap = 6;
        var svgH = sorted.Count * (barH + gap) + 10;

        col.Item().PaddingTop(4).Height(svgH).Svg(size =>
        {
            var w = size.Width;
            var barLeft = 140f;
            var barAreaW = w - barLeft - 60;
            var sb = new StringBuilder();
            sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='{F(svgH)}'>");

            // 150ms threshold line
            var threshX = barLeft + (float)(150.0 / maxVal * barAreaW);
            if (threshX > barLeft && threshX < barLeft + barAreaW)
            {
                sb.Append($"<line x1='{F(threshX)}' y1='0' x2='{F(threshX)}' y2='{svgH}' " +
                    $"stroke='{Accent}' stroke-width='1.2' stroke-dasharray='4,3'/>");
                sb.Append($"<text x='{F(threshX + 3)}' y='10' font-size='7' fill='{Accent}' " +
                    $"font-family='Times New Roman'>150 ms</text>");
            }

            var y = 5f;
            foreach (var r in sorted)
            {
                var barW = (float)(r.AvgMs / maxVal * barAreaW);
                var clr = r.AvgMs < 150 ? Good : Warn;

                // Label
                sb.Append($"<text x='0' y='{F(y + barH * 0.72f)}' font-size='8' fill='{TextDark}' " +
                    $"font-family='Times New Roman'>{Esc(r.ServiceName)}</text>");
                // Bar
                sb.Append($"<rect x='{F(barLeft)}' y='{F(y)}' width='{F(Math.Max(barW, 2))}' " +
                    $"height='{barH}' rx='3' fill='{clr}'/>");
                // Value
                sb.Append($"<text x='{F(barLeft + barW + 4)}' y='{F(y + barH * 0.72f)}' " +
                    $"font-size='8' fill='{TextDark}' font-family='Times New Roman' font-weight='bold'>" +
                    $"{r.AvgMs.ToString("F1", Inv)}</text>");

                y += barH + gap;
            }
            sb.Append("</svg>");
            return sb.ToString();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  5. CALIBRATION (synthetic ground truth)
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionCalibration(IContainer c, List<ComparisonRow> rows, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "Algorithm Calibration — Synthetic Ground Truth"));
            col.Item().PaddingTop(4).Text(
                "A 3-second stepped sine wave (A3→E4→A4→C5→F4→C4) was generated programmatically " +
                "at known frequencies. Each algorithm's output is compared against the exact " +
                "ground truth — yielding genuinely independent, non-symmetric accuracy metrics."
            ).FontSize(8).Italic().FontColor(TextMuted);

            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(cd =>
                {
                    cd.RelativeColumn(3); cd.RelativeColumn(2); cd.RelativeColumn(2);
                    cd.RelativeColumn(2); cd.RelativeColumn(2); cd.RelativeColumn(2);
                });
                Th(table, "Algorithm", "RMSE Hz", "RMSE ct", "Acc@50c", "r(Pearson)", "Lat. ms");
                foreach (var r in rows)
                {
                    var clr = r.Algorithm == "CREPE" ? CrepeClr : PyinClr;
                    table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5)
                         .Text(r.Algorithm).Bold().FontColor(clr).FontSize(9);
                    TdR(table, r.RmseHz.ToString("F2"));
                    TdR(table, r.RmseCents.ToString("F1"));
                    TdR(table, (r.Accuracy50c * 100).ToString("F1") + "%");
                    TdR(table, r.PearsonR.ToString("F3"));
                    TdR(table, r.LatencyMs.ToString());
                }
            });

            var crepe = rows.FirstOrDefault(r => r.Algorithm == "CREPE");
            var pyin = rows.FirstOrDefault(r => r.Algorithm == "pYIN");
            if (crepe is not null && pyin is not null)
            {
                var winner = crepe.RmseCents < pyin.RmseCents ? "CREPE" : "pYIN";
                var winClr = winner == "CREPE" ? CrepeClr : PyinClr;
                col.Item().PaddingTop(8).Background(Bg).Border(0.5f).BorderColor(Border).Padding(10).Row(row =>
                {
                    row.RelativeItem().Text(t =>
                    {
                        t.DefaultTextStyle(x => x.FontSize(9));
                        t.Span("Calibration result: ").Bold().FontColor(Accent2);
                        t.Span(winner).Bold().FontColor(winClr);
                        t.Span($" is more accurate (RMSE {Math.Min(crepe.RmseCents, pyin.RmseCents):F1} ct vs " +
                            $"{Math.Max(crepe.RmseCents, pyin.RmseCents):F1} ct, " +
                            $"Δ = {Math.Abs(crepe.RmseCents - pyin.RmseCents):F1} ct).");
                    });
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  6. CREPE vs pYIN + CHARTS (SVG)
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionComparison(IContainer c, List<ComparisonRow> rows, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "CREPE vs pYIN — Pitch Detection Comparison"));
            col.Item().PaddingTop(4).Text(
                "RMSE in cents (1 semitone = 100 ct). Accuracy@50c = fraction of frames with error < 50 ct. " +
                "r = Pearson correlation of F0 trajectories. " +
                "Note: without ground-truth pitch, RMSE/Acc/r represent inter-algorithm agreement " +
                "(symmetric — identical for both algorithms). Latency is per-algorithm."
            ).FontSize(8).Italic().FontColor(TextMuted);

            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(cd =>
                {
                    cd.RelativeColumn(4); cd.RelativeColumn(2); cd.RelativeColumn(2);
                    cd.RelativeColumn(2); cd.RelativeColumn(2); cd.RelativeColumn(2); cd.RelativeColumn(2);
                });
                Th(table, "File", "Algorithm", "RMSE Hz", "RMSE ct", "Acc@50c", "r(Pearson)", "Lat. ms");
                foreach (var r in rows)
                {
                    var clr = r.Algorithm == "CREPE" ? CrepeClr : PyinClr;
                    table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(4).Text(Trunc(r.FileName)).FontSize(8);
                    table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(4).Text(r.Algorithm).Bold().FontColor(clr).FontSize(8);
                    TdR(table, r.RmseHz.ToString("F2")); TdR(table, r.RmseCents.ToString("F1"));
                    TdR(table, (r.Accuracy50c * 100).ToString("F1") + "%");
                    TdR(table, r.PearsonR.ToString("F3")); TdR(table, r.LatencyMs.ToString());
                }
            });

            var crepe = rows.Where(r => r.Algorithm == "CREPE").ToList();
            var pyin = rows.Where(r => r.Algorithm == "pYIN").ToList();
            if (crepe.Count > 0 && pyin.Count > 0)
            {
                // Aggregate table
                col.Item().PaddingTop(10).Background(Bg).Border(0.5f).BorderColor(Border).Padding(12).Column(sum =>
                {
                    sum.Item().Text("Table 6.1. Aggregate statistics").Bold().FontSize(9).FontColor(Accent2);
                    sum.Item().PaddingTop(6).Table(st =>
                    {
                        st.ColumnsDefinition(cd => { cd.RelativeColumn(4); cd.RelativeColumn(3); cd.RelativeColumn(3); });
                        Th(st, "Metric", "CREPE (avg)", "pYIN (avg)");
                        AggRow(st, "RMSE (Hz)", crepe.Average(r => r.RmseHz), pyin.Average(r => r.RmseHz), "F2");
                        AggRow(st, "RMSE (cents)", crepe.Average(r => r.RmseCents), pyin.Average(r => r.RmseCents), "F1");
                        AggRow(st, "Accuracy@50c", crepe.Average(r => r.Accuracy50c) * 100, pyin.Average(r => r.Accuracy50c) * 100, "F1", "%");
                        AggRow(st, "r(Pearson)", crepe.Average(r => r.PearsonR), pyin.Average(r => r.PearsonR), "F3");
                        AggRow(st, "Latency (ms)", crepe.Average(r => r.LatencyMs), pyin.Average(r => r.LatencyMs), "F0");
                    });
                });

                var fileNames = rows.Select(r => r.FileName).Distinct().ToList();

                // ── Fig 5.1: Grouped RMSE bar chart ──
                col.Item().PaddingTop(14).Text($"Fig {sN}.1. RMSE per file: CREPE (red) vs pYIN (blue) [cents]")
                 .FontSize(8).Bold().FontColor(Accent2);
                col.Item().Element(ch => GroupedBarChart(ch, fileNames, crepe, pyin,
                    r => r.RmseCents, "F1", "ct"));

                // ── Fig 5.2: Grouped Accuracy bar chart ──
                col.Item().PaddingTop(14).Text($"Fig {sN}.2. Accuracy@50c per file: CREPE vs pYIN [%]")
                 .FontSize(8).Bold().FontColor(Accent2);
                col.Item().Element(ch => GroupedBarChart(ch, fileNames, crepe, pyin,
                    r => r.Accuracy50c * 100, "F1", "%"));

                // ── Fig 5.3: Grouped Pearson r bar chart ──
                col.Item().PaddingTop(14).Text($"Fig {sN}.3. Pearson r per file: CREPE vs pYIN")
                 .FontSize(8).Bold().FontColor(Accent2);
                col.Item().Element(ch => GroupedBarChart(ch, fileNames, crepe, pyin,
                    r => r.PearsonR, "F3", ""));

                // ── Fig 5.4: Scatter chart – latency per file ──
                if (fileNames.Count >= 2)
                {
                    col.Item().PaddingTop(14).Text($"Fig {sN}.4. Latency per file: CREPE (red) vs pYIN (blue) [ms]")
                     .FontSize(8).Bold().FontColor(Accent2);

                    var chartH = 130f;
                    var maxLat = (float)rows.Max(r => r.LatencyMs);
                    if (maxLat <= 0) maxLat = 1;

                    col.Item().PaddingTop(4).Height(chartH + 20).Svg(size =>
                    {
                        var w = size.Width;
                        var left = 40f; var right = w - 20; var top = 10f; var bottom = chartH;
                        var areaW = right - left;
                        var sb = new StringBuilder();
                        sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='{F(chartH + 20)}'>");

                        sb.Append($"<line x1='{F(left)}' y1='{F(bottom)}' x2='{F(right)}' y2='{F(bottom)}' stroke='{Border}'/>");
                        sb.Append($"<line x1='{F(left)}' y1='{F(top)}' x2='{F(left)}' y2='{F(bottom)}' stroke='{Border}'/>");
                        sb.Append($"<text x='{F(left - 20)}' y='{F(bottom + 3)}' font-size='7' fill='{TextMuted}' " +
                            $"font-family='Times New Roman'>0</text>");
                        sb.Append($"<text x='{F(left - 36)}' y='{F(top + 5)}' font-size='7' fill='{TextMuted}' " +
                            $"font-family='Times New Roman'>{maxLat:F0}</text>");

                        var step = areaW / Math.Max(fileNames.Count, 1);
                        for (var i = 0; i < fileNames.Count; i++)
                        {
                            var x = left + step * i + step / 2;
                            var cr = crepe.FirstOrDefault(r => r.FileName == fileNames[i]);
                            var py = pyin.FirstOrDefault(r => r.FileName == fileNames[i]);

                            if (cr is not null)
                            {
                                var y = bottom - (float)(cr.LatencyMs / maxLat * (bottom - top));
                                sb.Append($"<circle cx='{F(x - 4)}' cy='{F(y)}' r='4' fill='{CrepeClr}'/>");
                            }
                            if (py is not null)
                            {
                                var y = bottom - (float)(py.LatencyMs / maxLat * (bottom - top));
                                sb.Append($"<circle cx='{F(x + 4)}' cy='{F(y)}' r='4' fill='{PyinClr}'/>");
                            }

                            var label = fileNames[i].Length > 12 ? fileNames[i][..10] + ".." : fileNames[i];
                            sb.Append($"<text x='{F(x - 15)}' y='{F(bottom + 12)}' font-size='6.5' fill='{TextMuted}' " +
                                $"font-family='Times New Roman'>{Esc(label)}</text>");
                        }

                        sb.Append($"<circle cx='{F(right - 80)}' cy='{F(top + 2)}' r='3' fill='{CrepeClr}'/>");
                        sb.Append($"<text x='{F(right - 74)}' y='{F(top + 5)}' font-size='7' fill='{TextDark}' " +
                            $"font-family='Times New Roman'>CREPE</text>");
                        sb.Append($"<circle cx='{F(right - 40)}' cy='{F(top + 2)}' r='3' fill='{PyinClr}'/>");
                        sb.Append($"<text x='{F(right - 34)}' y='{F(top + 5)}' font-size='7' fill='{TextDark}' " +
                            $"font-family='Times New Roman'>pYIN</text>");

                        sb.Append("</svg>");
                        return sb.ToString();
                    });
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  7. F0 PITCH TRAJECTORY (SVG line charts)
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionPitchContour(IContainer c, List<PitchContourSeries> contours, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "F0 Pitch Trajectory Analysis"));
            col.Item().PaddingTop(4).Text(
                "Time-series plots of detected fundamental frequency (F0). " +
                "Reference pitch shown in gray; CREPE in red; pYIN in blue."
            ).FontSize(8).Italic().FontColor(TextMuted);

            var fileNames = contours.Select(s => s.FileName).Distinct().ToList();

            foreach (var (file, fi) in fileNames.Select((f, i) => (f, i)))
            {
                var series = contours.Where(s => s.FileName == file).ToList();
                if (series.Count == 0 || series.All(s => s.Points.Count == 0)) continue;

                // ── Full trajectory ──
                col.Item().PaddingTop(10).Text($"Fig 7.{fi * 2 + 1}. F0 trajectory — {Trunc(file, 40)}")
                 .FontSize(8).Bold().FontColor(Accent2);

                col.Item().PaddingTop(4).Element(ch => PitchLineChart(ch, series, null, null));

                // ── Zoomed detail (first 3 seconds) ──
                var maxTime = series.SelectMany(s => s.Points).Max(p => p.TimeSec);
                if (maxTime > 3.0)
                {
                    var zoomEnd = Math.Min(3.0, maxTime);
                    col.Item().PaddingTop(8).Text($"Fig 7.{fi * 2 + 2}. F0 detail (0–{zoomEnd:F1} s) — {Trunc(file, 40)}")
                     .FontSize(8).Bold().FontColor(Accent2);

                    col.Item().PaddingTop(4).Element(ch => PitchLineChart(ch, series, 0, zoomEnd));
                }
            }
        });
    }

    private static void PitchLineChart(IContainer c, List<PitchContourSeries> series,
        double? tMin, double? tMax)
    {
        var allPts = series.SelectMany(s => s.Points).ToList();
        if (allPts.Count == 0) return;

        var xMin = tMin ?? allPts.Min(p => p.TimeSec);
        var xMax = tMax ?? allPts.Max(p => p.TimeSec);
        if (xMax <= xMin) xMax = xMin + 1;
        var yMin = allPts.Where(p => p.FrequencyHz > 0 && p.TimeSec >= xMin && p.TimeSec <= xMax)
                         .DefaultIfEmpty(new PitchContourPoint(0, 50))
                         .Min(p => p.FrequencyHz) * 0.9;
        var yMax = allPts.Where(p => p.FrequencyHz > 0 && p.TimeSec >= xMin && p.TimeSec <= xMax)
                         .DefaultIfEmpty(new PitchContourPoint(0, 500))
                         .Max(p => p.FrequencyHz) * 1.1;
        if (yMax <= yMin) yMax = yMin + 100;

        const float chartH = 140f;

        c.Height(chartH + 30).Svg(size =>
        {
            var w = size.Width;
            var left = 46f; var right = w - 16; var top = 12f; var bottom = chartH;
            var areaW = right - left; var areaH = bottom - top;
            var sb = new StringBuilder();
            sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='{F(chartH + 30)}'>");

            // Grid
            sb.Append($"<rect x='{F(left)}' y='{F(top)}' width='{F(areaW)}' height='{F(areaH)}' fill='#fafafa' stroke='{Border}' stroke-width='0.5'/>");
            for (var g = 0; g <= 4; g++)
            {
                var gy = top + areaH * g / 4f;
                sb.Append($"<line x1='{F(left)}' y1='{F(gy)}' x2='{F(right)}' y2='{F(gy)}' stroke='{Border}' stroke-width='0.3' stroke-dasharray='3,3'/>");
                var freq = yMax - (yMax - yMin) * g / 4.0;
                sb.Append($"<text x='{F(left - 4)}' y='{F(gy + 3)}' font-size='6.5' fill='{TextMuted}' " +
                    $"font-family='Times New Roman' text-anchor='end'>{freq:F0}</text>");
            }
            sb.Append($"<text x='{F(left - 4)}' y='{F(top - 4)}' font-size='6' fill='{TextMuted}' " +
                $"font-family='Times New Roman' text-anchor='end'>Hz</text>");

            // X axis labels
            var xTicks = 5;
            for (var t = 0; t <= xTicks; t++)
            {
                var tx = left + areaW * t / xTicks;
                var tv = xMin + (xMax - xMin) * t / xTicks;
                sb.Append($"<text x='{F(tx)}' y='{F(bottom + 12)}' font-size='6.5' fill='{TextMuted}' " +
                    $"font-family='Times New Roman' text-anchor='middle'>{tv:F1}s</text>");
            }

            // Plot each series
            foreach (var s in series.OrderBy(s => s.Algorithm == "Reference" ? 0 : s.Algorithm == "CREPE" ? 1 : 2))
            {
                var clr = s.Algorithm switch
                {
                    "CREPE" => CrepeClr,
                    "pYIN" => PyinClr,
                    _ => "#999999"
                };
                var opacity = s.Algorithm == "Reference" ? "0.4" : "0.85";
                var sw = s.Algorithm == "Reference" ? "1.2" : "1.5";

                var pts = s.Points
                    .Where(p => p.TimeSec >= xMin && p.TimeSec <= xMax && p.FrequencyHz > 0)
                    .OrderBy(p => p.TimeSec)
                    .ToList();
                if (pts.Count < 2) continue;

                var polyPts = string.Join(" ", pts.Select(p =>
                {
                    var px = left + (float)((p.TimeSec - xMin) / (xMax - xMin) * areaW);
                    var py = bottom - (float)((p.FrequencyHz - yMin) / (yMax - yMin) * areaH);
                    return $"{F(px)},{F(py)}";
                }));
                sb.Append($"<polyline points='{polyPts}' fill='none' stroke='{clr}' " +
                    $"stroke-width='{sw}' opacity='{opacity}'/>");
            }

            // Legend
            var lx = right - 120f;
            var ly = top + 6f;
            foreach (var alg in new[] { "Reference", "CREPE", "pYIN" })
            {
                if (!series.Any(s => s.Algorithm == alg)) continue;
                var lclr = alg switch { "CREPE" => CrepeClr, "pYIN" => PyinClr, _ => "#999999" };
                sb.Append($"<line x1='{F(lx)}' y1='{F(ly)}' x2='{F(lx + 14)}' y2='{F(ly)}' stroke='{lclr}' stroke-width='2'/>");
                sb.Append($"<text x='{F(lx + 18)}' y='{F(ly + 3)}' font-size='7' fill='{TextDark}' font-family='Times New Roman'>{alg}</text>");
                ly += 12;
            }

            sb.Append("</svg>");
            return sb.ToString();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  8. SEPARATION + DELTA CHART
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionSeparation(IContainer c, List<SeparationRow> rows, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "Demucs Separation Impact on F0 Detection"));
            col.Item().PaddingTop(4).Text("Pipeline: CREPE(original) → Demucs vocal → CREPE(vocal). Δ RMSE < 0 = improvement.")
             .FontSize(8).Italic().FontColor(TextMuted);

            col.Item().PaddingTop(6).Table(table =>
        {
            table.ColumnsDefinition(cd =>
            {
                cd.RelativeColumn(4); cd.RelativeColumn(2); cd.RelativeColumn(2);
                cd.RelativeColumn(2); cd.RelativeColumn(2);
            });
            Th(table, "File", "RMSE orig ct", "RMSE post ct", "Δ RMSE ct", "Sep. ms");
            foreach (var r in rows)
            {
                var delta = r.RmseCentsAfter - r.RmseCentsBefore;
                var clr = delta < 0 ? Good : Warn;
                Td(table, Trunc(r.FileName));
                TdR(table, r.RmseCentsBefore.ToString("F1"));
                TdR(table, r.RmseCentsAfter.ToString("F1"));
                table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5).AlignRight()
                     .Text((delta > 0 ? "+" : "") + delta.ToString("F1")).FontSize(8).Bold().FontColor(clr);
                TdR(table, r.SeparationLatencyMs.ToString());
            }
        });

        // Delta bar chart
        col.Item().PaddingTop(10).Text($"Fig {sN}.1. Δ RMSE after Demucs separation [cents]")
         .FontSize(8).Bold().FontColor(Accent2);

        var barH = 16; var gap2 = 6;
        var svgH = rows.Count * (barH + gap2) + 10;
        var maxAbs = rows.Max(r => Math.Abs(r.RmseCentsAfter - r.RmseCentsBefore));
        if (maxAbs <= 0) maxAbs = 1;

        col.Item().PaddingTop(4).Height(svgH).Svg(size =>
        {
            var w = size.Width;
            var centerX = w / 2;
            var halfW = w / 2 - 80;
            var sb = new StringBuilder();
            sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='{svgH}'>");

            // Zero line
            sb.Append($"<line x1='{F(centerX)}' y1='0' x2='{F(centerX)}' y2='{svgH}' stroke='{Border}' stroke-width='0.8'/>");

            var y = 5f;
            foreach (var r in rows)
            {
                var delta = r.RmseCentsAfter - r.RmseCentsBefore;
                var frac = (float)(Math.Abs(delta) / maxAbs);
                var barW = frac * halfW;
                var clr = delta < 0 ? Good : Warn;

                sb.Append($"<text x='2' y='{F(y + barH * 0.72f)}' font-size='7.5' fill='{TextDark}' " +
                    $"font-family='Times New Roman'>{Esc(Trunc(r.FileName, 18))}</text>");

                if (delta < 0)
                    sb.Append($"<rect x='{F(centerX - barW)}' y='{F(y)}' width='{F(barW)}' height='{barH}' rx='2' fill='{clr}'/>");
                else
                    sb.Append($"<rect x='{F(centerX)}' y='{F(y)}' width='{F(Math.Max(barW, 2))}' height='{barH}' rx='2' fill='{clr}'/>");

                var valX = delta < 0 ? centerX - barW - 32 : centerX + barW + 4;
                sb.Append($"<text x='{F(valX)}' y='{F(y + barH * 0.72f)}' font-size='7.5' fill='{TextDark}' " +
                    $"font-family='Times New Roman'>{delta.ToString("+0.0;-0.0", Inv)} ct</text>");
                y += barH + gap2;
            }
            sb.Append("</svg>");
            return sb.ToString();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  9. DTW + GAUGE
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionDtw(IContainer c, List<DtwRow> rows, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "Singing Evaluation — DTW Score"));
            col.Item().PaddingTop(6).Table(table =>
        {
            table.ColumnsDefinition(cd =>
            {
                cd.RelativeColumn(4); cd.RelativeColumn(2); cd.RelativeColumn(2);
                cd.RelativeColumn(2); cd.RelativeColumn(2);
            });
            Th(table, "Vocal file", "Score (0–100)", "Pitch Acc.", "Rhythm Acc.", "Lat. ms");
            foreach (var r in rows)
            {
                var clr = r.Score >= 70 ? Good : r.Score >= 40 ? Warn : Accent;
                Td(table, Trunc(r.VocalFileName));
                table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5).AlignRight()
                     .Text(r.Score.ToString("F1")).FontSize(9).Bold().FontColor(clr);
                TdR(table, (r.PitchAccuracy * 100).ToString("F1") + "%");
                TdR(table, (r.RhythmAccuracy * 100).ToString("F1") + "%");
                TdR(table, r.LatencyMs.ToString());
            }
        });

        // Score gauge (SVG)
        if (rows.Count > 0)
        {
            var score = rows.First().Score;
            col.Item().PaddingTop(10).Text($"Fig {sN}.1. DTW Score gauge").FontSize(8).Bold().FontColor(Accent2);
            col.Item().PaddingTop(4).Height(50).Svg(size =>
            {
                var w = size.Width;
                var barW = w - 40; var bH = 22f; var left = 20f; var y = 14f;
                var fillW = (float)(score / 100.0 * barW);
                var fillClr = score >= 70 ? Good : score >= 40 ? Warn : Accent;

                var sb = new StringBuilder();
                sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='50'>");
                sb.Append($"<rect x='{F(left)}' y='{F(y)}' width='{F(barW)}' height='{F(bH)}' rx='6' fill='#e0e0e0'/>");
                sb.Append($"<rect x='{F(left)}' y='{F(y)}' width='{F(Math.Max(fillW, 4))}' height='{F(bH)}' rx='6' fill='{fillClr}'/>");
                sb.Append($"<text x='{F(left + fillW / 2 - 18)}' y='{F(y + bH * 0.72f)}' font-size='12' fill='white' " +
                    $"font-family='Times New Roman' font-weight='bold'>{score.ToString("F1", Inv)} / 100</text>");
                sb.Append($"<text x='{F(left)}' y='{F(y + bH + 12)}' font-size='7' fill='{TextMuted}' font-family='Times New Roman'>0</text>");
                sb.Append($"<text x='{F(left + barW / 2 - 4)}' y='{F(y + bH + 12)}' font-size='7' fill='{TextMuted}' font-family='Times New Roman'>50</text>");
                sb.Append($"<text x='{F(left + barW - 12)}' y='{F(y + bH + 12)}' font-size='7' fill='{TextMuted}' font-family='Times New Roman'>100</text>");
                sb.Append("</svg>");
                return sb.ToString();
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  10. CONCLUSIONS
    // ═══════════════════════════════════════════════════════════════════════
    private static void SectionConclusions(IContainer c, LaboratoryReportData data, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "Conclusions"));
            col.Item().PaddingTop(4).Text("Based on the measurements above, the following conclusions are drawn:")
             .FontSize(9).LineHeight(1.3f);

            var conclusions = BuildConclusions(data);
            col.Item().PaddingTop(6).Column(inner =>
            {
                foreach (var (i, text) in conclusions.Select((t, i) => (i + 1, t)))
                {
                    inner.Item().PaddingBottom(4).Row(row =>
                    {
                        row.ConstantItem(18).Text($"{i}.").Bold().FontColor(Accent);
                        row.RelativeItem().Text(text).FontSize(9).LineHeight(1.3f);
                    });
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  11. REFERENCES
    // ═══════════════════════════════════════════════════════════════════════
    private static void References(IContainer c, int sN)
    {
        c.Column(col =>
        {
            col.Item().Element(h => Heading(h, sN.ToString(), "References"));
            col.Item().PaddingTop(6).Column(inner =>
            {
                Ref(inner, 1, "Kim, J.W. et al. (2018). \"CREPE: A Convolutional Representation for Pitch Estimation.\" Proc. IEEE ICASSP, pp. 161–165.");
                Ref(inner, 2, "Mauch, M. & Dixon, S. (2014). \"pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions.\" Proc. IEEE ICASSP, pp. 659–663.");
                Ref(inner, 3, "Défossez, A. (2021). \"Hybrid Spectrogram and Waveform Source Separation.\" Proc. ISMIR 2021. arXiv:2111.03600.");
                Ref(inner, 4, "Sakoe, H. & Chiba, S. (1978). \"Dynamic Programming Algorithm Optimization for Spoken Word Recognition.\" IEEE Trans. ASSP, 26(1), pp. 43–49.");
                Ref(inner, 5, "AudioVerse Laboratory Module — /api/karaoke/lab. Internal API documentation.");
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    private static void GroupedBarChart(IContainer c, List<string> fileNames,
        List<ComparisonRow> crepe, List<ComparisonRow> pyin,
        Func<ComparisonRow, double> metric, string fmt, string suffix)
    {
        var barH = 14; var gap = 8; var groupH = barH * 2 + 4;
        var svgH = fileNames.Count * (groupH + gap) + 20;
        var allVals = crepe.Concat(pyin).Select(metric).ToList();
        var maxVal = allVals.Count > 0 ? allVals.Max() : 1;
        if (maxVal <= 0) maxVal = 1;

        c.PaddingTop(4).Height(svgH).Svg(size =>
        {
            var w = size.Width;
            var barLeft = 120f;
            var barAreaW = w - barLeft - 70;
            var sb = new StringBuilder();
            sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' width='{F(w)}' height='{svgH}'>");

            var y = 8f;
            foreach (var file in fileNames)
            {
                var label = file.Length > 18 ? file[..16] + ".." : file;
                sb.Append($"<text x='2' y='{F(y + barH * 0.72f)}' font-size='7.5' fill='{TextDark}' " +
                    $"font-family='Times New Roman'>{Esc(label)}</text>");

                var cr = crepe.FirstOrDefault(r => r.FileName == file);
                var py = pyin.FirstOrDefault(r => r.FileName == file);

                if (cr is not null)
                {
                    var val = metric(cr);
                    var bw = (float)(val / maxVal * barAreaW);
                    sb.Append($"<rect x='{F(barLeft)}' y='{F(y)}' width='{F(Math.Max(bw, 2))}' " +
                        $"height='{barH}' rx='2' fill='{CrepeClr}' opacity='0.85'/>");
                    sb.Append($"<text x='{F(barLeft + bw + 3)}' y='{F(y + barH * 0.76f)}' " +
                        $"font-size='7' fill='{TextDark}' font-family='Times New Roman' font-weight='bold'>" +
                        $"{val.ToString(fmt, Inv)}{suffix}</text>");
                }

                y += barH + 2;

                if (py is not null)
                {
                    var val = metric(py);
                    var bw = (float)(val / maxVal * barAreaW);
                    sb.Append($"<rect x='{F(barLeft)}' y='{F(y)}' width='{F(Math.Max(bw, 2))}' " +
                        $"height='{barH}' rx='2' fill='{PyinClr}' opacity='0.85'/>");
                    sb.Append($"<text x='{F(barLeft + bw + 3)}' y='{F(y + barH * 0.76f)}' " +
                        $"font-size='7' fill='{TextDark}' font-family='Times New Roman' font-weight='bold'>" +
                        $"{val.ToString(fmt, Inv)}{suffix}</text>");
                }

                y += barH + gap;
            }

            // Legend
            var lx = barLeft; var ly = (float)(svgH - 14);
            sb.Append($"<rect x='{F(lx)}' y='{F(ly)}' width='10' height='8' rx='1' fill='{CrepeClr}'/>");
            sb.Append($"<text x='{F(lx + 13)}' y='{F(ly + 7)}' font-size='7' fill='{TextDark}' font-family='Times New Roman'>CREPE</text>");
            sb.Append($"<rect x='{F(lx + 55)}' y='{F(ly)}' width='10' height='8' rx='1' fill='{PyinClr}'/>");
            sb.Append($"<text x='{F(lx + 68)}' y='{F(ly + 7)}' font-size='7' fill='{TextDark}' font-family='Times New Roman'>pYIN</text>");

            sb.Append("</svg>");
            return sb.ToString();
        });
    }

    private static void Heading(IContainer c, string number, string title)
    {
        c.PaddingTop(4).Row(row =>
        {
            row.ConstantItem(22).Background(Accent).Padding(3).AlignCenter()
               .Text(number).FontSize(10).Bold().FontColor(Colors.White);
            row.ConstantItem(8);
            row.RelativeItem().AlignMiddle().Text(title).FontSize(13).Bold().FontColor(Accent2);
        });
    }

    private static void Th(TableDescriptor table, params string[] headers)
    {
        table.Header(hdr =>
        {
            foreach (var h in headers)
                hdr.Cell().Background(Accent2).Padding(5)
                   .Text(h).Bold().FontColor(Colors.White).FontSize(8);
        });
    }

    private static void Td(TableDescriptor table, string value) =>
        table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5).Text(value).FontSize(8);

    private static void TdR(TableDescriptor table, string value) =>
        table.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(5).AlignRight().Text(value).FontSize(8);

    private static void MetaRow(TableDescriptor table, string label, string value)
    {
        table.Cell().Padding(4).BorderBottom(0.5f).BorderColor(Border).Text(label).FontSize(9).FontColor(TextMuted);
        table.Cell().Padding(4).BorderBottom(0.5f).BorderColor(Border).Text(value).FontSize(9).Bold();
    }

    private static void AggRow(TableDescriptor st, string label, double v1, double v2, string fmt, string suffix = "")
    {
        st.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(4).Text(label).FontSize(8);
        st.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(4).AlignRight()
          .Text(v1.ToString(fmt) + suffix).Bold().FontColor(CrepeClr).FontSize(8);
        st.Cell().BorderBottom(0.5f).BorderColor(Border).Padding(4).AlignRight()
          .Text(v2.ToString(fmt) + suffix).Bold().FontColor(PyinClr).FontSize(8);
    }

    private static void KpiBox(IContainer c, string label, string value, string sub, string color)
    {
        c.Background(Bg).Border(0.5f).BorderColor(color).Padding(12).Column(col =>
        {
            col.Item().Text(label).FontSize(8).FontColor(TextMuted);
            col.Item().PaddingTop(2).Text(value).FontSize(20).Bold().FontColor(color);
            col.Item().Text(sub).FontSize(8).FontColor(color).Italic();
        });
    }

    private static void Ref(ColumnDescriptor col, int idx, string text)
    {
        col.Item().PaddingBottom(3).Row(row =>
        {
            row.ConstantItem(22).Text($"[{idx}]").FontSize(8).Bold().FontColor(Accent2);
            row.RelativeItem().Text(text).FontSize(8).FontColor(TextMuted).LineHeight(1.3f);
        });
    }

    private static List<string> BuildConclusions(LaboratoryReportData data)
    {
        var list = new List<string>();

        if (data.CalibrationRows?.Count >= 2)
        {
            var calCrepe = data.CalibrationRows.FirstOrDefault(r => r.Algorithm == "CREPE");
            var calPyin = data.CalibrationRows.FirstOrDefault(r => r.Algorithm == "pYIN");
            if (calCrepe is not null && calPyin is not null)
            {
                var winner = calCrepe.RmseCents < calPyin.RmseCents ? "CREPE" : "pYIN";
                list.Add($"Calibration (synthetic ground truth): {winner} is more accurate — " +
                    $"CREPE RMSE = {calCrepe.RmseCents:F1} ct, pYIN RMSE = {calPyin.RmseCents:F1} ct, " +
                    $"Δ = {Math.Abs(calCrepe.RmseCents - calPyin.RmseCents):F1} ct [1,2].");

                var calCa = calCrepe.Accuracy50c * 100;
                var calPa = calPyin.Accuracy50c * 100;
                list.Add($"Calibration Accuracy@50c: CREPE {calCa:F1}% vs pYIN {calPa:F1}% " +
                    $"(Δ = {Math.Abs(calCa - calPa):F1} pp).");
            }
        }

        if (data.ComparisonRows?.Count > 0)
        {
            var crepe = data.ComparisonRows.Where(r => r.Algorithm == "CREPE").ToList();
            var pyin = data.ComparisonRows.Where(r => r.Algorithm == "pYIN").ToList();
            if (crepe.Count > 0 && pyin.Count > 0)
            {
                var cR = crepe.Average(r => r.RmseCents);
                var pR = pyin.Average(r => r.RmseCents);
                var rmseD = Math.Abs(cR - pR);

                if (rmseD < 1.0)
                    list.Add($"Inter-algorithm agreement RMSE = {cR:F1} ct (CREPE ≈ pYIN on user audio). " +
                        "Without ground-truth reference, per-algorithm accuracy on real audio is symmetric [1,2].");
                else
                {
                    var better = cR < pR ? "CREPE" : "pYIN";
                    list.Add($"Algorithm {better} achieved lower average RMSE ({Math.Min(cR, pR):F1} ct vs " +
                        $"{Math.Max(cR, pR):F1} ct, Δ = {rmseD:F1} ct) [1,2].");
                }

                var cL = crepe.Average(r => (double)r.LatencyMs);
                var pL = pyin.Average(r => (double)r.LatencyMs);
                var latD = Math.Abs(cL - pL);
                if (latD >= 1.0)
                {
                    var faster = cL < pL ? "CREPE" : "pYIN";
                    list.Add($"Average latency: CREPE {cL:F0} ms vs pYIN {pL:F0} ms " +
                        $"({faster} is {latD:F0} ms faster).");
                }
                else
                    list.Add($"Average latency: CREPE {cL:F0} ms ≈ pYIN {pL:F0} ms (equivalent).");
            }
        }
        if (data.BenchmarkResults?.Count > 0)
        {
            var f = data.BenchmarkResults.OrderBy(r => r.AvgMs).First();
            var ok = data.BenchmarkResults.Count(r => r.AvgMs < 150);
            list.Add($"Fastest service: {f.ServiceName} ({f.AvgMs:F1} ms). " +
                $"Real-time (< 150 ms) met by {ok}/{data.BenchmarkResults.Count} services.");
        }
        if (data.SeparationRows?.Count > 0)
        {
            var imp = data.SeparationRows.Count(r => r.RmseCentsAfter < r.RmseCentsBefore);
            var d = data.SeparationRows.Average(r => r.RmseCentsAfter - r.RmseCentsBefore);
            list.Add($"Demucs improved F0 in {imp}/{data.SeparationRows.Count} cases (avg Δ = {d:F1} ct). " +
                "Computational cost precludes real-time use [3].");
        }
        if (data.DtwRows?.Count > 0)
        {
            var avg = data.DtwRows.Average(r => r.Score);
            list.Add($"DTW evaluation: avg score {avg:F1}/100, correlating with subjective quality [4].");
        }
        list.Add("Recommendation: CREPE for offline/high-accuracy (GPU required); pYIN for real-time (CPU-only). " +
            "Ground-truth annotated pitch required for definitive accuracy comparison. " +
            "Demucs as preprocessing only for studio recordings [1,2,3].");
        return list;
    }

    private static string Trunc(string? name, int max = 28) =>
        string.IsNullOrEmpty(name) ? "—" : name.Length > max ? "…" + name[^(max - 1)..] : name;

    private static string F(float v) => v.ToString("F1", Inv);
    private static string F(double v) => v.ToString("F1", Inv);

    private static string Esc(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");

    private static byte[] GenerateQrPng(Guid guid)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrData = qrGenerator.CreateQrCode(
            $"audioverse://lab/experiment/{guid:D}",
            QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(6, [30, 30, 50], [255, 255, 255]);
    }
}
