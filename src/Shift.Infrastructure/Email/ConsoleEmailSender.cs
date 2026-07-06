using Microsoft.Extensions.Logging;
using Shift.Application.Common.Interfaces;

namespace Shift.Infrastructure.Email;

// Dev/pilot fallback: SMTP yapılandırılmamışsa e-postayı loga basar.
// Davet/reset linki terminalde görünür → gerçek SMTP bağlamadan akış test edilir.
public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        _logger.LogInformation(
            "[DEV E-POSTA] Kime: {To} | Konu: {Subject}\n{Body}",
            toEmail, subject, htmlBody);
        return Task.CompletedTask;
    }
}
