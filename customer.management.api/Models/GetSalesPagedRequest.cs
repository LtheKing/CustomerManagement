namespace customer.management.api.Models
{
    /// <summary>
    /// Request model for paginated sales query with optional filters
    /// </summary>
    public class GetSalesPagedRequest
    {
        /// <summary>
        /// Page number (1-based). Default: 1
        /// </summary>
        public int Page { get; set; } = 1;

        /// <summary>
        /// Number of items per page. Default: 20, Max: 100
        /// </summary>
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// Optional: Filter by customer ID
        /// </summary>
        public Guid? CustomerId { get; set; }

        /// <summary>
        /// Optional: Filter by product ID
        /// </summary>
        public Guid? ProductId { get; set; }

        /// <summary>
        /// Optional: Filter by cashier name
        /// </summary>
        public string? CashierName { get; set; }

        /// <summary>
        /// Optional: Filter by start date (inclusive)
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Optional: Filter by end date (inclusive, includes entire day)
        /// </summary>
        public DateTime? EndDate { get; set; }
    }
}

