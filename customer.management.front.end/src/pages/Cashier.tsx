import { useState, useEffect } from "react";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { CashFlow, CreateCashFlowRequest, CreateSalesTransactionRequest, Customer, Product } from "../types";
import "../assets/page-styles/Cashier.css";

export const Cashier = () => {
    const [capitalCash, setCapitalCash] = useState<number>(0);
    const [_capitalCashId, setCapitalCashId] = useState<string>("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSalesTransactionFormOpen, setIsSalesTransactionFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Fetch current capital cash balance
    useEffect(() => {
        const fetchCapitalCash = async () => {
            try {
                setIsLoading(true);
                const data = await apiService.getCapitalCash();
                // Ensure balance is a valid number
                const balance = typeof data?.balance === 'number' ? data.balance : 0;
                setCapitalCash(balance);
                setCapitalCashId(data?.id || "");
            } catch (error) {
                console.error("Error fetching capital cash:", error);
                // Set to 0 if fetch fails
                setCapitalCash(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCapitalCash();
    }, []);

    // Fetch customers and products for sales transaction form
    useEffect(() => {
        if (isSalesTransactionFormOpen) {
            const fetchData = async () => {
                try {
                    const [customersData, productsData] = await Promise.all([
                        apiService.getCustomers(),
                        apiService.getProducts()
                    ]);
                    setCustomers(customersData);
                    setProducts(productsData);
                } catch (error) {
                    console.error("Error fetching customers/products:", error);
                }
            };
            fetchData();
        } else {
            // Reset when form closes
            setCustomers([]);
            setProducts([]);
        }
    }, [isSalesTransactionFormOpen]);

    // Form fields configuration for CashFlow
    const getCashFlowFields = (): FormField[] => {
        return [
            {
                name: "flowType",
                label: "Flow Type",
                type: "select",
                required: true,
                options: [
                    { value: "ADJUSTMENT_IN", label: "ADJUSTMENT_IN" },
                    { value: "ADJUSTMENT_OUT", label: "ADJUSTMENT_OUT" },
                ],
            },
            {
                name: "amount",
                label: "Amount",
                type: "number",
                required: true,
                placeholder: "Enter amount",
                min: 0,
                step: 0.01,
                validation: (value) => {
                    if (value === null || value === undefined || value === "") {
                        return "Amount is required";
                    }
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                        return "Please enter a valid number";
                    }
                    if (numValue <= 0) {
                        return "Amount must be greater than 0";
                    }
                    return null;
                },
            },
            {
                name: "info",
                label: "Info",
                type: "text",
                required: false,
                placeholder: "Enter additional information",
            },
            {
                name: "flowDate",
                label: "Flow Date",
                type: "date",
                required: true,
                validation: (value) => {
                    if (!value) {
                        return "Flow date is required";
                    }
                    return null;
                },
            },
        ];
    };

    const handleAdjust = () => {
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: Partial<CashFlow>) => {
        // Convert date string to ISO datetime string
        const flowDate = data.flowDate 
            ? new Date(data.flowDate + 'T00:00:00').toISOString()
            : new Date().toISOString();

        const request: CreateCashFlowRequest = {
            flowType: data.flowType || "",
            referenceId: null, // Will be automatically set by backend based on flowType
            amount: Number(data.amount),
            info: data.info || "",
            flowDate: flowDate,
        };

        const result = await apiService.createCashFlow(request);
        return result;
    };

    const handleSuccess = () => {
        // Refresh the capital cash balance after creating cash flow
        const refreshBalance = async () => {
            try {
                const data = await apiService.getCapitalCash();
                // Ensure balance is a valid number
                const balance = typeof data?.balance === 'number' ? data.balance : 0;
                setCapitalCash(balance);
                setCapitalCashId(data?.id || "");
            } catch (error) {
                console.error("Error refreshing capital cash:", error);
                // Set to 0 if refresh fails
                setCapitalCash(0);
            }
        };
        refreshBalance();
    };

    // Form fields configuration for Sales Transaction
    const getSalesTransactionFields = (): FormField[] => {
        const productOptions = products.map(product => ({
            value: product.id,
            label: `${product.name} - IDR ${product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        }));

        // For combobox, we use customer name as both value and label
        // This allows users to select from list or type a new name
        const customerOptions = customers.map(customer => ({
            value: customer.name,
            label: `${customer.name}${customer.email ? ` (${customer.email})` : ''}`
        }));

        return [
            {
                name: "customerName",
                label: "Customer Name",
                type: "combobox",
                required: true,
                placeholder: "Type customer name or select from list",
                options: customerOptions,
                validation: (value) => {
                    if (!value || value.trim() === "") {
                        return "Customer name is required";
                    }
                    return null;
                },
            },
            {
                name: "productId",
                label: "Product",
                type: "select",
                required: true,
                options: productOptions,
                validation: (value) => {
                    if (!value || value === "") {
                        return "Product is required";
                    }
                    return null;
                },
            },
            {
                name: "quantity",
                label: "Quantity",
                type: "number",
                required: true,
                placeholder: "Enter quantity",
                min: 1,
                step: 1,
                validation: (value) => {
                    if (value === null || value === undefined || value === "") {
                        return "Quantity is required";
                    }
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue <= 0) {
                        return "Quantity must be greater than 0";
                    }
                    return null;
                },
            },
            {
                name: "amount",
                label: "Amount",
                type: "number",
                required: true,
                placeholder: "Auto-calculated",
                min: 0,
                step: 0.01,
                disabled: true,
                validation: (value) => {
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue <= 0) {
                        return "Amount must be greater than 0";
                    }
                    return null;
                },
            },
            {
                name: "cashierName",
                label: "Cashier Name",
                type: "text",
                required: true,
                placeholder: "Enter cashier name",
                validation: (value) => {
                    if (!value || value.trim() === "") {
                        return "Cashier name is required";
                    }
                    return null;
                },
            },
        ];
    };

    // Compute amount from product price * quantity
    // Uses integer arithmetic (cents) to ensure exact multiplication
    // Example: 50.00 * 2 = 100.00 (not 99.98)
    const computeSalesTransactionFields = (formData: Record<string, any>): Record<string, any> => {
        const computed: Record<string, any> = {};
        
        if (formData.productId && formData.quantity && products.length > 0) {
            const product = products.find(p => p.id === formData.productId);
            if (product) {
                const quantity = Number(formData.quantity) || 0;
                // Convert price to cents (integer) to avoid floating point precision issues
                // Multiply by 100, then multiply by quantity, then divide by 100
                // This ensures exact multiplication: 50.00 * 2 = 100.00
                const priceInCents = Math.round(product.price * 100);
                const totalInCents = priceInCents * quantity;
                const calculatedAmount = totalInCents / 100;
                computed.amount = calculatedAmount;
            } else {
                computed.amount = 0;
            }
        } else {
            computed.amount = 0;
        }
        
        return computed;
    };

    const handleSalesTransactionSubmit = async (data: Partial<CreateSalesTransactionRequest & { customerName?: string }>) => {
        // Validation
        if (!data.productId || data.productId.trim() === "") {
            throw new Error("Product is required");
        }
        if (!data.cashierName || data.cashierName.trim() === "") {
            throw new Error("Cashier name is required");
        }
        
        // Get createdBy from first customer's createdBy (fallback to default user ID from sample data)
        // TODO: Replace with actual auth context when authentication is implemented
        const createdBy = customers.length > 0 && customers[0].createdBy 
            ? customers[0].createdBy 
            : "11111111-1111-1111-1111-111111111111"; // Default user ID from sample data
        
        const quantity = Number(data.quantity);
        const amount = Number(data.amount);
        if (isNaN(quantity) || quantity <= 0) {
            throw new Error("Quantity must be greater than 0");
        }
        if (isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        // Validate customer name is provided
        const customerName = data.customerName?.trim() || "";
        if (!customerName) {
            throw new Error("Customer name is required");
        }

        // Use hybrid approach: Send customerName directly to sales endpoint
        // Backend will handle finding existing customer or creating new one
        const request: CreateSalesTransactionRequest = {
            customerName: customerName, // Send customerName instead of customerId
            productId: data.productId || "",
            quantity: quantity,
            amount: amount,
            cashierName: data.cashierName || "",
            saleDate: new Date().toISOString(), // Optional, backend will default if not provided
            createdBy: createdBy,
        };

        const result = await apiService.createSalesTransaction(request);
        return result;
    };

    const handleSalesTransactionSuccess = () => {
        // Refresh the capital cash balance after creating sales transaction
        handleSuccess();
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <h1>Cashier</h1>
                <p>Record transactions quickly (UI stub for now).</p>
            </div>

            <div className="cashflow-container">
                <h3>Capital Cash</h3>
                <div>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        disabled
                        value={isLoading ? "Loading..." : (capitalCash ?? 0).toFixed(2)}
                    />
                    <button onClick={handleAdjust} disabled={isLoading}>
                        Adjust
                    </button>
                </div>
            </div>

            <div className="table-container">
                <h3>Point of Sale</h3>
                <div className="pos-actions">
                    <button 
                        className="pos-button"
                        onClick={() => setIsSalesTransactionFormOpen(true)}
                    >
                        ➕ Create Sales Transaction
                    </button>
                </div>
            </div>

            <GenericForm<CashFlow>
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                fields={getCashFlowFields()}
                mode="create"
                initialValues={{
                    id: "",
                    flowType: "ADJUSTMENT_IN",
                    amount: 0,
                    info: "",
                    flowDate: new Date().toISOString().split('T')[0],
                }}
                onSubmit={handleSubmit}
                onSuccess={handleSuccess}
                title="Adjust Capital Cash"
                submitLabel="Create Cash Flow"
            />

            <GenericForm<CreateSalesTransactionRequest & { customerName?: string }>
                isOpen={isSalesTransactionFormOpen}
                onClose={() => setIsSalesTransactionFormOpen(false)}
                fields={getSalesTransactionFields()}
                mode="create"
                initialValues={{
                    customerName: "",
                    productId: "",
                    quantity: 1,
                    amount: 0,
                    cashierName: "",
                    saleDate: new Date().toISOString().split('T')[0],
                    createdBy: "",
                }}
                onSubmit={handleSalesTransactionSubmit}
                onSuccess={handleSalesTransactionSuccess}
                title="Create Sales Transaction"
                submitLabel="Create Transaction"
                computedFields={computeSalesTransactionFields}
                twoColumn={true}
            />
        </div>
    );
};

