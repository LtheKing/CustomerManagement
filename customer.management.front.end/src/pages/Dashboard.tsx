import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { Customer, DashboardStats, SalesData, LoadingState } from "../types";
import "../assets/page-styles/Dashboard.css";

const StatCard = ({ title, value, change, icon }: { title: string; value: string; change: string; icon: string }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
      <div className="stat-change">{change}</div>
    </div>
  </div>
);

const SimpleChart = ({ data, title }: { data: any[]; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.sales));
  
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="chart">
        {data.map((item, index) => (
          <div key={index} className="chart-bar">
            <div 
              className="bar" 
              style={{ height: `${(item.sales / maxValue) * 100}%` }}
            ></div>
            <span className="bar-label">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
      <h3>Recent Customers</h3>
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
          {customers.slice(0, 10).map(customer => (
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

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, error: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ isLoading: true, error: null });
        
        // Fetch all data in parallel
        const [customersData, statsData, salesDataResult] = await Promise.all([
          apiService.getCustomers(),
          apiService.getDashboardStats(),
          apiService.getSalesData()
        ]);

        setCustomers(customersData);
        setDashboardStats(statsData);
        setSalesData(salesDataResult);
        setLoading({ isLoading: false, error: null });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch data' });
      }
    };

    fetchData();
  }, []);

  const handleSeedData = async () => {
    try {
      setLoading({ isLoading: true, error: null });
      await apiService.seedData();
      // Refresh data after seeding
      const [customersData, statsData, salesDataResult] = await Promise.all([
        apiService.getCustomers(),
        apiService.getDashboardStats(),
        apiService.getSalesData()
      ]);
      setCustomers(customersData);
      setDashboardStats(statsData);
      setSalesData(salesDataResult);
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error seeding data:', error);
      setLoading({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to seed data' });
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
          </div>
          <div className={`nav-item ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>
            📊 Overview
          </div>
          <div className={`nav-item ${activeTab === "sales" ? "active" : ""}`} onClick={() => setActiveTab("sales")}>
            💰 Sales
          </div>
          <div className={`nav-item ${activeTab === "customers" ? "active" : ""}`} onClick={() => setActiveTab("customers")}>
            👥 Customers
          </div>
            <div className={`nav-item ${activeTab === "cashier" ? "active" : ""}`} onClick={() => setActiveTab("cashier")}>
              🧾 Cashier
            </div>
          <div className="nav-item">
            📈 Analytics
          </div>
          <div className="sidebar-footer">
            <button 
              className="seed-button" 
              onClick={handleSeedData}
              disabled={loading.isLoading}
            >
              {loading.isLoading ? "⏳ Loading..." : "🌱 Seed Data"}
            </button>
          </div>
        </div>
        <div className="content-panel">
          {loading.isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>Loading dashboard data...</p>
            </div>
          ) : loading.error ? (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h3>Error Loading Data</h3>
              <p>{loading.error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                🔄 Retry
              </button>
            </div>
          ) : activeTab === "home" ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h1>Customer Management Dashboard</h1>
                <p>Welcome back! Here's what's happening with your business.</p>
              </div>
              
              {dashboardStats && (
                <div className="stats-grid">
                  <StatCard 
                    title="Total Revenue" 
                    value={`$${dashboardStats.totalRevenue.toLocaleString()}`} 
                    change="+12% from last month" 
                    icon="💰"
                  />
                  <StatCard 
                    title="Total Customers" 
                    value={dashboardStats.totalCustomers.toString()} 
                    change="+8% from last month" 
                    icon="👥"
                  />
                  <StatCard 
                    title="Active Customers" 
                    value={dashboardStats.activeCustomers.toString()} 
                    change="+5% from last month" 
                    icon="✅"
                  />
                  <StatCard 
                    title="Avg Order Value" 
                    value={`$${Math.round(dashboardStats.avgOrderValue).toLocaleString()}`} 
                    change="+3% from last month" 
                    icon="📊"
                  />
                </div>
              )}

              <div className="dashboard-grid">
                <div className="chart-section">
                  <SimpleChart data={salesData} title="Sales Trend (Last 6 Months)" />
                </div>
                <div className="table-section">
                  <CustomerTable customers={customers} />
                </div>
              </div>
            </div>
          ) : activeTab === "sales" ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h1>Sales Analytics</h1>
                <p>Detailed sales performance and customer insights.</p>
              </div>
              
              <div className="sales-grid">
                <div className="sales-chart">
                  <SimpleChart data={salesData} title="Monthly Sales Performance" />
                </div>
                <div className="customer-insights">
                  <h3>Customer Insights</h3>
                  <div className="insight-cards">
                    <div className="insight-card">
                      <h4>Top Customer</h4>
                      <p>{customers.length > 0 ? customers.reduce((top, customer) => {
                        const customerTotal = customer.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
                        const topTotal = top.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
                        return customerTotal > topTotal ? customer : top;
                      }).name : "N/A"}</p>
                      <span>${customers.length > 0 ? Math.max(...customers.map(c => c.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0)).toLocaleString() : "0"}</span>
                    </div>
                    <div className="insight-card">
                      <h4>Total Orders</h4>
                      <p>{customers.reduce((sum, customer) => sum + (customer.sales?.length || 0), 0)}</p>
                      <span>All time</span>
                    </div>
                    <div className="insight-card">
                      <h4>Active Rate</h4>
                      <p>{dashboardStats ? Math.round((dashboardStats.activeCustomers / dashboardStats.totalCustomers) * 100) : 0}%</p>
                      <span>Last 30 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "customers" ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h1>Customer Management</h1>
                <p>Manage your customer database and view detailed information.</p>
              </div>
              
              <div className="customers-section">
                <CustomerTable customers={customers} />
              </div>
            </div>
          ) : activeTab === "cashier" ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h1>Cashier</h1>
                <p>Record transactions quickly (UI stub for now).</p>
              </div>

              <div className="table-container">
                <h3>Point of Sale</h3>
                <p>
                  This screen is ready to be wired up to a sales/transaction API. Add product scan/search,
                  customer selection, and checkout here.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

