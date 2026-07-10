namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for Expense response
    /// </summary>
    public class ExpenseDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTimeOffset ExpenseDate { get; set; }
    }
}

