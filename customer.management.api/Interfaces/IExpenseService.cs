using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IExpenseService
    {
        Task<PagedResult<ExpenseDto>> GetExpensesPagedAsync(GetExpensePagedRequest request);
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto);
    }
}

