using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE CashFlow (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("cashflow")]
    public class CashFlowModelEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        // SALE, EXPENSE, OWNER_TAKE
        [Required]
        [MaxLength(20)]
        [Column("flowtype")]
        public string FlowType { get; set; } = null!;

        [Required]
        [Column("referenceid")]
        public Guid ReferenceId { get; set; }

        [Required]
        [Column("amount", TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("flowdate")]
        public DateTimeOffset FlowDate { get; set; }
    }
}



