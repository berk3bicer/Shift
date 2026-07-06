using MediatR;

namespace Shift.Application.Features.Auth.ForgotPassword;

// Anonim uç. SONUÇ HER ZAMAN AYNI (e-posta kayıtlı olsa da olmasa da) —
// aksi hâlde uç, "bu e-posta sistemde var mı?" sorusuna cevap veren bir
// kullanıcı-sayım (enumeration) aracına dönüşür.
public record ForgotPasswordCommand(string Email) : IRequest;
