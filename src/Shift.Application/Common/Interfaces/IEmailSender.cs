namespace Shift.Application.Common.Interfaces;

// E-posta gönderim soyutlaması. Sağlayıcı (SMTP, ileride API tabanlı servis)
// Infrastructure'da seçilir; Application yalnızca bu sözleşmeyi bilir.
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct);
}
