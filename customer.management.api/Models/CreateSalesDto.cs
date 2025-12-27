using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for creating a new Sales transaction
    /// Hybrid approach: Either CustomerId OR CustomerName must be provided
    /// </summary>
    public class CreateSalesDto
    {
        /// <summary>
        /// Optional: If provided, customer must exist. If not provided, CustomerName must be provided.
        /// </summary>
        public Guid? CustomerId { get; set; }

        /// <summary>
        /// Optional: If provided and CustomerId is not provided, will find or create customer by name (case-insensitive).
        /// </summary>
        [MaxLength(100)]
        public string? CustomerName { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [MaxLength(255)]
        public string? CashierName { get; set; }

        public DateTime? SaleDate { get; set; } // Optional: defaults to current time if not provided

        [Required]
        public Guid CreatedBy { get; set; }
    }
}

