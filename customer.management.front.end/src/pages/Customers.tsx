import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { Customer, LoadingState } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Customers.css";

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
      {customers.length > 0 && (
        <div className="customer-info-bar">
          <div className="customer-info-content">
            <span className="customer-info-icon">👥</span>
            <span>Showing <strong className="customer-info-strong">{customers.length}</strong> customers</span>
          </div>
        </div>
      )}
      <div className="customer-table-container-wrapper">
        <table className="customer-table customer-table-wrapper">
          <thead>
            <tr>
              <th className="customer-col-name">Name</th>
              <th className="customer-col-email">Email</th>
              <th className="customer-col-status">Status</th>
              <th className="customer-col-last-order">Last Order</th>
              <th className="customer-col-total-spent">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="customer-empty-state">
                  <div className="customer-empty-state-content">
                    <span className="customer-empty-state-icon">👥</span>
                    <span>No customers found</span>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map(customer => {
                const status = getCustomerStatus(customer);
                const statusClass = status.toLowerCase().replace(" ", "-");
                
                return (
                  <tr key={customer.id} className="customer-table-row">
                    <td className="customer-cell-name">{customer.name}</td>
                    <td className={customer.email ? "customer-cell-email" : "customer-cell-email customer-cell-email-na"}>
                      {customer.email || "N/A"}
                    </td>
                    <td>
                      <span className={`customer-status-badge ${statusClass}`}>
                        {status === "Active" ? "✓ " : status === "Inactive" ? "✗ " : ""}{status}
                      </span>
                    </td>
                    <td className="customer-cell-last-order">{getLastOrderDate(customer)}</td>
                    <td className="customer-cell-total-spent">
                      IDR {getTotalSpent(customer).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
        const customersData = await apiService.getCustomers(true);
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

