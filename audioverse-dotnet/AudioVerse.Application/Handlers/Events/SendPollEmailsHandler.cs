using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SendPollEmailsHandler(IEventRepository r, AudioVerse.Infrastructure.Email.IEmailSender emailSender) : IRequestHandler<SendPollEmailsCommand, int>
{
    public async Task<int> Handle(SendPollEmailsCommand req, CancellationToken ct)
    {
        var poll = await r.GetPollByIdAsync(req.PollId);
        var pollTitle = poll?.Title ?? "Ankieta AudioVerse";
        int sent = 0;

        foreach (var email in req.Emails)
        {
            var link = $"{req.BaseUrl.TrimEnd('/')}/poll/{poll?.Token ?? req.PollId.ToString()}";
            var body = $"""
                <h2>{pollTitle}</h2>
                <p>Zapraszamy do udziaÅ‚u w ankiecie.</p>
                <p><a href="{link}">Kliknij tutaj, aby zagÅ‚osowaÄ‡</a></p>
                <hr/>
                <small>AudioVerse â€” automatyczna wiadomoÅ›Ä‡</small>
                """;

            try
            {
                await emailSender.SendAsync(email, $"Ankieta: {pollTitle}", body, html: true);
                sent++;
            }
            catch (Exception ex)
            {
                _ = ex; // log and continue â€” don't fail the whole batch
            }
        }

        return sent;
    }
}
