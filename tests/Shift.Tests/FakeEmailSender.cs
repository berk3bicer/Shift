using Shift.Application.Common.Interfaces;

namespace Shift.Tests;

// Gerçek e-posta ATMAZ — gönderilenleri biriktirir, test içerik/alıcı doğrular.
public class FakeEmailSender : IEmailSender
{
    public record SentEmail(string To, string Subject, string HtmlBody);

    public List<SentEmail> Sent { get; } = new();

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        Sent.Add(new SentEmail(toEmail, subject, htmlBody));
        return Task.CompletedTask;
    }
}
