using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IExpenseService
    {
        Task<PagedResult<ExpenseDto>> GetExpensesPagedAsync(GetExpensePagedRequest request);
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, Guid? performedByUserId);
        Task<ExpenseDto> UpdateExpenseAsync(Guid id, CreateExpenseDto updateDto, Guid? performedByUserId);
        Task<bool> DeleteExpenseAsync(Guid id, Guid? performedByUserId);
    }
}
