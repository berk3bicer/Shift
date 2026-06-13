namespace Shift.Application.Common.Interfaces;

// Şu an login olan kullanıcının kimliğini verir.
// ITenantProvider'ın kardeşi: o TenantId'yi token'dan okur, bu UserId'yi.
// Amaç: handler'lar "talebi kim oluşturdu?" bilgisini CLIENT'tan değil
// token'dan alsın (IDOR koruması — kimlik sahtelenemez).
public interface ICurrentUserProvider
{
    Guid? GetUserId();
}