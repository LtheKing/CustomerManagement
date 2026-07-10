using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Table name is CashFlow (PascalCase) in the database
    [Table("CashFlow")]
    public class CashFlowModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        // Flow types: SALES, EXPENSE, ADJUSTMENT_IN, ADJUSTMENT_OUT
        // SALES: positive (adds to capital) - ReferenceId points to Sales table
        // EXPENSE: negative (subtracts from capital) - ReferenceId points to Expenses table
        // ADJUSTMENT_IN: positive (adds to capital) - ReferenceId may be null
        // ADJUSTMENT_OUT: negative (subtracts from capital) - ReferenceId may be null
        [Required]
        [MaxLength(20)]
        public string FlowType { get; set; } = null!;

        // Polymorphic reference: can point to Sales or Expenses table depending on FlowType
        // Nullable because ADJUSTMENT_IN/OUT may not reference a specific entity
        public Guid? ReferenceId { get; set; }

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTimeOffset FlowDate { get; set; }

        // Optional info/description field
        public string? Info { get; set; }
    }
}



