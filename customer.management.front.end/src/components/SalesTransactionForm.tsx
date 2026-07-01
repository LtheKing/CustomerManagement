import { useMemo, useState, FormEvent } from "react";
import { apiService } from "../services/api";
import { CreateSalesTransactionRequest, Customer, Product } from "../types";
import { getCurrentUser } from "../utils/auth";
import { formatCurrency, getProductImageUrl } from "../utils/helpers";
import "../assets/components-styles/GenericForm.css";
import "../assets/components-styles/SalesTransactionModal.css";

interface SalesTransactionFormProps {
  onSuccess: () => void;
  products: Product[];
  customers: Customer[];
  isLoading?: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  amount: number;
  maxStock: number;
}

const DEFAULT_CUSTOMER_NAME = "Walk-in Customer";

const calculateAmount = (price: number, quantity: number): number => {
  const priceInCents = Math.round(price * 100);
  return (priceInCents * quantity) / 100;
};

const resetFormState = () => ({
  selectedProductId: null as string | null,
  quantity: 1,
  cart: [] as CartItem[],
  customerName: DEFAULT_CUSTOMER_NAME,
  submitError: null as string | null,
  cartError: null as string | null,
});

export function SalesTransactionForm({
  onSuccess,
  products,
  customers,
  isLoading = false,
}: SalesTransactionFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState(DEFAULT_CUSTOMER_NAME);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive && product.stock > 0),
    [products]
  );

  const selectedProduct = useMemo(
    () => activeProducts.find((product) => product.id === selectedProductId) ?? null,
    [activeProducts, selectedProductId]
  );

  const lineTotal = selectedProduct ? calculateAmount(selectedProduct.price, quantity) : 0;
  const cartGrandTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.amount, 0),
    [cart]
  );
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const getCartQuantityForProduct = (productId: string): number =>
    cart
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

  const getAvailableStock = (product: Product): number =>
    product.stock - getCartQuantityForProduct(product.id);

  const clearCart = () => {
    const reset = resetFormState();
    setSelectedProductId(reset.selectedProductId);
    setQuantity(reset.quantity);
    setCart(reset.cart);
    setCustomerName(reset.customerName);
    setSubmitError(reset.submitError);
    setCartError(reset.cartError);
  };

  const handleProductSelect = (productId: string) => {
    const product = activeProducts.find((item) => item.id === productId);
    if (!product || getAvailableStock(product) <= 0) {
      return;
    }

    setSelectedProductId(productId);
    setQuantity(1);
    setCartError(null);
    setSubmitError(null);
  };

  const handleQuantityChange = (nextQuantity: number) => {
    if (!selectedProduct) {
      return;
    }

    const maxQuantity = getAvailableStock(selectedProduct);
    const clampedQuantity = Math.min(Math.max(1, nextQuantity), maxQuantity);
    setQuantity(clampedQuantity);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setCartError("Please select a product.");
      return;
    }

    const availableStock = getAvailableStock(selectedProduct);
    if (quantity <= 0 || quantity > availableStock) {
      setCartError(`Quantity must be between 1 and ${availableStock}.`);
      return;
    }

    const amount = calculateAmount(selectedProduct.price, quantity);
    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex((item) => item.productId === selectedProduct.id);

      if (existingIndex >= 0) {
        const updatedCart = [...currentCart];
        const newQuantity = updatedCart[existingIndex].quantity + quantity;
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: newQuantity,
          amount: calculateAmount(selectedProduct.price, newQuantity),
        };
        return updatedCart;
      }

      return [
        ...currentCart,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          imageUrl: selectedProduct.imageUrl,
          unitPrice: selectedProduct.price,
          quantity,
          amount,
          maxStock: selectedProduct.stock,
        },
      ];
    });

    setSelectedProductId(null);
    setQuantity(1);
    setCartError(null);
    setSubmitError(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
    setCartError(null);
    setSubmitError(null);
  };

  const handleCartQuantityChange = (productId: string, nextQuantity: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const clampedQuantity = Math.min(Math.max(1, nextQuantity), item.maxStock);
        return {
          ...item,
          quantity: clampedQuantity,
          amount: calculateAmount(item.unitPrice, clampedQuantity),
        };
      })
    );
    setCartError(null);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setCartError(null);

    if (cart.length === 0) {
      setSubmitError("Add at least one product to the cart.");
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

    setIsSubmitting(true);
    try {
      for (const item of cart) {
        const request: CreateSalesTransactionRequest = {
          customerName: trimmedCustomerName,
          productId: item.productId,
          quantity: item.quantity,
          amount: item.amount,
          cashierName,
          saleDate: new Date().toISOString(),
          createdBy,
        };
        await apiService.createSalesTransaction(request);
      }

      clearCart();
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const panelClassName = [
    "sales-transaction-panel",
    selectedProduct ? "has-selection" : "",
    cart.length > 0 ? "has-cart" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={panelClassName}>
      <form onSubmit={handleSubmit} className="sales-transaction-form">
        <div className="sales-transaction-body">
          {submitError && <div className="form-error-message">{submitError}</div>}

          <div className="sales-pos-layout">
            <section className="sales-pos-products sales-transaction-section">
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
                    const availableStock = getAvailableStock(product);
                    const imageUrl = getProductImageUrl(product.imageUrl);
                    const isOutOfStock = availableStock <= 0;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`product-picker-card ${isSelected ? "selected" : ""} ${isOutOfStock ? "out-of-stock" : ""}`}
                        onClick={() => handleProductSelect(product.id)}
                        disabled={isOutOfStock || isSubmitting}
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
                          <span className="product-picker-stock">
                            {isOutOfStock ? "In cart" : `Stock: ${availableStock}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="sales-pos-sidebar">
              <section className="sales-pos-quantity sales-transaction-section sales-transaction-checkout">
                <div className="sales-transaction-section-header">
                  <h3>2. Set quantity</h3>
                </div>

                {selectedProduct ? (
                  <>
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

                    <div className="sales-transaction-checkout-row">
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
                            max={getAvailableStock(selectedProduct)}
                            value={quantity}
                            onChange={(event) => handleQuantityChange(Number(event.target.value))}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= getAvailableStock(selectedProduct) || isSubmitting}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sales-transaction-total">
                        <span>Line total</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </div>
                    </div>

                    {cartError && <div className="sales-transaction-cart-error">{cartError}</div>}

                    <button
                      type="button"
                      className="btn-add-to-cart"
                      onClick={handleAddToCart}
                      disabled={isSubmitting}
                    >
                      Add to Cart
                    </button>
                  </>
                ) : (
                  <div className="sales-pos-quantity-empty">
                    Select a product from the left to set quantity.
                  </div>
                )}
              </section>

              <section className="sales-pos-cart sales-transaction-section sales-transaction-cart-section">
                <div className="sales-transaction-section-header">
                  <h3>3. Cart</h3>
                  <span>{cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span>
                </div>

                {cart.length === 0 ? (
                  <div className="sales-transaction-cart-empty">No items yet. Pick a product and add it to the cart.</div>
                ) : (
                  <div className="sales-transaction-cart-list">
                    {cart.map((item) => (
                      <div key={item.productId} className="sales-transaction-cart-item">
                        <div className="sales-transaction-cart-item-image-wrap">
                          {getProductImageUrl(item.imageUrl) ? (
                            <img
                              src={getProductImageUrl(item.imageUrl) || undefined}
                              alt={item.productName}
                              className="sales-transaction-cart-item-image"
                            />
                          ) : (
                            <span className="product-picker-image-placeholder">📦</span>
                          )}
                        </div>

                        <div className="sales-transaction-cart-item-details">
                          <strong>{item.productName}</strong>
                          <span>{formatCurrency(item.unitPrice)} each</span>
                        </div>

                        <div className="sales-transaction-cart-item-controls">
                          <div className="sales-transaction-quantity-controls">
                            <button
                              type="button"
                              className="quantity-btn"
                              onClick={() => handleCartQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isSubmitting}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(event) =>
                                handleCartQuantityChange(item.productId, Number(event.target.value))
                              }
                              disabled={isSubmitting}
                              aria-label={`Quantity for ${item.productName}`}
                            />
                            <button
                              type="button"
                              className="quantity-btn"
                              onClick={() => handleCartQuantityChange(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock || isSubmitting}
                            >
                              +
                            </button>
                          </div>
                          <strong className="sales-transaction-cart-item-total">{formatCurrency(item.amount)}</strong>
                          <button
                            type="button"
                            className="sales-transaction-cart-remove"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            disabled={isSubmitting}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </section>
            </div>
          </div>
        </div>

        <div className="sales-pos-checkout-bar">
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

          <div className="sales-pos-checkout-actions">
            <div className="sales-transaction-grand-total">
              <span>Grand total</span>
              <strong>{formatCurrency(cartGrandTotal)}</strong>
            </div>

            <div className="form-actions sales-transaction-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={clearCart}
                disabled={isSubmitting || cart.length === 0}
              >
                Clear Cart
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? "Saving..." : `Complete Sale (${cartItemCount})`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
