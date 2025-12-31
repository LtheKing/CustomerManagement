import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { Product } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";

export const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState<string>("");
  const [skuFilter, setSkuFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minStock, setMinStock] = useState<string>("");
  const [maxStock, setMaxStock] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await apiService.getProducts(activeOnly);
      setProducts(result);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const handleFilter = () => {
    fetchProducts();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setSkuFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinStock("");
    setMaxStock("");
    setActiveOnly(false);
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleExportToExcel = () => {
    if (filteredProducts.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const exportData = filteredProducts.map(product => ({
        "Name": product.name,
        "SKU": product.sku,
        "Price": product.price,
        "Stock": product.stock,
        "Active": product.isActive ? "Yes" : "No",
        "Created At": formatDate(product.createdAt),
        "Updated At": product.updatedAt ? formatDate(product.updatedAt) : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Product Report");

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Product_Report_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const filteredProducts = products.filter(product => {
    if (nameFilter && !product.name.toLowerCase().includes(nameFilter.toLowerCase())) {
      return false;
    }
    if (skuFilter && !product.sku.toLowerCase().includes(skuFilter.toLowerCase())) {
      return false;
    }
    if (minPrice && product.price < Number(minPrice)) {
      return false;
    }
    if (maxPrice && product.price > Number(maxPrice)) {
      return false;
    }
    if (minStock && product.stock < Number(minStock)) {
      return false;
    }
    if (maxStock && product.stock > Number(maxStock)) {
      return false;
    }
    return true;
  });

  const getProductFormFields = (): FormField[] => {
    return [
      {
        name: "name",
        label: "Product Name",
        type: "text",
        required: true,
        placeholder: "Enter product name",
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        required: true,
        placeholder: "Enter SKU",
      },
      {
        name: "price",
        label: "Price",
        type: "number",
        required: true,
        placeholder: "0.00",
        min: 0.01,
        step: 0.01,
      },
      {
        name: "stock",
        label: "Stock",
        type: "number",
        required: true,
        placeholder: "0",
        min: 0,
        step: 1,
      },
      {
        name: "isActive",
        label: "Active",
        type: "select",
        required: false,
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      },
    ];
  };

  const handleProductSubmit = async (formData: Record<string, any>): Promise<void> => {
    const name = formData.name as string;
    const sku = formData.sku as string;
    const price = Number(formData.price);
    const stock = Number(formData.stock);
    const isActive = formData.isActive === "true" || formData.isActive === true;

    if (!name || !name.trim()) {
      throw new Error("Product name is required");
    }

    if (!sku || !sku.trim()) {
      throw new Error("SKU is required");
    }

    if (!price || price <= 0) {
      throw new Error("Price must be greater than 0");
    }

    if (stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    if (editingProduct) {
      // Update existing product
      await apiService.updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        price,
        stock,
        isActive,
      });
    } else {
      // Create new product
      await apiService.createProduct({
        name: name.trim(),
        sku: sku.trim(),
        price,
        stock,
        isActive,
      });
    }
  };

  const handleProductSuccess = () => {
    setEditingProduct(null);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteProduct(product.id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error instanceof Error ? error.message : "Failed to delete product. Please try again.");
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Product Management</h1>
        <p>View and manage all products.</p>
      </div>
      
      <div className="sales-report-container">
        <div className="expense-actions-row">
          <button 
            className="new-expense-btn" 
            onClick={handleCreate}
          >
            new product
          </button>
        </div>
        <div className="sales-report-filters">
          <div className="filter-group">
            <label htmlFor="nameFilter">Name</label>
            <input
              type="text"
              id="nameFilter"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search name..."
            />
          </div>
          <div className="filter-group">
            <label htmlFor="skuFilter">SKU</label>
            <input
              type="text"
              id="skuFilter"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              placeholder="Search SKU..."
            />
          </div>
          <div className="filter-group">
            <label htmlFor="minPrice">Min Price</label>
            <input
              type="number"
              id="minPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxPrice">Max Price</label>
            <input
              type="number"
              id="maxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="minStock">Min Stock</label>
            <input
              type="number"
              id="minStock"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxStock">Max Stock</label>
            <input
              type="number"
              id="maxStock"
              value={maxStock}
              onChange={(e) => setMaxStock(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="activeOnly">
              <input
                type="checkbox"
                id="activeOnly"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Active Only
            </label>
          </div>
          <button onClick={handleFilter} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button onClick={handleRefresh} disabled={loading} className="refresh-btn" title="Refresh data">
            🔄 Refresh
          </button>
          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
          <button 
            onClick={handleExportToExcel} 
            disabled={filteredProducts.length === 0}
            className="export-excel-btn"
          >
            📊 Export to Excel
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
            <table className="sales-report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td className="text-right">IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                      <td className="text-right">{product.stock.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          color: product.isActive ? '#10b981' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(product)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      <GenericForm
        title={editingProduct ? "Edit Product" : "Create New Product"}
        fields={getProductFormFields()}
        mode={editingProduct ? "edit" : "create"}
        initialValues={editingProduct ? {
          name: editingProduct.name,
          sku: editingProduct.sku,
          price: editingProduct.price,
          stock: editingProduct.stock,
          isActive: editingProduct.isActive ? "true" : "false",
        } : {
          stock: 0,
          isActive: "true",
        }}
        onSubmit={handleProductSubmit}
        onSuccess={handleProductSuccess}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        isOpen={isFormOpen}
        submitLabel={editingProduct ? "Update Product" : "Create Product"}
      />
    </div>
  );
};

