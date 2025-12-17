using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;

namespace customer.management.api.Services
{
    public class DataSeedingService
    {
        private readonly CustomerManagementDbContext _context;

        public DataSeedingService(CustomerManagementDbContext context)
        {
            _context = context;
        }

        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                await _context.Database.CanConnectAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task ForceReseedAsync()
        {
            try
            {
                Console.WriteLine("Force reseeding - clearing existing data...");
                
                // Clear all data
                _context.SalesTransactionItems.RemoveRange(_context.SalesTransactionItems);
                _context.CustomerTraffic.RemoveRange(_context.CustomerTraffic);
                _context.Sales.RemoveRange(_context.Sales);
                _context.Products.RemoveRange(_context.Products);
                _context.Customers.RemoveRange(_context.Customers);
                _context.Users.RemoveRange(_context.Users);
                await _context.SaveChangesAsync();
                
                Console.WriteLine("Existing data cleared, starting fresh seeding...");
                
                // Now seed fresh data
                await SeedDataAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error during force reseed: {ex.Message}", ex);
            }
        }

        public async Task SeedDataAsync()
        {
            try
            {
                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();
                
                // Check if data already exists
                if (await _context.Users.AnyAsync())
                {
                    Console.WriteLine("Data already exists, skipping seeding...");
                    return; // Data already seeded
                }
                
                Console.WriteLine("Starting data seeding...");
            }
            catch (Exception ex)
            {
                throw new Exception($"Database connection error: {ex.Message}", ex);
            }

            // Create users first
            var users = await CreateUsersAsync();
            await _context.SaveChangesAsync();

            // Create products first
            var products = await CreateProductsAsync();
            await _context.SaveChangesAsync();

            // Create customers
            var customers = await CreateCustomersAsync(users);
            await _context.SaveChangesAsync();

            // Create sales
            await CreateSalesAsync(customers, users, products);
            await _context.SaveChangesAsync();

            // Create customer traffic
            await CreateCustomerTrafficAsync(customers);
            await _context.SaveChangesAsync();
        }

        private Task<List<UserModelEntity>> CreateUsersAsync()
        {
            var users = new List<UserModelEntity>
            {
                new UserModelEntity
                {
                    Id = Guid.NewGuid(),
                    Username = "admin",
                    Email = "admin@customermanagement.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new UserModelEntity
                {
                    Id = Guid.NewGuid(),
                    Username = "sales_manager",
                    Email = "sales@customermanagement.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("sales123"),
                    Role = "SalesManager",
                    CreatedAt = DateTime.UtcNow.AddDays(-25)
                },
                new UserModelEntity
                {
                    Id = Guid.NewGuid(),
                    Username = "sales_rep1",
                    Email = "john.doe@customermanagement.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("rep123"),
                    Role = "SalesRep",
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new UserModelEntity
                {
                    Id = Guid.NewGuid(),
                    Username = "sales_rep2",
                    Email = "jane.smith@customermanagement.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("rep123"),
                    Role = "SalesRep",
                    CreatedAt = DateTime.UtcNow.AddDays(-18)
                }
            };

            _context.Users.AddRange(users);
            return Task.FromResult(users);
        }

        private Task<List<CustomerModelEntity>> CreateCustomersAsync(List<UserModelEntity> users)
        {
            var customers = new List<CustomerModelEntity>
            {
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "Acme Corporation",
                    Email = "contact@acme.com",
                    Phone = "+1-555-0101",
                    Address = "123 Business Ave, New York, NY 10001",
                    Company = "Acme Corporation",
                    CreatedBy = users[0].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "TechStart Inc",
                    Email = "info@techstart.com",
                    Phone = "+1-555-0102",
                    Address = "456 Innovation St, San Francisco, CA 94105",
                    Company = "TechStart Inc",
                    CreatedBy = users[1].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-12),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "Global Solutions Ltd",
                    Email = "sales@globalsolutions.com",
                    Phone = "+1-555-0103",
                    Address = "789 Enterprise Blvd, Chicago, IL 60601",
                    Company = "Global Solutions Ltd",
                    CreatedBy = users[2].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "Future Dynamics",
                    Email = "contact@futuredynamics.com",
                    Phone = "+1-555-0104",
                    Address = "321 Future Way, Austin, TX 73301",
                    Company = "Future Dynamics",
                    CreatedBy = users[3].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-8)
                },
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "Innovation Hub",
                    Email = "hello@innovationhub.com",
                    Phone = "+1-555-0105",
                    Address = "654 Creative Lane, Seattle, WA 98101",
                    Company = "Innovation Hub",
                    CreatedBy = users[0].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-6),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new CustomerModelEntity
                {
                    Id = Guid.NewGuid(),
                    Name = "Digital Ventures",
                    Email = "info@digitalventures.com",
                    Phone = "+1-555-0106",
                    Address = "987 Digital Drive, Boston, MA 02101",
                    Company = "Digital Ventures",
                    CreatedBy = users[1].Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-4)
                }
            };

            _context.Customers.AddRange(customers);
            return Task.FromResult(customers);
        }

        private Task<List<ProductsModelEntity>> CreateProductsAsync()
        {
            var products = new List<ProductsModelEntity>
            {
                new ProductsModelEntity
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    Name = "Software License - Basic",
                    SKU = "SW-LIC-BASIC",
                    Price = 299.99m,
                    Stock = 100,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-60)
                },
                new ProductsModelEntity
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Name = "Software License - Professional",
                    SKU = "SW-LIC-PRO",
                    Price = 599.99m,
                    Stock = 75,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-60)
                },
                new ProductsModelEntity
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Name = "Cloud Service - Starter",
                    SKU = "CLOUD-STARTER",
                    Price = 49.99m,
                    Stock = 200,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-55)
                },
                new ProductsModelEntity
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Name = "Cloud Service - Enterprise",
                    SKU = "CLOUD-ENTERPRISE",
                    Price = 199.99m,
                    Stock = 50,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-55)
                },
                new ProductsModelEntity
                {
                    Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    Name = "Consulting Services",
                    SKU = "CONSULT-HOURLY",
                    Price = 150.00m,
                    Stock = 1000,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-50)
                },
                new ProductsModelEntity
                {
                    Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                    Name = "Support Package - Basic",
                    SKU = "SUPPORT-BASIC",
                    Price = 99.99m,
                    Stock = 500,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-45)
                }
            };

            _context.Products.AddRange(products);
            return Task.FromResult(products);
        }

        private Task CreateSalesAsync(List<CustomerModelEntity> customers, List<UserModelEntity> users, List<ProductsModelEntity> products)
        {
            var random = new Random();

            var sales = new List<SalesModelEntity>();

            foreach (var customer in customers)
            {
                // Create 2-5 sales per customer
                var salesCount = random.Next(2, 6);
                for (int i = 0; i < salesCount; i++)
                {
                    var product = products[random.Next(products.Count)];
                    var quantity = random.Next(1, 10);
                    var amount = quantity * product.Price;

                    sales.Add(new SalesModelEntity
                    {
                        Id = Guid.NewGuid(),
                        CustomerId = customer.Id,
                        ProductId = product.Id,
                        Quantity = quantity,
                        Amount = amount,
                        SaleDate = DateTime.UtcNow.AddDays(-random.Next(1, 20)),
                        CreatedBy = users[random.Next(users.Count)].Id
                    });
                }
            }

            _context.Sales.AddRange(sales);
            return Task.CompletedTask;
        }

        private Task CreateCustomerTrafficAsync(List<CustomerModelEntity> customers)
        {
            var sources = new[] { "Google", "Facebook", "LinkedIn", "Direct", "Email Campaign", "Referral", "Banner Ad" };
            var campaigns = new[] { "Summer Sale", "New Product Launch", "Holiday Special", "Webinar Series", "Free Trial", "Demo Request" };
            var pages = new[] { "/home", "/products", "/pricing", "/contact", "/about", "/demo", "/blog", "/support" };
            var random = new Random();

            var traffic = new List<CustomerTrafficModelEntity>();

            foreach (var customer in customers)
            {
                // Create 3-8 traffic entries per customer
                var trafficCount = random.Next(3, 9);
                for (int i = 0; i < trafficCount; i++)
                {
                    traffic.Add(new CustomerTrafficModelEntity
                    {
                        Id = Guid.NewGuid(),
                        CustomerId = customer.Id,
                        Source = sources[random.Next(sources.Length)],
                        Campaign = campaigns[random.Next(campaigns.Length)],
                        VisitDate = DateTime.UtcNow.AddDays(-random.Next(1, 30)),
                        Page = pages[random.Next(pages.Length)]
                    });
                }
            }

            _context.CustomerTraffic.AddRange(traffic);
            return Task.CompletedTask;
        }
    }
}
