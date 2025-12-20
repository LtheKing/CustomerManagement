using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE SalesAllocation (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("salesallocation")]
    public class SalesAllocationModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid SalesTransactionId { get; set; }

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal ToCapital { get; set; }

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal ToOwner { get; set; }

        [Required]
        public DateTimeOffset AllocationDate { get; set; }

        // Navigation properties
        [ForeignKey(nameof(SalesTransactionId))]
        public SalesModelEntity SalesTransaction { get; set; } = null!;
    }
}



