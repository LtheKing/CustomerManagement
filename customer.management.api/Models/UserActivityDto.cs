using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    public class UserActivityDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Action { get; set; } = null!;
        public string EntityType { get; set; } = null!;
        public Guid? EntityId { get; set; }
        public string? Details { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class GetUserActivityPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public Guid? UserId { get; set; }
        public string? Action { get; set; }
        public string? Username { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class AddStockDto
    {
        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Optional actor; prefers authenticated user when available.
        /// </summary>
        public Guid? PerformedByUserId { get; set; }
    }

    public class AddStockResultDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public int PreviousStock { get; set; }
        public int AddedQuantity { get; set; }
        public int NewStock { get; set; }
    }
}
