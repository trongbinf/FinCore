using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;

namespace FinCore.Application.Features.ActivityLogs.Queries.GetActivityLogs;

public record GetActivityLogsQuery : IRequest<List<ActivityLogDto>>;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string UserFullName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string EntityName { get; set; } = null!;
    public Guid? EntityId { get; set; }
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; }
}

public class GetActivityLogsQueryHandler : IRequestHandler<GetActivityLogsQuery, List<ActivityLogDto>>
{
    private readonly IApplicationDbContext _context;

    public GetActivityLogsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ActivityLogDto>> Handle(GetActivityLogsQuery request, CancellationToken cancellationToken)
    {
        var logs = await _context.ActivityLogs
            .Include(l => l.User)
            .OrderByDescending(l => l.Timestamp)
            .Select(l => new ActivityLogDto
            {
                Id = l.Id,
                UserFullName = l.User.FullName,
                Action = l.Action,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                Description = l.Description,
                Timestamp = l.Timestamp
            })
            .Take(100) // Limit to latest 100 entries
            .ToListAsync(cancellationToken);

        return logs;
    }
}
