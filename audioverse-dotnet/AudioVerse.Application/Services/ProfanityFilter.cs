namespace AudioVerse.Application.Services
{
    public class ProfanityFilter : IProfanityFilter
    {
        private static readonly HashSet<string> ProfanityWords = new(StringComparer.OrdinalIgnoreCase)
        {
            // PL
            "kurwa", "kurwy", "kurw?", "chuj", "chuja", "chujem", "cipa", "cip?", "cipka",
            "pierdol", "pierdol?", "pierdoli?", "jeba?", "jeba?", "jebany", "jebana",
            "spierdalaj", "spierdoli?", "wyjeba?", "zajebisty", "pojeb", "pojebie",
            "dupek", "dup?", "dupa", "skurwysyn", "skurwiel", "suka", "dziwka",
            "peda?", "cwel", "frajer",
            // EN
            "fuck", "fucking", "shit", "shitty", "bitch", "bastard", "ass", "asshole",
            "dick", "pussy", "cunt", "damn", "whore", "slut", "retard", "nigger", "faggot"
        };

        public bool ContainsProfanity(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;
            var words = input.Split(new[] { ' ', '\t', '\n', '\r', '-', '_', '.', ',' }, StringSplitOptions.RemoveEmptyEntries);
            return words.Any(w => ProfanityWords.Contains(w));
        }

        public string Censor(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            var result = input;
            foreach (var word in ProfanityWords)
            {
                var pattern = System.Text.RegularExpressions.Regex.Escape(word);
                result = System.Text.RegularExpressions.Regex.Replace(
                    result, pattern,
                    m => new string('*', m.Length),
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
            return result;
        }
    }
}
