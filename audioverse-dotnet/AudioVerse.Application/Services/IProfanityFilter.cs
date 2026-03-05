namespace AudioVerse.Application.Services;

public interface IProfanityFilter
{
    bool ContainsProfanity(string input);
    string Censor(string input);
}
