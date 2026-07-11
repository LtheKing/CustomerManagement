import { useEffect, useMemo, useState } from "react";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { Product } from "../types";
import { getCurrentUser } from "../utils/auth";
import { formatCurrency } from "../utils/helpers";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";
import "../assets/page-styles/Product.css";

export const AddStockPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await apiService.getProducts(false);
      setProducts(result.filter((product) => product.isActive));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.name} (SKU: ${product.sku}) — Stock: ${product.stock}`,
      })),
    [products]
  );

  const fields: FormField[] = useMemo(
    () => [
      {
        name: "productId",
        label: "Product",
        type: "select",
        required: true,
        options: productOptions,
        placeholder: "Select a product",
      },
      {
        name: "quantity",
        label: "Quantity to add",
        type: "number",
        required: true,
        min: 1,
        step: 1,
        placeholder: "1",
      },
      {
        name: "note",
        label: "Note (optional)",
        type: "text",
        required: false,
        placeholder: "e.g. Supplier delivery",
      },
    ],
    [productOptions]
  );

  const handleSubmit = async (data: Partial<{ productId: string; quantity: number; note: string }>) => {
    const quantity = Number(data.quantity);
    if (!data.productId) {
      throw new Error("Please select a product.");
    }
    if (!quantity || quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    const currentUser = getCurrentUser();
    const result = await apiService.addStock({
      productId: String(data.productId),
      quantity,
      note: data.note ? String(data.note) : undefined,
      performedByUserId: currentUser?.id,
    });

    setLastResult(
      `Added ${result.addedQuantity} to ${result.productName}. Stock ${result.previousStock} → ${result.newStock}.`
    );
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    fetchProducts();
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Add Stock</h1>
        <p>Increase inventory for an existing product. Quantity is managed here; adjust later sales from the cart.</p>
      </div>

      <div className="sales-report-container">
        <div className="expense-actions-row">
          <button className="new-expense-btn" onClick={() => setIsFormOpen(true)} disabled={loading || products.length === 0}>
            + Add Stock
          </button>
          <button className="refresh-btn" onClick={fetchProducts} disabled={loading} title="Refresh products">
            🔄 Refresh
          </button>
        </div>

        {lastResult && (
          <div className="product-info-bar" style={{ marginBottom: "1rem" }}>
            <div className="product-info-content">
              <span className="product-info-icon">✅</span>
              <span>{lastResult}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="product-table-container">
            <table className="sales-report-table product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="product-empty-state">
                      <div className="product-empty-state-content">
                        <span className="product-empty-state-icon">📦</span>
                        <span>No active products available</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="product-table-row">
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <strong>{product.stock}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GenericForm<{ productId: string; quantity: number; note: string }>
        title="Add Stock"
        fields={fields}
        mode="create"
        initialValues={{ productId: "", quantity: 1, note: "" }}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
        submitLabel="Add Stock"
      />
    </div>
  );
};
