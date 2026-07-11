using Microsoft.AspNetCore.Mvc;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserActivityController : ControllerBase
    {
        private readonly IUserActivityService _userActivityService;

        public UserActivityController(IUserActivityService userActivityService)
        {
            _userActivityService = userActivityService;
        }

        // GET: api/useractivity
        [HttpGet]
        public async Task<ActionResult> GetActivities([FromQuery] GetUserActivityPagedRequest request)
        {
            try
            {
                var result = await _userActivityService.GetActivitiesPagedAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving user activities", details = ex.Message });
            }
        }
    }
}
