using MediatR;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Checklists.Create;

public class CreateChecklistHandler
    : IRequestHandler<CreateChecklistCommand, CreateChecklistResult>
{
    private readonly IShiftDbContext _db;

    public CreateChecklistHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreateChecklistResult> Handle(
        CreateChecklistCommand request, CancellationToken ct)
    {
        var checklist = new Checklist
        {
            // TenantId YOK — interceptor hem şablonu hem maddeleri (ITenantEntity) damgalar.
            Type = request.Type,
            Name = request.Name,
            IsActive = true,
            Items = request.Items
                .Select((text, index) => new ChecklistItem
                {
                    Text = text,
                    SortOrder = index       // liste sırası = gösterim sırası
                })
                .ToList()
        };

        _db.Checklists.Add(checklist);
        await _db.SaveChangesAsync(ct);

        return new CreateChecklistResult(checklist.Id);
    }
}
