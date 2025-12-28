import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { Customer, DashboardStats, SalesData, LoadingState } from "../types";
import "../assets/page-styles/Dashboard.css";

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

export const Sales = () => {
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

  if (loading.isLoading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading sales data...</p>
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
  );
};

