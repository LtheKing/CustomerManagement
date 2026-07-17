using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// One checkout with multiple line items — processed in a single DB transaction.
    /// </summary>
    public class CreateBatchSalesDto
    {
        public Guid? CustomerId { get; set; }

        [MaxLength(100)]
        public string? CustomerName { get; set; }

        /// <summary>
        /// Shared checkout ID for all line items. Generated server-side if omitted.
        /// </summary>
        public Guid? TransactionId { get; set; }

        [MaxLength(255)]
        public string? CashierName { get; set; }

        public DateTime? SaleDate { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one cart item is required")]
        public List<CreateBatchSalesItemDto> Items { get; set; } = new();
    }

    public class CreateBatchSalesItemDto
    {
        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
    }
}
