using Microsoft.AspNetCore.Mvc;
using customer.management.api.Services;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly DataSeedingService _seedingService;

        public SeedController(DataSeedingService seedingService)
        {
            _seedingService = seedingService;
        }

        // GET: api/seed/test
        [HttpGet("test")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                var canConnect = await _seedingService.TestConnectionAsync();
                return Ok(new { 
                    message = "Database connection test", 
                    canConnect = canConnect,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    message = "Database connection failed", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // POST: api/seed
        [HttpPost]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                await _seedingService.SeedDataAsync();
                return Ok(new { message = "Data seeded successfully!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    message = "Error seeding data", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
