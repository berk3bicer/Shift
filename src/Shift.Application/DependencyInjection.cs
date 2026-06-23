using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;

namespace Shift.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR: bu assembly'deki tüm handler'ları otomatik bulup kaydeder
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(Common.Behaviors.ValidationBehavior<,>));
        });

        // FluentValidation: bu assembly'deki tüm validator'ları otomatik bulup kaydeder
        services.AddValidatorsFromAssembly(assembly);

        // Vardiya iş kuralları servisi — Create ve Update handler'ları kullanır.
        // Scoped: DbContext ile aynı yaşam döngüsü (her HTTP isteğinde bir örnek).
        services.AddScoped<Common.Interfaces.IShiftRuleChecker, Common.Services.ShiftRuleChecker>();

        // Mesai hesap motoru — anlık görüntü (Query) ve ileride OvertimeRecord kullanır.
        // Scoped: DbContext ile aynı yaşam döngüsü.
        services.AddScoped<Common.Interfaces.IOvertimeCalculator, Common.Services.Overtime.OvertimeCalculator>();

        return services;
    }
}