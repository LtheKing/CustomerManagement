using customer.management.data.entity.Models;
using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface ICashFlowService
    {
        Task<decimal> CalculateBalanceAsync();
        Task<CashFlowModelEntity?> GetLatestCashFlowAsync();
        Task<IEnumerable<CapitalCashBalanceDto>> GetCapitalCashBalanceAsync();
        Task<CapitalCashBalanceDto> GetCapitalCashBalanceByIdAsync(Guid id);
        Task<CapitalCashBalanceDto> GetLatestCapitalCashBalanceAsync();
        Task<CashFlowDto> CreateCashFlowAsync(CreateCashFlowDto createDto);
    }
}

