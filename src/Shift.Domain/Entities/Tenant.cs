using Shift.Domain.Common;

namespace Shift.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public BusinessType Type { get; set; }
    public bool IsActive { get; set; } = true;

    // Bir Tenant'ın birden çok kullanıcısı olur
    public ICollection<User> Users { get; set; } = new List<User>();
}

public enum BusinessType
{
    Cafe = 0,
    Restaurant = 1,
    Bakery = 2,
    FastFood = 3
}