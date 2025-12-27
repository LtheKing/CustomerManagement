namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for Sales response
    /// </summary>
    public class SalesDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Amount { get; set; }
        public string? CashierName { get; set; }
        public DateTime SaleDate { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatedByUsername { get; set; }
    }
}

