using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Infrastructure.Authentication;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _config;

    public JwtTokenGenerator(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user, IEnumerable<RoleType> roles)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("userId", user.Id.ToString()),
            new("tenantId", user.TenantId.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Email, user.Email)
        };

        // Her rol ayrı bir claim olarak eklenir
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role.ToString()));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenMinutes"]!)),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}