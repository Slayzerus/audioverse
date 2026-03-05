namespace AudioVerse.SetupWizard;

public static class EnvTemplate
{
    public static string Generate(DeploymentSecrets s, bool useDockerSecrets)
    {
        if (useDockerSecrets)
        {
            return $"""
                # AudioVerse deployment environment
                ASPNETCORE_ENVIRONMENT=Development

                # Postgres
                POSTGRES_USER={s.PostgresUser}
                POSTGRES_PASSWORD_FILE=./secrets/postgres_password.txt
                POSTGRES_DB=audioverse_db

                # MinIO
                MINIO_ROOT_USER={s.MinioUser}
                MINIO_ROOT_PASSWORD_FILE=./secrets/minio_password.txt

                # Redis
                REDIS_PASSWORD_FILE=./secrets/redis_password.txt

                # JWT (IdentityServer)
                JWT_SECRET={s.JwtSecret}

                # Admin password is configured via the UI onboarding flow
                APP_ADMIN_PASSWORD=
                """;
        }

        return $"""
            # AudioVerse deployment environment
            ASPNETCORE_ENVIRONMENT=Development

            # Postgres
            POSTGRES_USER={s.PostgresUser}
            POSTGRES_PASSWORD={s.PostgresPassword}
            POSTGRES_DB=audioverse_db

            # MinIO
            MINIO_ROOT_USER={s.MinioUser}
            MINIO_ROOT_PASSWORD={s.MinioPassword}

            # Redis
            REDIS_PASSWORD={s.RedisPassword}

            # JWT (IdentityServer)
            JWT_SECRET={s.JwtSecret}

            # Admin password is configured via the UI onboarding flow
            APP_ADMIN_PASSWORD=
            """;
    }
}
