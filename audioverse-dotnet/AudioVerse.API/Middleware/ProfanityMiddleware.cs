using AudioVerse.Application.Services;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace AudioVerse.API.Middleware
{
    /// <summary>
    /// Middleware that scans POST/PUT request bodies for profanity.
    /// Blocks requests containing inappropriate language with a 400 Bad Request.
    /// </summary>
    /// <remarks>
    /// Only scans specific fields: name, title, nickname, description, displayname, username.
    /// Requires IProfanityFilter service to be registered in DI.
    /// </remarks>
    public class ProfanityMiddleware
    {
        private readonly RequestDelegate _next;

        public ProfanityMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Method == "POST" || context.Request.Method == "PUT")
            {
                if (context.Request.ContentType?.Contains("application/json") == true)
                {
                    context.Request.EnableBuffering();
                    var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
                    context.Request.Body.Position = 0;

                    if (!string.IsNullOrEmpty(body))
                    {
                        var filter = context.RequestServices.GetService<IProfanityFilter>();
                        if (filter != null)
                        {
                            try
                            {
                                var doc = JsonDocument.Parse(body);
                                if (ContainsProfanityInJson(doc.RootElement, filter))
                                {
                                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                                    context.Response.ContentType = "application/json";
                                    await context.Response.WriteAsync("{\"error\":\"Content contains inappropriate language.\"}");
                                    return;
                                }
                            }
                            catch (JsonException) { }
                        }
                    }
                }
            }

            await _next(context);
        }

        private static bool ContainsProfanityInJson(JsonElement element, IProfanityFilter filter)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.String:
                    return filter.ContainsProfanity(element.GetString() ?? "");
                case JsonValueKind.Object:
                    foreach (var prop in element.EnumerateObject())
                    {
                        var name = prop.Name.ToLowerInvariant();
                        if (name is "name" or "title" or "nickname" or "description" or "displayname" or "username")
                        {
                            if (prop.Value.ValueKind == JsonValueKind.String && filter.ContainsProfanity(prop.Value.GetString() ?? ""))
                                return true;
                        }
                    }
                    break;
                case JsonValueKind.Array:
                    foreach (var item in element.EnumerateArray())
                        if (ContainsProfanityInJson(item, filter)) return true;
                    break;
            }
            return false;
        }
    }
}
