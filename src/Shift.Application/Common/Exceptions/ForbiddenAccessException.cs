namespace Shift.Application.Common.Exceptions;

// Kimlikli ama yetkisiz erişim (403). UnauthorizedAccessException'dan (401,
// "kimliksiz") KASITLI olarak türemez — standalone Exception olmazsa switch
// pattern matching'te üst tip onu da yakalar ve yanlışlıkla 401 döner.
public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message) : base(message) { }
}
