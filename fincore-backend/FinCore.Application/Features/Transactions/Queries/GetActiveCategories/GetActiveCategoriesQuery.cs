using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;

namespace FinCore.Application.Features.Transactions.Queries.GetActiveCategories;

public record GetActiveCategoriesQuery : IRequest<List<CategoryDto>>;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
}

public class GetActiveCategoriesQueryHandler : IRequestHandler<GetActiveCategoriesQuery, List<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetActiveCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> Handle(GetActiveCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _context.TransactionCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Type = c.Type.ToString()
            })
            .ToListAsync(cancellationToken);

        return categories;
    }
}
