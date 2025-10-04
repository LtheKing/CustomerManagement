using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly CustomerManagementDbContext _context;

        public CustomersController(CustomerManagementDbContext context)
        {
            _context = context;
        }

        // GET: api/customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerModelEntity>>> GetCustomers()
        {
            return await _context.Customers
                .Include(c => c.User)
                .Include(c => c.Sales)
                .Include(c => c.Traffic)
                .ToListAsync();
        }

        // GET: api/customers/traffic
        [HttpGet("traffic")]
        public async Task<ActionResult<IEnumerable<CustomerTrafficModelEntity>>> GetCustomerTraffic()
        {
            return await _context.CustomerTraffic
                .Include(ct => ct.Customer)
                .ToListAsync();
        }

        // GET: api/customers/traffic/5
        [HttpGet("traffic/{id}")]
        public async Task<ActionResult<CustomerTrafficModelEntity>> GetCustomerTraffic(Guid id)
        {
            var customerTraffic = await _context.CustomerTraffic
                .Include(ct => ct.Customer)
                .FirstOrDefaultAsync(ct => ct.Id == id);

            if (customerTraffic == null)
            {
                return NotFound();
            }

            return customerTraffic;
        }

        // GET: api/customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerModelEntity>> GetCustomer(Guid id)
        {
            var customer = await _context.Customers
                .Include(c => c.User)
                .Include(c => c.Sales)
                .Include(c => c.Traffic)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound();
            }

            return customer;
        }

        // POST: api/customers
        [HttpPost]
        public async Task<ActionResult<CustomerModelEntity>> PostCustomer(CustomerModelEntity customer)
        {
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCustomer", new { id = customer.Id }, customer);
        }

        // PUT: api/customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCustomer(Guid id, CustomerModelEntity customer)
        {
            if (id != customer.Id)
            {
                return BadRequest();
            }

            _context.Entry(customer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(Guid id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/customers/traffic
        [HttpPost("traffic")]
        public async Task<ActionResult<CustomerTrafficModelEntity>> PostCustomerTraffic(CustomerTrafficModelEntity customerTraffic)
        {
            _context.CustomerTraffic.Add(customerTraffic);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCustomerTraffic", new { id = customerTraffic.Id }, customerTraffic);
        }

        // PUT: api/customers/traffic/5
        [HttpPut("traffic/{id}")]
        public async Task<IActionResult> PutCustomerTraffic(Guid id, CustomerTrafficModelEntity customerTraffic)
        {
            if (id != customerTraffic.Id)
            {
                return BadRequest();
            }

            _context.Entry(customerTraffic).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerTrafficExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/customers/traffic/5
        [HttpDelete("traffic/{id}")]
        public async Task<IActionResult> DeleteCustomerTraffic(Guid id)
        {
            var customerTraffic = await _context.CustomerTraffic.FindAsync(id);
            if (customerTraffic == null)
            {
                return NotFound();
            }

            _context.CustomerTraffic.Remove(customerTraffic);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CustomerExists(Guid id)
        {
            return _context.Customers.Any(e => e.Id == id);
        }

        private bool CustomerTrafficExists(Guid id)
        {
            return _context.CustomerTraffic.Any(e => e.Id == id);
        }
    }
}
