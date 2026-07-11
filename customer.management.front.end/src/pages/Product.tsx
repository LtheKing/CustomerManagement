import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { GenericForm, FormField } from "../components/GenericForm";
import { ProductImageUpload } from "../components/ProductImageUpload";
import { apiService } from "../services/api";
import { Product } from "../types";
import { getProductImageUrl } from "../utils/helpers";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";
import "../assets/page-styles/Product.css";

const PRODUCT_FORM_FIELDS: FormField[] = [
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

export const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  
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

  const resetImageState = useCallback((product?: Product | null) => {
    setImagePreviewUrl((currentPreview) => {
      if (currentPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return product?.imageUrl ? getProductImageUrl(product.imageUrl) : null;
    });
    setPendingImageFile(null);
    setImageRemoved(false);
  }, []);

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    resetImageState(editingProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen, editingProduct?.id]);

  const handleImageSelect = useCallback((file: File, previewUrl: string) => {
    setImagePreviewUrl((currentPreview) => {
      if (currentPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return previewUrl;
    });
    setPendingImageFile(file);
    setImageRemoved(false);
  }, []);

  const handleImageClear = useCallback(() => {
    setImagePreviewUrl((currentPreview) => {
      if (currentPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
    setPendingImageFile(null);
    setImageRemoved(true);
  }, []);

  const resolveImageUrlForSubmit = async (): Promise<string | null | undefined> => {
    if (pendingImageFile) {
      return apiService.uploadProductImage(pendingImageFile);
    }

    if (imageRemoved) {
      return null;
    }

    return undefined;
  };

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

  const productFormInitialValues = useMemo(
    () =>
      editingProduct
        ? {
            name: editingProduct.name,
            sku: editingProduct.sku,
            price: editingProduct.price,
            stock: editingProduct.stock,
            isActive: editingProduct.isActive ? "true" : "false",
          }
        : {
            stock: 0,
            isActive: "true",
          },
    [editingProduct]
  );

  const productFormSidebar = useMemo(
    () => (
      <ProductImageUpload
        previewUrl={imagePreviewUrl}
        onFileSelect={handleImageSelect}
        onClear={handleImageClear}
      />
    ),
    [imagePreviewUrl, handleImageSelect, handleImageClear]
  );

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

    const imageUrl = await resolveImageUrlForSubmit();

    if (editingProduct) {
      // Update existing product
      await apiService.updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        price,
        stock,
        isActive,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      });
    } else {
      // Create new product
      await apiService.createProduct({
        name: name.trim(),
        sku: sku.trim(),
        price,
        stock,
        isActive,
        imageUrl: imageUrl ?? null,
      });
    }
  };

  const handleProductSuccess = () => {
    setEditingProduct(null);
    resetImageState();
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

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    resetImageState();
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
            <div className="product-info-bar">
              <div className="product-info-content">
                <span className="product-info-icon">📊</span>
                <span>Showing <strong className="product-info-strong">{filteredProducts.length}</strong> of <strong className="product-info-strong">{products.length}</strong> products</span>
              </div>
              {filteredProducts.length !== products.length && (
                <div className="product-filter-indicator">
                  <span>🔍</span>
                  <span>Filters applied</span>
                </div>
              )}
            </div>
            <div className="product-table-container">
              <table className="sales-report-table product-table">
                <thead>
                  <tr>
                    <th className="product-col-image">Image</th>
                    <th className="product-col-name">Name</th>
                    <th className="product-col-sku">SKU</th>
                    <th className="text-right product-col-price">Price</th>
                    <th className="text-right product-col-stock">Stock</th>
                    <th className="product-col-status">Status</th>
                    <th className="product-col-created">Created At</th>
                    <th className="product-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="product-empty-state">
                        <div className="product-empty-state-content">
                          <span className="product-empty-state-icon">📦</span>
                          <span>No products found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="product-table-row">
                        <td className="product-cell-image">
                          {product.imageUrl ? (
                            <img
                              src={getProductImageUrl(product.imageUrl) || undefined}
                              alt={product.name}
                              className="product-table-thumbnail"
                            />
                          ) : (
                            <span className="product-table-thumbnail-placeholder">📦</span>
                          )}
                        </td>
                        <td className="product-cell-name">{product.name}</td>
                        <td className="product-cell-sku">{product.sku}</td>
                        <td className="text-right product-cell-price">
                          IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className={`text-right product-cell-stock ${
                          product.stock === 0 
                            ? 'product-cell-stock-low' 
                            : product.stock < 10 
                            ? 'product-cell-stock-medium' 
                            : 'product-cell-stock-high'
                        }`}>
                          {product.stock.toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span className={`product-status-badge ${
                            product.isActive 
                              ? 'product-status-badge-active' 
                              : 'product-status-badge-inactive'
                          }`}>
                            {product.isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </td>
                        <td className="product-cell-created">{formatDate(product.createdAt)}</td>
                        <td>
                          <div className="product-actions-container">
                            <button
                              onClick={() => handleEdit(product)}
                              className="product-btn product-btn-edit"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="product-btn product-btn-delete"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <GenericForm
        title={editingProduct ? "Edit Product" : "Create New Product"}
        fields={PRODUCT_FORM_FIELDS}
        twoColumn={true}
        sidebar={productFormSidebar}
        mode={editingProduct ? "edit" : "create"}
        initialValues={productFormInitialValues}
        onSubmit={handleProductSubmit}
        onSuccess={handleProductSuccess}
        onClose={handleCloseForm}
        isOpen={isFormOpen}
        submitLabel={editingProduct ? "Update Product" : "Create Product"}
      />
    </div>
  );
};

