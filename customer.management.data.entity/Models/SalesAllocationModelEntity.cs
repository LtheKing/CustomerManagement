using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE SalesAllocation (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("salesallocation")]
    public class SalesAllocationModelEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("salestransactionid")]
        public Guid SalesTransactionId { get; set; }

        [Required]
        [Column("tocapital", TypeName = "numeric(18,2)")]
        public decimal ToCapital { get; set; }

        [Required]
        [Column("toowner", TypeName = "numeric(18,2)")]
        public decimal ToOwner { get; set; }

        [Required]
        [Column("allocationdate")]
        public DateTimeOffset AllocationDate { get; set; }

        // Navigation properties
        [ForeignKey(nameof(SalesTransactionId))]
        public SalesModelEntity SalesTransaction { get; set; } = null!;
    }
}



