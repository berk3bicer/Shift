using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shift.Application.Common.Interfaces;
using Shift.Infrastructure.Authentication;
using Shift.Infrastructure.MultiTenancy;
using Shift.Infrastructure.Persistence;


namespace Shift.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ShiftDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IShiftDbContext>(sp => sp.GetRequiredService<ShiftDbContext>());

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // TenantProvider'ı hem interface hem somut tip olarak kaydet.
        // Scoped: her HTTP isteği için bir tane (istek boyunca aynı tenant).
        services.AddScoped<TenantProvider>();
        services.AddScoped<ITenantProvider>(sp => sp.GetRequiredService<TenantProvider>());

        // CurrentUserProvider: aynı desen. Login olan kullanıcının UserId'sini
        // token'dan okur. Somut tip de kayıtlı (test'te SetUserId için).
        services.AddScoped<CurrentUserProvider>();
        services.AddScoped<ICurrentUserProvider>(sp => sp.GetRequiredService<CurrentUserProvider>());

        services.AddHttpContextAccessor();

        return services;
    }
}