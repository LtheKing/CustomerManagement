using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.Models;

namespace customer.management.data.entity.DbContext
{
    public class CustomerManagementDbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public CustomerManagementDbContext(DbContextOptions<CustomerManagementDbContext> options) : base(options)
        {
        }

        public DbSet<CustomerModelEntity> Customers { get; set; }
        public DbSet<UserModelEntity> Users { get; set; }
        public DbSet<SalesModelEntity> Sales { get; set; }
        public DbSet<CustomerTrafficModelEntity> CustomerTraffic { get; set; }
        public DbSet<ProductsModelEntity> Products { get; set; }
        public DbSet<SalesTransactionItemModelEntity> SalesTransactionItems { get; set; }
        public DbSet<CapitalCashModelEntity> CapitalCash { get; set; }
        public DbSet<ExpenseModelEntity> Expenses { get; set; }
        public DbSet<SalesAllocationModelEntity> SalesAllocations { get; set; }
        public DbSet<CashFlowModelEntity> CashFlows { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Customer entity
            modelBuilder.Entity<CustomerModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure User entity
            modelBuilder.Entity<UserModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                // Configure unique constraints
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure Products entity
            modelBuilder.Entity<ProductsModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                // Configure unique constraint for SKU
                entity.HasIndex(e => e.SKU).IsUnique();
            });

            // Configure Sales entity
            modelBuilder.Entity<SalesModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.SaleDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                
                // Configure relationship with Customer
                entity.HasOne(e => e.Customer)
                      .WithMany(c => c.Sales)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure CustomerTraffic entity
            modelBuilder.Entity<CustomerTrafficModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.VisitDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                // Configure relationship with Customer
                entity.HasOne(e => e.Customer)
                      .WithMany(c => c.Traffic)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure SalesTransactionItems entity
            modelBuilder.Entity<SalesTransactionItemModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
                
                // Configure relationship with SalesTransaction
                entity.HasOne(e => e.Transaction)
                      .WithMany(t => t.Items)
                      .HasForeignKey(e => e.TransactionId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // Configure relationship with Product
                entity.HasOne(e => e.Product)
                      .WithMany(p => p.TransactionItems)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure CapitalCash entity (table created as unquoted CapitalCash => lowercase in PG)
            modelBuilder.Entity<CapitalCashModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Balance).HasColumnType("numeric(18,2)");
                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure Expenses entity (table created as unquoted Expenses => lowercase in PG)
            modelBuilder.Entity<ExpenseModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Amount).HasColumnType("numeric(18,2)");
                entity.Property(e => e.ExpenseDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure SalesAllocation entity (table created as unquoted SalesAllocation => lowercase in PG)
            modelBuilder.Entity<SalesAllocationModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.ToCapital).HasColumnType("numeric(18,2)");
                entity.Property(e => e.ToOwner).HasColumnType("numeric(18,2)");
                entity.Property(e => e.AllocationDate).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Relationship to Sales (your SQL didn't add FK, but EF can still model it)
                entity.HasOne(e => e.SalesTransaction)
                      .WithMany()
                      .HasForeignKey(e => e.SalesTransactionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CashFlow entity (table name is CashFlow in PascalCase)
            modelBuilder.Entity<CashFlowModelEntity>(entity =>
            {
                entity.ToTable("CashFlow"); // Table name is PascalCase in the database
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Amount).HasColumnType("numeric(18,2)");
                entity.Property(e => e.FlowDate).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Optional: enforce max length at DB level if migrations are used
                entity.Property(e => e.FlowType).HasMaxLength(20);
            });
        }
    }
}
