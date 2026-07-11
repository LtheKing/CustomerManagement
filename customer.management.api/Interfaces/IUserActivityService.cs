using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IUserActivityService
    {
        Task LogAsync(Guid userId, string action, string entityType, Guid? entityId, string? details);
        Task<PagedResult<UserActivityDto>> GetActivitiesPagedAsync(GetUserActivityPagedRequest request);
    }
}
