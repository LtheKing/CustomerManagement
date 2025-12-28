namespace customer.management.api.Models
{
    /// <summary>
    /// Request model for paginated expense query with optional filters
    /// </summary>
    public class GetExpensePagedRequest
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
        /// Optional: Filter by description (case-insensitive partial match)
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Optional: Filter by minimum amount
        /// </summary>
        public decimal? MinAmount { get; set; }

        /// <summary>
        /// Optional: Filter by maximum amount
        /// </summary>
        public decimal? MaxAmount { get; set; }

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

