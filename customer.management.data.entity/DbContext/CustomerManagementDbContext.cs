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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Customer entity
            modelBuilder.Entity<CustomerModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("newid()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("getutcdate()");
                
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
                entity.Property(e => e.Id).HasDefaultValueSql("newid()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("getutcdate()");
                
                // Configure unique constraints
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure Sales entity
            modelBuilder.Entity<SalesModelEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("newid()");
                entity.Property(e => e.SaleDate).HasDefaultValueSql("getutcdate()");
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
                entity.Property(e => e.Id).HasDefaultValueSql("newid()");
                entity.Property(e => e.VisitDate).HasDefaultValueSql("getutcdate()");
                
                // Configure relationship with Customer
                entity.HasOne(e => e.Customer)
                      .WithMany(c => c.Traffic)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
