using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for creating a new Expense
    /// Creates both Expense record and corresponding CashFlow entry
    /// </summary>
    public class CreateExpenseDto
    {
        [Required]
        [MaxLength(255)]
        public string Description { get; set; } = null!;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Optional: Expense date. Defaults to current time if not provided
        /// </summary>
        public DateTimeOffset? ExpenseDate { get; set; }
    }
}

