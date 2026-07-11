using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class UserActivityService : IUserActivityService
    {
        private readonly CustomerManagementDbContext _context;

        public UserActivityService(CustomerManagementDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(Guid userId, string action, string entityType, Guid? entityId, string? details)
        {
            if (userId == Guid.Empty)
            {
                return;
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return;
            }

            _context.UserActivities.Add(new UserActivityModelEntity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action.Trim().ToUpperInvariant(),
                EntityType = entityType.Trim(),
                EntityId = entityId,
                Details = string.IsNullOrWhiteSpace(details) ? null : details.Trim(),
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        public async Task<PagedResult<UserActivityDto>> GetActivitiesPagedAsync(GetUserActivityPagedRequest request)
        {
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 20;
            if (request.PageSize > 100) request.PageSize = 100;

            var query = _context.UserActivities
                .AsNoTracking()
                .Include(a => a.User)
                .AsQueryable();

            if (request.UserId.HasValue)
            {
                query = query.Where(a => a.UserId == request.UserId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.Action))
            {
                var action = request.Action.Trim().ToUpperInvariant();
                query = query.Where(a => a.Action == action);
            }

            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                var username = request.Username.Trim().ToLower();
                query = query.Where(a => a.User != null && a.User.Username.ToLower().Contains(username));
            }

            if (request.StartDate.HasValue)
            {
                var start = new DateTimeOffset(request.StartDate.Value.Date, TimeSpan.Zero);
                query = query.Where(a => a.CreatedAt >= start);
            }

            if (request.EndDate.HasValue)
            {
                var end = new DateTimeOffset(request.EndDate.Value.Date.AddDays(1).AddTicks(-1), TimeSpan.Zero);
                query = query.Where(a => a.CreatedAt <= end);
            }

            var totalCount = await query.CountAsync();

            var activities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new PagedResult<UserActivityDto>
            {
                Data = activities.Select(a => new UserActivityDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    Username = a.User?.Username ?? "Unknown",
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Details = a.Details,
                    CreatedAt = a.CreatedAt
                }).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}
