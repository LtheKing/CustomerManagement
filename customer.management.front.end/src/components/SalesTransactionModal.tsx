import { useEffect, useMemo, useState, FormEvent } from "react";
import { apiService } from "../services/api";
import { CreateSalesTransactionRequest, Customer, Product } from "../types";
import { getCurrentUser } from "../utils/auth";
import { formatCurrency, getProductImageUrl } from "../utils/helpers";
import "../assets/components-styles/GenericForm.css";
import "../assets/components-styles/SalesTransactionModal.css";

interface SalesTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  customers: Customer[];
  isLoading?: boolean;
}

const DEFAULT_CUSTOMER_NAME = "Walk-in Customer";

const calculateAmount = (price: number, quantity: number): number => {
  const priceInCents = Math.round(price * 100);
  return (priceInCents * quantity) / 100;
};

export function SalesTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  customers,
  isLoading = false,
}: SalesTransactionModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(DEFAULT_CUSTOMER_NAME);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive && product.stock > 0),
    [products]
  );

  const selectedProduct = useMemo(
    () => activeProducts.find((product) => product.id === selectedProductId) ?? null,
    [activeProducts, selectedProductId]
  );

  const totalAmount = selectedProduct ? calculateAmount(selectedProduct.price, quantity) : 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedProductId(null);
    setQuantity(1);
    setCustomerName(DEFAULT_CUSTOMER_NAME);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setQuantity(1);
    setSubmitError(null);
  };

  const handleQuantityChange = (nextQuantity: number) => {
    if (!selectedProduct) {
      return;
    }

    const maxQuantity = selectedProduct.stock;
    const clampedQuantity = Math.min(Math.max(1, nextQuantity), maxQuantity);
    setQuantity(clampedQuantity);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!selectedProduct) {
      setSubmitError("Please select a product.");
      return;
    }

    if (quantity <= 0 || quantity > selectedProduct.stock) {
      setSubmitError(`Quantity must be between 1 and ${selectedProduct.stock}.`);
      return;
    }

    const trimmedCustomerName = customerName.trim();
    if (!trimmedCustomerName) {
      setSubmitError("Customer name is required.");
      return;
    }

    const currentUser = getCurrentUser();
    const createdBy = currentUser?.id || customers[0]?.createdBy || "11111111-1111-1111-1111-111111111111";
    const cashierName = currentUser?.username || "Cashier";

    const request: CreateSalesTransactionRequest = {
      customerName: trimmedCustomerName,
      productId: selectedProduct.id,
      quantity,
      amount: totalAmount,
      cashierName,
      saleDate: new Date().toISOString(),
      createdBy,
    };

    setIsSubmitting(true);
    try {
      await apiService.createSalesTransaction(request);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sales-transaction-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Sales Transaction</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sales-transaction-form">
          {submitError && <div className="form-error-message">{submitError}</div>}

          <section className="sales-transaction-section">
            <div className="sales-transaction-section-header">
              <h3>1. Pick a product</h3>
              <span>{activeProducts.length} available</span>
            </div>

            {isLoading ? (
              <div className="sales-transaction-loading">Loading products...</div>
            ) : activeProducts.length === 0 ? (
              <div className="sales-transaction-empty">No active products with stock available.</div>
            ) : (
              <div className="product-picker-grid">
                {activeProducts.map((product) => {
                  const isSelected = product.id === selectedProductId;
                  const imageUrl = getProductImageUrl(product.imageUrl);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={`product-picker-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <div className="product-picker-image-wrap">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} className="product-picker-image" />
                        ) : (
                          <span className="product-picker-image-placeholder">📦</span>
                        )}
                      </div>
                      <div className="product-picker-info">
                        <span className="product-picker-name">{product.name}</span>
                        <span className="product-picker-price">{formatCurrency(product.price)}</span>
                        <span className="product-picker-stock">Stock: {product.stock}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {selectedProduct && (
            <section className="sales-transaction-section sales-transaction-checkout">
              <div className="sales-transaction-section-header">
                <h3>2. Enter quantity</h3>
              </div>

              <div className="sales-transaction-selected-product">
                <div className="sales-transaction-selected-image-wrap">
                  {getProductImageUrl(selectedProduct.imageUrl) ? (
                    <img
                      src={getProductImageUrl(selectedProduct.imageUrl) || undefined}
                      alt={selectedProduct.name}
                      className="sales-transaction-selected-image"
                    />
                  ) : (
                    <span className="product-picker-image-placeholder">📦</span>
                  )}
                </div>
                <div className="sales-transaction-selected-details">
                  <strong>{selectedProduct.name}</strong>
                  <span>{formatCurrency(selectedProduct.price)} each</span>
                </div>
              </div>

              <div className="sales-transaction-quantity-row">
                <label htmlFor="sales-quantity">Quantity</label>
                <div className="sales-transaction-quantity-controls">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || isSubmitting}
                  >
                    −
                  </button>
                  <input
                    id="sales-quantity"
                    type="number"
                    min={1}
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= selectedProduct.stock || isSubmitting}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sales-transaction-total">
                <span>Total</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>

              <div className="sales-transaction-customer">
                <label htmlFor="sales-customer">Customer</label>
                <input
                  id="sales-customer"
                  type="text"
                  list="sales-customer-options"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                  disabled={isSubmitting}
                />
                <datalist id="sales-customer-options">
                  <option value={DEFAULT_CUSTOMER_NAME} />
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
              </div>
            </section>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting || !selectedProduct}
            >
              {isSubmitting ? "Saving..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
