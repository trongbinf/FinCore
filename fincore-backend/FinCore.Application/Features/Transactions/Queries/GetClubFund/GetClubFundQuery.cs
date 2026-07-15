using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;

namespace FinCore.Application.Features.Transactions.Queries.GetClubFund;

public record GetClubFundQuery : IRequest<ClubFundDto>;

public class ClubFundDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

public class GetClubFundQueryHandler : IRequestHandler<GetClubFundQuery, ClubFundDto>
{
    private readonly IApplicationDbContext _context;

    public GetClubFundQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ClubFundDto> Handle(GetClubFundQuery request, CancellationToken cancellationToken)
    {
        var fund = await _context.ClubFunds.FirstOrDefaultAsync(cancellationToken);
        if (fund == null)
        {
            return new ClubFundDto
            {
                TotalRevenue = 0,
                TotalExpense = 0,
                Balance = 0,
                LastUpdatedAt = DateTime.UtcNow
            };
        }

        return new ClubFundDto
        {
            TotalRevenue = fund.TotalRevenue,
            TotalExpense = fund.TotalExpense,
            Balance = fund.Balance,
            LastUpdatedAt = fund.LastUpdatedAt
        };
    }
}
