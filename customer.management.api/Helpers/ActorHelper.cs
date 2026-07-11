using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace customer.management.api.Helpers
{
    public static class ActorHelper
    {
        public static Guid? GetPerformedByUserId(ControllerBase controller, Guid? fallbackUserId = null)
        {
            var claim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(claim, out var userId) && userId != Guid.Empty)
            {
                return userId;
            }

            if (fallbackUserId.HasValue && fallbackUserId.Value != Guid.Empty)
            {
                return fallbackUserId;
            }

            return null;
        }
    }
}
