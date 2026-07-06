namespace Shift.Infrastructure.Email;

// SMTP ayarları — appsettings "Email" bölümünden. Gerçek değerler asla koda gömülmez:
// local'de user-secrets / appsettings.Development.json, prod'da env değişkeni.
public class EmailOptions
{
    public const string SectionName = "Email";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Pass { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Shift";

    // Host boşsa gerçek gönderim yapılamaz → dev'de ConsoleEmailSender devreye girer.
    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host);
}
