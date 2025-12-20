using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE CashFlow (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("cashflow")]
    public class CashFlowModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        // SALE, EXPENSE, OWNER_TAKE
        [Required]
        [MaxLength(20)]
        public string FlowType { get; set; } = null!;

        [Required]
        public Guid ReferenceId { get; set; }

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTimeOffset FlowDate { get; set; }
    }
}



