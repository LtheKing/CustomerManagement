import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { Customer, LoadingState } from "../types";
import "../assets/page-styles/Dashboard.css";

const CustomerTable = ({ customers }: { customers: Customer[] }) => {
  const getCustomerStatus = (customer: Customer): string => {
    if (!customer.sales || customer.sales.length === 0) return "No Orders";
    
    const lastSale = customer.sales.reduce((latest, sale) => 
      new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
    );
    
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(lastSale.saleDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastOrder <= 30 ? "Active" : "Inactive";
  };

  const getLastOrderDate = (customer: Customer): string => {
    if (!customer.sales || customer.sales.length === 0) return "No orders";
    
    const lastSale = customer.sales.reduce((latest, sale) => 
      new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
    );
    
    return new Date(lastSale.saleDate).toLocaleDateString();
  };

  const getTotalSpent = (customer: Customer): number => {
    return customer.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
  };

  return (
    <div className="table-container">
      <h3>All Customers</h3>
      <table className="customer-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Last Order</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email || "N/A"}</td>
              <td>
                <span className={`status ${getCustomerStatus(customer).toLowerCase().replace(" ", "-")}`}>
                  {getCustomerStatus(customer)}
                </span>
              </td>
              <td>{getLastOrderDate(customer)}</td>
              <td>${getTotalSpent(customer).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, error: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ isLoading: true, error: null });
        const customersData = await apiService.getCustomers();
        setCustomers(customersData);
        setLoading({ isLoading: false, error: null });
      } catch (error) {
        console.error('Error fetching customers:', error);
        setLoading({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch customers' });
      }
    };

    fetchData();
  }, []);

  if (loading.isLoading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading customers data...</p>
        </div>
      </div>
    );
  }

  if (loading.error) {
    return (
      <div className="dashboard-content">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Error Loading Data</h3>
          <p>{loading.error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Customer Management</h1>
        <p>Manage your customer database and view detailed information.</p>
      </div>
      
      <div className="customers-section">
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
};

