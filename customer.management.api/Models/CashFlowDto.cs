namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for CashFlow response
    /// </summary>
    public class CashFlowDto
    {
        public Guid Id { get; set; }
        public string FlowType { get; set; } = null!;
        public Guid? ReferenceId { get; set; }
        public decimal Amount { get; set; }
        public DateTimeOffset FlowDate { get; set; }
        public string? Info { get; set; }
    }
}

