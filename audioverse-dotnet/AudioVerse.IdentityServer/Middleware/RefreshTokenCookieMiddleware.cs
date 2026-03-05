using System.Text;
using System.Text.Json;

namespace AudioVerse.IdentityServer.Middleware;

/// <summary>
/// Middleware przechwytujący flow refresh tokenów:
/// 1) RESPONSE: wyciąga refresh_token z JSON body OpenIddict, ustawia jako httpOnly cookie, usuwa z body
/// 2) REQUEST:  jeśli jest cookie z refresh_token i grant_type=refresh_token, wstrzykuje go do form body
/// </summary>
public class RefreshTokenCookieMiddleware
{
    public const string CookieName = "av_refresh_token";
    private const string TokenEndpoint = "/connect/token";
    private const int RefreshTokenExpirationDays = 14;

    private readonly RequestDelegate _next;

    public RefreshTokenCookieMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        var path = context.Request.Path.Value;
        var isTokenEndpoint = string.Equals(path, TokenEndpoint, StringComparison.OrdinalIgnoreCase);

        // ── REQUEST: wstrzyknij refresh_token z cookie do formularza ──
        if (isTokenEndpoint && HttpMethods.IsPost(context.Request.Method))
        {
            await InjectRefreshTokenFromCookie(context);
        }

        // ── RESPONSE: przechwytuj body, wyciągnij refresh_token ──
        if (isTokenEndpoint && HttpMethods.IsPost(context.Request.Method))
        {
            await InterceptTokenResponse(context);
        }
        else
        {
            await _next(context);
        }
    }

    private async Task InjectRefreshTokenFromCookie(HttpContext context)
    {
        if (!context.Request.HasFormContentType) return;

        var form = await context.Request.ReadFormAsync();
        var grantType = form["grant_type"].ToString();

        // Tylko jeśli grant_type=refresh_token i brak refresh_token w form (bo jest w cookie)
        if (!string.Equals(grantType, "refresh_token", StringComparison.OrdinalIgnoreCase)) return;
        if (form.ContainsKey("refresh_token") && !string.IsNullOrEmpty(form["refresh_token"])) return;

        var cookieToken = context.Request.Cookies[CookieName];
        if (string.IsNullOrEmpty(cookieToken)) return;

        // Odtwórz formularz z dodanym refresh_token
        var newForm = new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>();
        foreach (var kvp in form)
            newForm[kvp.Key] = kvp.Value;

        newForm["refresh_token"] = cookieToken;

        context.Request.Form = new FormCollection(newForm);
    }

    private async Task InterceptTokenResponse(HttpContext context)
    {
        var originalBody = context.Response.Body;

        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        await _next(context);

        memoryStream.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

        // Tylko przetwarzaj sukces JSON
        if (context.Response.StatusCode == 200 && context.Response.ContentType?.Contains("application/json") == true)
        {
            try
            {
                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;

                if (root.TryGetProperty("refresh_token", out var refreshTokenElement))
                {
                    var refreshToken = refreshTokenElement.GetString();

                    if (!string.IsNullOrEmpty(refreshToken))
                    {
                        // Ustaw httpOnly cookie
                        context.Response.Cookies.Append(CookieName, refreshToken, new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Path = "/connect",
                            MaxAge = TimeSpan.FromDays(RefreshTokenExpirationDays),
                            IsEssential = true
                        });

                        // Usuń refresh_token z JSON body — front go nie potrzebuje
                        var filtered = new Dictionary<string, object>();
                        foreach (var prop in root.EnumerateObject())
                        {
                            if (prop.Name == "refresh_token") continue;
                            filtered[prop.Name] = prop.Value.ValueKind switch
                            {
                                JsonValueKind.String => prop.Value.GetString()!,
                                JsonValueKind.Number => prop.Value.GetInt64(),
                                JsonValueKind.True => true,
                                JsonValueKind.False => false,
                                _ => prop.Value.GetRawText()
                            };
                        }

                        responseBody = JsonSerializer.Serialize(filtered);
                    }
                }
            }
            catch (JsonException)
            {
                // Nie JSON — przepuść bez zmian
            }
        }

        // Zapisz finalny body do oryginalnego strumienia
        context.Response.Body = originalBody;
        var bytes = Encoding.UTF8.GetBytes(responseBody);
        context.Response.ContentLength = bytes.Length;
        await context.Response.Body.WriteAsync(bytes);
    }
}
