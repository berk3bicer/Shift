using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shift.Application.Common.Interfaces;
using Shift.Infrastructure.Authentication;
using Shift.Infrastructure.MultiTenancy;
using Shift.Infrastructure.Persistence;
using Shift.Infrastructure.Storage;


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

        // Dosya depolama: ayarları bağla + sağlayıcıyı seç. Şimdilik yerel mock;
        // R2 credential gelince Provider="R2" + R2FileStorage takılır (aynı IFileStorage).
        var fsSection = configuration.GetSection(FileStorageOptions.SectionName);
        services.Configure<FileStorageOptions>(opt =>
        {
            opt.Provider = fsSection["Provider"] ?? opt.Provider;
            opt.LocalBasePath = fsSection["LocalBasePath"] ?? opt.LocalBasePath;
            opt.PublicBaseUrl = fsSection["PublicBaseUrl"] ?? opt.PublicBaseUrl;
            opt.SigningSecret = fsSection["SigningSecret"] ?? opt.SigningSecret;
            if (int.TryParse(fsSection["UrlExpiryMinutes"], out var m)) opt.UrlExpiryMinutes = m;
        });
        services.AddScoped<LocalFileStorage>();
        services.AddScoped<IFileStorage>(sp => sp.GetRequiredService<LocalFileStorage>());

        return services;
    }
}