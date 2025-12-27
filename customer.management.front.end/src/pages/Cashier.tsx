import { useState, useEffect } from "react";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { CashFlow, CreateCashFlowRequest } from "../types";
import "../assets/page-styles/Cashier.css";

export const Cashier = () => {
    const [capitalCash, setCapitalCash] = useState<number>(0);
    const [_capitalCashId, setCapitalCashId] = useState<string>("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    // Form fields configuration for CashFlow
    const getCashFlowFields = (): FormField[] => {
        return [
            {
                name: "id",
                label: "ID",
                type: "text",
                disabled: true,
                placeholder: "Auto-generated",
            },
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
                <p>
                    This screen is ready to be wired up to a sales/transaction API. Add product scan/search,
                    customer selection, and checkout here.
                </p>
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
        </div>
    );
};

