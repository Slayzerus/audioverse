namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// Type of CAPTCHA challenge (text, math, image, audio).
    /// </summary>
    public enum CaptchaType
    {
        QuestionAnswer = 1,              // Odpowied? na pytanie
        ReverseString = 2,               // Przepisanie w odwrotnej kolejno?ci
        ImageQuestion = 3,               // Grafika z pytaniem
        MathProblem = 4,                 // Zadanie matematyczne
        ImageSelection = 5,              // Zaznaczanie obrazków
        ImageRegionSelection = 6,        // Zaznaczanie na obrazku
        PuzzleMatching = 7,              // Dopasowanie puzzli
        AudioQuestion = 8                // Audio pytanie
    }
}
