using Shift.Infrastructure;
using Shift.Application;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Shift.API.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddControllers();

// FE kök adresi — davet/şifre-sıfırlama e-postalarındaki linkler bunun altına kurulur.
builder.Services.AddSingleton(new Shift.Application.Common.AppUrlOptions(
    builder.Configuration["App:BaseUrl"] ?? "http://localhost:3000"));

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Key"]!))
        };
    });

builder.Services.AddExceptionHandler<Shift.API.Middleware.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Anonim auth uçlarına IP bazlı rate limit (suistimal/e-posta bombardımanı önleme).
// Partisyon anahtarı IP: e-posta bazlı olsaydı enumeration koruması delinirdi.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthRateLimitPolicies.AuthStrict, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => AuthRateLimitPolicies.StrictWindow()));
    options.AddPolicy(AuthRateLimitPolicies.AuthLogin, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => AuthRateLimitPolicies.LoginWindow()));
});

var app = builder.Build();

app.UseExceptionHandler();

app.UseRateLimiter(); // auth'tan ÖNCE: limit anonim istekleri de saymalı

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.Run();

