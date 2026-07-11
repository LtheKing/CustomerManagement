namespace customer.management.api.Models
{
    /// <summary>
    /// One product line inside a grouped sales transaction.
    /// </summary>
    public class SalesTransactionItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Amount { get; set; }
    }

    /// <summary>
    /// Sales report row grouped by checkout (TransactionId).
    /// </summary>
    public class SalesTransactionGroupDto
    {
        public Guid TransactionId { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string? CashierName { get; set; }
        public DateTime SaleDate { get; set; }
        public int ItemCount { get; set; }
        public int TotalQuantity { get; set; }
        public decimal TotalAmount { get; set; }
        public List<SalesTransactionItemDto> Items { get; set; } = new();
    }
}
