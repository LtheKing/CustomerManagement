using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly CustomerManagementDbContext _context;

        public ExpenseService(CustomerManagementDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get paginated expenses with optional filters
        /// </summary>
        public async Task<PagedResult<ExpenseDto>> GetExpensesPagedAsync(GetExpensePagedRequest request)
        {
            // Validate pagination parameters
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 20;
            if (request.PageSize > 100) request.PageSize = 100; // Max page size limit

            // Build query
            var query = _context.Expenses.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                var descriptionLower = request.Description.ToLower();
                query = query.Where(e => e.Description.ToLower().Contains(descriptionLower));
            }

            if (request.MinAmount.HasValue)
            {
                query = query.Where(e => e.Amount >= request.MinAmount.Value);
            }

            if (request.MaxAmount.HasValue)
            {
                query = query.Where(e => e.Amount <= request.MaxAmount.Value);
            }

            if (request.StartDate.HasValue)
            {
                var startDateOffset = new DateTimeOffset(request.StartDate.Value, TimeSpan.Zero);
                query = query.Where(e => e.ExpenseDate >= startDateOffset);
            }

            if (request.EndDate.HasValue)
            {
                // Include the entire end date (up to end of day)
                var endDateTime = request.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                var endDateOffset = new DateTimeOffset(endDateTime, TimeSpan.Zero);
                query = query.Where(e => e.ExpenseDate <= endDateOffset);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply ordering and pagination
            var expenses = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Map to DTOs
            var data = expenses.Select(e => MapToDto(e)).ToList();

            return new PagedResult<ExpenseDto>
            {
                Data = data,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        /// <summary>
        /// Create a new expense record
        /// Also creates a corresponding CashFlow entry with FlowType "EXPENSE"
        /// All operations are wrapped in a database transaction for atomicity
        /// Uses execution strategy to support retry on failure
        /// </summary>
        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto)
        {
            // Use execution strategy to support retry on failure with transactions
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                // Use database transaction to ensure atomicity
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create new Expense entity
                    var expense = new ExpenseModelEntity
                    {
                        Id = Guid.NewGuid(),
                        Description = createDto.Description.Trim(),
                        Amount = createDto.Amount,
                        ExpenseDate = createDto.ExpenseDate ?? DateTimeOffset.UtcNow
                    };

                    // Add to context
                    _context.Expenses.Add(expense);

                    // Save to get the expense ID (within transaction)
                    await _context.SaveChangesAsync();

                    // Create corresponding CashFlow entry directly in the same context
                    // FlowType "EXPENSE" subtracts from capital (handled in balance calculation)
                    var cashFlow = new CashFlowModelEntity
                    {
                        Id = Guid.NewGuid(),
                        FlowType = "EXPENSE",
                        ReferenceId = expense.Id, // Reference to the expense record
                        Amount = expense.Amount, // Store as positive, balance calculation will subtract it
                        FlowDate = expense.ExpenseDate,
                        Info = $"Expense: {expense.Description}"
                    };

                    _context.CashFlows.Add(cashFlow);
                    await _context.SaveChangesAsync();

                    // Commit transaction - all operations succeed
                    await transaction.CommitAsync();

                    // Return as DTO
                    return MapToDto(expense);
                }
                catch
                {
                    // Rollback transaction on any error
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        /// <summary>
        /// Map entity to DTO
        /// </summary>
        private ExpenseDto MapToDto(ExpenseModelEntity expense)
        {
            return new ExpenseDto
            {
                Id = expense.Id,
                Description = expense.Description,
                Amount = expense.Amount,
                ExpenseDate = expense.ExpenseDate
            };
        }
    }
}

