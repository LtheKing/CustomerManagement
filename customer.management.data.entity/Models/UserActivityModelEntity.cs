using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("UserActivities")]
    public class UserActivityModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string EntityType { get; set; } = null!;

        public Guid? EntityId { get; set; }

        [MaxLength(1000)]
        public string? Details { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        [ForeignKey(nameof(UserId))]
        public UserModelEntity? User { get; set; }
    }
}
