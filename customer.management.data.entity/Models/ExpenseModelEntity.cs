using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE Expenses (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("expenses")]
    public class ExpenseModelEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("description")]
        public string Description { get; set; } = null!;

        [Required]
        [Column("amount", TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("expensedate")]
        public DateTimeOffset ExpenseDate { get; set; }
    }
}



