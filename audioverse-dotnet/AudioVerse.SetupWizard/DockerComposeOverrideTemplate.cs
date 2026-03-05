namespace AudioVerse.SetupWizard;

public static class DockerComposeOverrideTemplate
{
    public static string Generate() => """
        version: '3.8'
        services:
          api:
            environment:
              ASPNETCORE_ENVIRONMENT: Development
            volumes:
              - ./AudioVerse.API:/app/AudioVerse.API:ro
              - ./AudioVerse.Infrastructure:/app/AudioVerse.Infrastructure:ro
            ports:
              - "5000:5000"
        """;
}
