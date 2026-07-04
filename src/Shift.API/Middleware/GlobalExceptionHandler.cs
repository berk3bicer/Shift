using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Common.Exceptions;

namespace Shift.API.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken ct)
    {
        var (status, title) = exception switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Doğrulama hatası"),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Yetkisiz"),
            ForbiddenAccessException => (StatusCodes.Status403Forbidden, "Yetkisiz erişim"),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "Geçersiz işlem"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Bulunamadı"),
            _ => (StatusCodes.Status500InternalServerError, "Sunucu hatası")
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message
        };

        // Validation hatalarında tek tek mesajları ekle
        if (exception is ValidationException vex)
        {
            problem.Extensions["errors"] = vex.Errors
                .Select(e => e.ErrorMessage)
                .ToArray();
        }

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, ct);
        return true; // hata işlendi
    }
}