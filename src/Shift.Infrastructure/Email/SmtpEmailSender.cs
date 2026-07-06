using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Shift.Application.Common.Interfaces;

namespace Shift.Infrastructure.Email;

// Gerçek SMTP gönderimi — MailKit (System.Net.Mail'den daha sağlam ve bakımlı).
// Her gönderimde bağlan/gönder/kapat: düşük hacimli davet/reset e-postaları için yeterli,
// bağlantı havuzu gerekirse ileride eklenir.
public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;

    public SmtpEmailSender(EmailOptions options)
    {
        _options = options;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        // StartTls (587) yaygın varsayılan; 465 verilirse MailKit Auto ile SslOnConnect'e düşer.
        await client.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrWhiteSpace(_options.User))
            await client.AuthenticateAsync(_options.User, _options.Pass, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(quit: true, ct);
    }
}
