namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for Capital Cash Balance response
    /// </summary>
    public class CapitalCashBalanceDto
    {
        public Guid Id { get; set; }
        public decimal Balance { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
}

