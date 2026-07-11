using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for creating a new CashFlow entry
    /// </summary>
    public class CreateCashFlowDto
    {
        [Required]
        [MaxLength(20)]
        public string FlowType { get; set; } = null!; // SALES, EXPENSE, ADJUSTMENT_IN, ADJUSTMENT_OUT

        public Guid? ReferenceId { get; set; } // Optional: references Sales or Expenses table

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        public string? Info { get; set; } // Optional description/info

        public DateTimeOffset? FlowDate { get; set; } // Optional: defaults to current time if not provided
    }
}

