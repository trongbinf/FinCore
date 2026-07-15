using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using FinCore.Domain.Common;
using FinCore.Application.Interfaces;

namespace FinCore.Infrastructure.Persistence;

public class ApplicationDbContextInitializer
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<ApplicationDbContextInitializer> _logger;

    public ApplicationDbContextInitializer(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<ApplicationDbContextInitializer> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        try
        {
            if (_context.Database.IsSqlServer())
            {
                await _context.Database.MigrateAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi khi chạy migrations cơ sở dữ liệu.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi khi tạo dữ liệu mẫu (seeding database).");
            throw;
        }
    }

    private async Task TrySeedAsync()
    {
        // 1. Seed Categories
        if (!await _context.TransactionCategories.AnyAsync())
        {
            var categories = new List<TransactionCategory>
            {
                // Revenue Categories
                new() { Name = "Hội phí thành viên", Type = TransactionType.Revenue },
                new() { Name = "Tài trợ", Type = TransactionType.Revenue },
                new() { Name = "Quyên góp", Type = TransactionType.Revenue },
                new() { Name = "Thu từ sự kiện", Type = TransactionType.Revenue },
                new() { Name = "Thu bán sản phẩm", Type = TransactionType.Revenue },
                new() { Name = "Thu khác", Type = TransactionType.Revenue },

                // Expense Categories
                new() { Name = "Thuê địa điểm", Type = TransactionType.Expense },
                new() { Name = "Mua thiết bị", Type = TransactionType.Expense },
                new() { Name = "Văn phòng phẩm", Type = TransactionType.Expense },
                new() { Name = "Tổ chức sự kiện", Type = TransactionType.Expense },
                new() { Name = "Ăn uống", Type = TransactionType.Expense },
                new() { Name = "Truyền thông", Type = TransactionType.Expense },
                new() { Name = "Chi khác", Type = TransactionType.Expense }
            };

            _context.TransactionCategories.AddRange(categories);
            await _context.SaveChangesAsync();
        }

        // Fetch categories to link to transactions later
        var allCats = await _context.TransactionCategories.ToListAsync();
        var catMembership = allCats.First(c => c.Name == "Hội phí thành viên");
        var catSponsor = allCats.First(c => c.Name == "Tài trợ");
        var catRent = allCats.First(c => c.Name == "Thuê địa điểm");
        var catEquipment = allCats.First(c => c.Name == "Mua thiết bị");
        var catFood = allCats.First(c => c.Name == "Ăn uống");
        var catOffice = allCats.First(c => c.Name == "Văn phòng phẩm");

        // 2. Seed Default Admin User & Sample Members
        var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@fincore.com");
        if (existingAdmin != null)
        {
            var needsUpdate = false;
            if (existingAdmin.IsPasswordTemp)
            {
                existingAdmin.IsPasswordTemp = false;
                needsUpdate = true;
            }

            try
            {
                if (!_passwordHasher.VerifyPassword("Admin@123", existingAdmin.PasswordHash))
                {
                    existingAdmin.PasswordHash = _passwordHasher.HashPassword("Admin@123");
                    needsUpdate = true;
                }
            }
            catch
            {
                existingAdmin.PasswordHash = _passwordHasher.HashPassword("Admin@123");
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await _context.SaveChangesAsync();
            }
        }

        var existingMember1 = await _context.Users.FirstOrDefaultAsync(u => u.Email == "member1@fincore.com");
        if (existingMember1 != null)
        {
            var needsUpdate = false;
            try
            {
                if (!_passwordHasher.VerifyPassword("Member@123", existingMember1.PasswordHash))
                {
                    existingMember1.PasswordHash = _passwordHasher.HashPassword("Member@123");
                    needsUpdate = true;
                }
            }
            catch
            {
                existingMember1.PasswordHash = _passwordHasher.HashPassword("Member@123");
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await _context.SaveChangesAsync();
            }
        }

        var hasAdmin = await _context.Users.AnyAsync(u => u.Email == "admin@fincore.com");
        if (!hasAdmin)
        {
            var adminUser = new User
            {
                FullName = "Admin FinCore",
                Email = "admin@fincore.com",
                PasswordHash = _passwordHasher.HashPassword("Admin@123"),
                Phone = "0900000000",
                Role = UserRole.Admin,
                IsActive = true,
                IsPasswordTemp = false,
                CreatedAt = TimeHelper.GetVietnamTime(),
                CreatedBy = "System"
            };
            _context.Users.Add(adminUser);
        }

        var hasMember1 = await _context.Users.AnyAsync(u => u.Email == "member1@fincore.com");
        if (!hasMember1)
        {
            var member1 = new User
            {
                FullName = "Trần Thị B",
                Email = "member1@fincore.com",
                PasswordHash = _passwordHasher.HashPassword("Member@123"),
                Phone = "0987654321",
                Role = UserRole.Member,
                IsActive = true,
                IsPasswordTemp = false,
                CreatedAt = TimeHelper.GetVietnamTime(),
                CreatedBy = "System"
            };
            _context.Users.Add(member1);
        }

        var hasMember2 = await _context.Users.AnyAsync(u => u.Email == "member2@fincore.com");
        if (!hasMember2)
        {
            var member2 = new User
            {
                FullName = "Phạm Văn C",
                Email = "member2@fincore.com",
                PasswordHash = _passwordHasher.HashPassword("Member@123"),
                Phone = "0912345678",
                Role = UserRole.Member,
                IsActive = false,
                IsPasswordTemp = false,
                CreatedAt = TimeHelper.GetVietnamTime(),
                CreatedBy = "System"
            };
            _context.Users.Add(member2);
        }

        if (!hasAdmin || !hasMember1 || !hasMember2)
        {
            await _context.SaveChangesAsync();
        }

        // Fetch Admin user for transaction creations
        var admin = await _context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        // 3. Seed Club Fund
        if (!await _context.ClubFunds.AnyAsync())
        {
            var fund = new ClubFund
            {
                TotalRevenue = 370000000,
                TotalExpense = 262000000,
                Balance = 108000000,
                LastUpdatedAt = TimeHelper.GetVietnamTime()
            };

            _context.ClubFunds.Add(fund);
            await _context.SaveChangesAsync();
        }

        // 4. Seed Transactions
        if (!await _context.Transactions.AnyAsync())
        {
            var transactions = new List<Transaction>
            {
                new()
                {
                    Title = "Hội phí thành viên Q1",
                    Type = TransactionType.Revenue,
                    CategoryId = catMembership.Id,
                    Amount = 120000000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-30).Date,
                    Description = "Thu phí sinh hoạt từ 40 thành viên chính thức",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Approved,
                    ApprovedById = admin.Id,
                    ApprovedAt = TimeHelper.GetVietnamTime().AddDays(-29)
                },
                new()
                {
                    Title = "Tài trợ từ đối tác Alpha",
                    Type = TransactionType.Revenue,
                    CategoryId = catSponsor.Id,
                    Amount = 250000000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-20).Date,
                    Description = "Nhà tài trợ vàng cho chiến dịch thường niên",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Approved,
                    ApprovedById = admin.Id,
                    ApprovedAt = TimeHelper.GetVietnamTime().AddDays(-19)
                },
                new()
                {
                    Title = "Chi phí thuê hội trường sự kiện",
                    Type = TransactionType.Expense,
                    CategoryId = catRent.Id,
                    Amount = 180000000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-15).Date,
                    Description = "Thuê sảnh chính sự kiện Gala CLB",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Approved,
                    ApprovedById = admin.Id,
                    ApprovedAt = TimeHelper.GetVietnamTime().AddDays(-14)
                },
                new()
                {
                    Title = "Mua sắm máy chiếu & micro mới",
                    Type = TransactionType.Expense,
                    CategoryId = catEquipment.Id,
                    Amount = 82000000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-10).Date,
                    Description = "Trang bị phòng sinh hoạt chính",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Approved,
                    ApprovedById = admin.Id,
                    ApprovedAt = TimeHelper.GetVietnamTime().AddDays(-9)
                },
                new()
                {
                    Title = "Chi tiệc liên hoan thành viên Q2",
                    Type = TransactionType.Expense,
                    CategoryId = catFood.Id,
                    Amount = 24000000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-2).Date,
                    Description = "Đặt tiệc nhẹ tại nhà hàng Hoa",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Pending
                },
                new()
                {
                    Title = "In ấn tài liệu CLB",
                    Type = TransactionType.Expense,
                    CategoryId = catOffice.Id,
                    Amount = 3500000,
                    TransactionDate = TimeHelper.GetVietnamTime().AddDays(-5).Date,
                    Description = "Tài liệu đào tạo thành viên mới",
                    CreatorId = admin.Id,
                    Status = TransactionStatus.Rejected,
                    ApprovedById = admin.Id,
                    ApprovedAt = TimeHelper.GetVietnamTime().AddDays(-4),
                    RejectionReason = "Chưa có báo giá cạnh tranh hoặc hóa đơn chi tiết kèm theo."
                }
            };

            _context.Transactions.AddRange(transactions);
            await _context.SaveChangesAsync();
        }

        // 5. Seed Activity Logs
        if (!await _context.ActivityLogs.AnyAsync())
        {
            var logs = new List<ActivityLog>
            {
                new()
                {
                    UserId = admin.Id,
                    Action = "Khởi tạo hệ thống tài chính",
                    EntityName = "System",
                    Description = "Khởi tạo hệ thống tài chính và thiết lập số dư quỹ ban đầu.",
                    Timestamp = TimeHelper.GetVietnamTime().AddDays(-30)
                },
                new()
                {
                    UserId = admin.Id,
                    Action = "Duyệt giao dịch",
                    EntityName = "Transaction",
                    Description = "Phê duyệt khoản thu 'Hội phí thành viên Q1', số tiền: 120.000.000đ.",
                    Timestamp = TimeHelper.GetVietnamTime().AddDays(-29)
                },
                new()
                {
                    UserId = admin.Id,
                    Action = "Duyệt giao dịch",
                    EntityName = "Transaction",
                    Description = "Phê duyệt khoản thu 'Tài trợ từ đối tác Alpha', số tiền: 250.000.000đ.",
                    Timestamp = TimeHelper.GetVietnamTime().AddDays(-19)
                },
                new()
                {
                    UserId = admin.Id,
                    Action = "Đăng nhập hệ thống",
                    EntityName = "User",
                    Description = "Người dùng đăng nhập vào trang quản trị.",
                    Timestamp = TimeHelper.GetVietnamTime()
                }
            };

            _context.ActivityLogs.AddRange(logs);
            await _context.SaveChangesAsync();
        }
    }
}
