namespace DocxWikiConverter
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Text.RegularExpressions;
    using DocumentFormat.OpenXml;
    using DocumentFormat.OpenXml.Packaging;
    using DocumentFormat.OpenXml.Wordprocessing;

    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("Użycie: WikiDocxConverter.exe plik.docx|plik.wiki");
                return;
            }

            string inputFile = args[0];
            string extension = Path.GetExtension(inputFile).ToLower();

            if (extension == ".docx")
            {
                ConvertDocxToWiki(inputFile);
            }
            else if (extension == ".wiki")
            {
                ConvertWikiToDocx(inputFile);
            }
            else
            {
                Console.WriteLine("Obsługiwane formaty: .docx, .wiki");
            }
        }

        static void ConvertDocxToWiki(string inputFile)
        {
            string outputFile = Path.ChangeExtension(inputFile, ".wiki");

            using (WordprocessingDocument doc = WordprocessingDocument.Open(inputFile, false))
            using (StreamWriter writer = new StreamWriter(outputFile))
            {
                var paragraphs = doc.MainDocumentPart.Document.Body.Elements<Paragraph>();

                foreach (var paragraph in paragraphs)
                {
                    int headingLevel = GetHeadingLevel(paragraph);
                    if (headingLevel > 0 && headingLevel <= 3)
                    {
                        writer.WriteLine(new string('=', headingLevel) + " " + paragraph.InnerText + " " + new string('=', headingLevel));
                    }
                    else
                    {
                        writer.WriteLine(paragraph.InnerText);
                    }
                }
            }

            Console.WriteLine($"Konwersja DOCX → WIKI zakończona: {outputFile}");
        }

        static void ConvertWikiToDocx(string inputFile)
        {
            string outputFile = Path.ChangeExtension(inputFile, ".docx");

            using (WordprocessingDocument doc = WordprocessingDocument.Create(outputFile, WordprocessingDocumentType.Document))
            {
                var mainPart = doc.AddMainDocumentPart();
                mainPart.Document = new Document();
                var body = mainPart.Document.AppendChild(new Body());

                string[] lines = File.ReadAllLines(inputFile);

                foreach (string line in lines)
                {
                    var match = Regex.Match(line, @"^(=+)\s*(.*?)\s*\1$");
                    if (match.Success)
                    {
                        int level = match.Groups[1].Length;
                        var para = new Paragraph(new Run(new Text(match.Groups[2].Value)));
                        SetHeadingStyle(para, level);
                        body.AppendChild(para);
                    }
                    else
                    {
                        body.AppendChild(new Paragraph(new Run(new Text(line))));
                    }
                }

                mainPart.Document.Save();
            }

            Console.WriteLine($"Konwersja WIKI → DOCX zakończona: {outputFile}");
        }

        static int GetHeadingLevel(Paragraph paragraph)
        {
            var paraProperties = paragraph.Elements<ParagraphProperties>().FirstOrDefault();
            var styleId = paraProperties?.ParagraphStyleId?.Val?.Value;
            return styleId switch
            {
                "Heading1" => 1,
                "Heading2" => 2,
                "Heading3" => 3,
                _ => 0
            };
        }

        static void SetHeadingStyle(Paragraph paragraph, int level)
        {
            var paraProperties = new ParagraphProperties();
            paraProperties.ParagraphStyleId = new ParagraphStyleId() { Val = "Heading" + level };
            paragraph.PrependChild(paraProperties);
        }
    }

}
