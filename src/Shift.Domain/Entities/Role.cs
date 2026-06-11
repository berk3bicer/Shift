using Shift.Domain.Common;

namespace Shift.Domain.Entities;

public class Role : BaseEntity
{
    public RoleType Type { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public enum RoleType
{
    Owner = 0,            // İşletme sahibi
    Manager = 1,          // Yönetici / Müdür
    AssistantManager = 2, // Asistan yönetici
    Staff = 3,            // Personel (barista, kasiyer...)
    Supplier = 4          // Tedarikçi
}