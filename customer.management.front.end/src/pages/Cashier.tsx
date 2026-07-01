import { useState, useEffect } from "react";
import { SalesTransactionForm } from "../components/SalesTransactionForm";
import { apiService } from "../services/api";
import { Customer, Product } from "../types";
import "../assets/page-styles/Cashier.css";

export const Cashier = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingSalesData, setIsLoadingSalesData] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingSalesData(true);
                const [customersData, productsData] = await Promise.all([
                    apiService.getCustomers(),
                    apiService.getProducts(true),
                ]);
                setCustomers(customersData);
                setProducts(productsData);
            } catch (error) {
                console.error("Error fetching customers/products:", error);
            } finally {
                setIsLoadingSalesData(false);
            }
        };

        fetchData();
    }, [refreshKey]);

    const handleSaleSuccess = () => {
        setRefreshKey((current) => current + 1);
    };

    return (
        <div className="dashboard-content cashier-page">
            <div className="dashboard-header">
                <h1>Cashier</h1>
                <p>Point of sale — pick products, add to cart, and complete the sale.</p>
            </div>

            <div className="table-container pos-container">
                <SalesTransactionForm
                    onSuccess={handleSaleSuccess}
                    products={products}
                    customers={customers}
                    isLoading={isLoadingSalesData}
                />
            </div>
        </div>
    );
};
