using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface ISalesService
    {
        Task<IEnumerable<SalesDto>> GetAllSalesAsync();
        Task<SalesDto?> GetSalesByIdAsync(Guid id);
        Task<IEnumerable<SalesDto>> GetSalesByCustomerIdAsync(Guid customerId);
        Task<IEnumerable<SalesDto>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<SalesDto> CreateSalesAsync(CreateSalesDto createDto);
    }
}

