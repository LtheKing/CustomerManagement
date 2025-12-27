using Microsoft.AspNetCore.Mvc;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        // GET: api/product
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] bool activeOnly = false)
        {
            try
            {
                IEnumerable<ProductDto> result;
                
                if (activeOnly)
                {
                    result = await _productService.GetActiveProductsAsync();
                }
                else
                {
                    result = await _productService.GetAllProductsAsync();
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving products", details = ex.Message });
            }
        }

        // GET: api/product/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
        {
            try
            {
                var result = await _productService.GetProductByIdAsync(id);
                
                if (result == null)
                {
                    return NotFound(new { error = $"Product with ID {id} not found" });
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving the product", details = ex.Message });
            }
        }
    }
}

