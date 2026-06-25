using Microsoft.EntityFrameworkCore;
using Shift.Domain.Entities;

namespace Shift.Application.Common.Interfaces;

public interface IShiftDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Branch> Branches { get; }
    DbSet<Position> Positions { get; }
    DbSet<Shift.Domain.Entities.Shift> Shifts { get; }
    DbSet<Availability> Availabilities { get; }
    DbSet<TimeOffRequest> TimeOffRequests { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<TimeClock> TimeClocks { get; }
    DbSet<OvertimeSettings> OvertimeSettings { get; }
    DbSet<OvertimeRecord> OvertimeRecords { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<Checklist> Checklists { get; }
    DbSet<ChecklistRun> ChecklistRuns { get; }
    DbSet<ShiftNote> ShiftNotes { get; }
    DbSet<Announcement> Announcements { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<UserBranch> UserBranches { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}