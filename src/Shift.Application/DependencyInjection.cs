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

        return services;
    }
}