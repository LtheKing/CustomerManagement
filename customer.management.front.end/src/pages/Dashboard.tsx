import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { DashboardStats, SalesData, LoadingState, Sales, ProductSalesData } from "../types";
import { Cashier } from "./Cashier";
import { Sales as SalesPage } from "./Sales";
import { Customers } from "./Customers";
import { Expense } from "./Expense";
import { ProductPage } from "./Product";
import { AddStockPage } from "./AddStock";
import { UserPage } from "./User";
import { isAdmin, isSales } from "../utils/auth";
import "../assets/page-styles/Dashboard.css";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  children?: { id: string; label: string; icon: string; adminOnly?: boolean }[];
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Overview", icon: "📊", adminOnly: true },
  { id: "sales", label: "Sales", icon: "💰", adminOnly: true },
  { id: "customers", label: "Customers", icon: "👥", adminOnly: true },
  { id: "cashier", label: "Cashier", icon: "🧾" },
  { id: "finance", label: "Finance", icon: "💸", adminOnly: true },
  {
    id: "product",
    label: "Products",
    icon: "📦",
    adminOnly: true,
    children: [{ id: "add-stock", label: "Add Stock", icon: "📥", adminOnly: true }],
  },
  { id: "user", label: "Users", icon: "👤", adminOnly: true },
];

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";
const PRODUCT_NAV_IDS = new Set(["product", "add-stock"]);

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
  const maxValue = Math.max(...data.map(d => d.sales), 1); // Prevent division by zero
  
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="chart">
        {data.map((item, index) => {
          const barHeight = maxValue > 0 && item.sales > 0 ? (item.sales / maxValue) * 100 : 0;
          return (
            <div key={index} className="chart-bar">
              <div className="bar-value-container">
                <span className="bar-value">
                  IDR {item.sales.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="bar-customers">
                  {item.customers} {item.customers === 1 ? 'customer' : 'customers'}
                </span>
              </div>
              <div 
                className="bar" 
                style={{ 
                  height: barHeight > 0 ? `${barHeight}%` : '2px',
                  minHeight: barHeight > 0 ? '20px' : '2px'
                }}
                title={`${item.month}: IDR ${item.sales.toLocaleString('id-ID')} (${item.customers} customers)`}
              ></div>
              <span className="bar-label">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProductSalesTable = ({ sales }: { sales: Sales[] }) => {
  // Group sales by product and calculate totals
  const productSalesMap = new Map<string, ProductSalesData>();

  sales.forEach(sale => {
    const existing = productSalesMap.get(sale.productId);
    if (existing) {
      existing.totalQuantity += sale.quantity;
      existing.totalPrice += sale.amount;
    } else {
      productSalesMap.set(sale.productId, {
        productName: sale.productName,
        totalQuantity: sale.quantity,
        totalPrice: sale.amount,
      });
    }
  });

  // Convert to array and sort by total quantity (descending)
  const productSales = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return (
    <div className="table-container">
      <h3>Product Sales</h3>
      <table className="customer-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Total Qty Sold</th>
            <th>Total Price Sold</th>
          </tr>
        </thead>
        <tbody>
          {productSales.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                No sales data available
              </td>
            </tr>
          ) : (
            productSales.map((product, index) => (
              <tr key={index}>
                <td>{product.productName}</td>
                <td>{product.totalQuantity.toLocaleString('id-ID')}</td>
                <td>IDR {product.totalPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Dashboard = () => {
  // Set default tab based on user role
  const getDefaultTab = (): string => {
    if (isSales()) return "cashier";
    return "home";
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [productsNavOpen, setProductsNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  );
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<Sales[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, error: null });

  // Handle tab change with role-based access control
  const handleTabChange = (tab: string) => {
    // Sales users can only access cashier
    if (isSales() && tab !== "cashier") {
      setActiveTab("cashier");
      return;
    }
    // Admin can access all tabs
    if (isAdmin() || tab === "cashier") {
      if (PRODUCT_NAV_IDS.has(tab)) {
        setProductsNavOpen(true);
      }
      setActiveTab(tab);
      return;
    }
    // Default fallback
    setActiveTab("cashier");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin());

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? "+100% from last month" : "No change";
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}% from last month`;
  };

  // Helper function to get current month and previous month data
  const getMonthData = (sales: Sales[]) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthSales = sales.filter(s => s.saleDate.startsWith(currentMonth));
    const previousMonthSales = sales.filter(s => s.saleDate.startsWith(previousMonth));

    const currentMonthRevenue = currentMonthSales.reduce((sum, s) => sum + s.amount, 0);
    const previousMonthRevenue = previousMonthSales.reduce((sum, s) => sum + s.amount, 0);

    const currentMonthCustomers = new Set(currentMonthSales.map(s => s.customerId)).size;
    const previousMonthCustomers = new Set(previousMonthSales.map(s => s.customerId)).size;

    const currentMonthAvgOrder = currentMonthSales.length > 0 
      ? currentMonthRevenue / currentMonthSales.length 
      : 0;
    const previousMonthAvgOrder = previousMonthSales.length > 0 
      ? previousMonthRevenue / previousMonthSales.length 
      : 0;

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      currentMonthCustomers,
      previousMonthCustomers,
      currentMonthAvgOrder,
      previousMonthAvgOrder,
    };
  };

  // Helper function to find most sold product
  const getMostSoldProduct = (sales: Sales[]): { name: string; count: number } | null => {
    if (sales.length === 0) return null;

    const productCounts = new Map<string, number>();
    const productNames = new Map<string, string>();

    sales.forEach(sale => {
      const count = productCounts.get(sale.productId) || 0;
      productCounts.set(sale.productId, count + 1);
      productNames.set(sale.productId, sale.productName);
    });

    let maxCount = 0;
    let mostSoldProductId = "";

    productCounts.forEach((count, productId) => {
      if (count > maxCount) {
        maxCount = count;
        mostSoldProductId = productId;
      }
    });

    if (mostSoldProductId) {
      return {
        name: productNames.get(mostSoldProductId) || "Unknown",
        count: maxCount,
      };
    }

    return null;
  };

  // Helper function to calculate sales data from actual transactions
  const calculateSalesTrendData = (sales: Sales[]): SalesData[] => {
    // Get last 6 months - ensure we get unique consecutive months
    const now = new Date();
    const last6Months: Date[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(date);
    }

    // Use a Map to ensure unique months and aggregate data
    const monthDataMap = new Map<string, { month: string; sales: number; customers: Set<string> }>();

    last6Months.forEach(date => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`; // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Initialize if not exists
      if (!monthDataMap.has(monthKey)) {
        monthDataMap.set(monthKey, {
          month: monthName,
          sales: 0,
          customers: new Set()
        });
      }
      
      // Filter sales for this month
      const monthSales = sales.filter(sale => sale.saleDate.startsWith(monthKey));
      
      // Aggregate data
      const monthData = monthDataMap.get(monthKey)!;
      monthData.sales = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
      monthSales.forEach(sale => monthData.customers.add(sale.customerId));
    });

    // Convert to array maintaining order
    return last6Months.map(date => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthData = monthDataMap.get(monthKey)!;
      
      return {
        month: monthData.month,
        sales: monthData.sales,
        customers: monthData.customers.size
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ isLoading: true, error: null });
        
        // Fetch all data in parallel
        const [statsData, salesTransactionsResult] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getSalesTransactions(1, 1000).catch(() => ({ data: [], totalCount: 0, page: 1, pageSize: 1000, totalPages: 0, hasPreviousPage: false, hasNextPage: false }))
        ]);

        setDashboardStats(statsData);
        setSalesTransactions(salesTransactionsResult.data || []);
        setLoading({ isLoading: false, error: null });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch data' });
      }
    };

    fetchData();
  }, []);

  // Calculate month-over-month changes
  const monthData = getMonthData(salesTransactions);
  const revenueChange = calculatePercentageChange(monthData.currentMonthRevenue, monthData.previousMonthRevenue);
  const customersChange = calculatePercentageChange(monthData.currentMonthCustomers, monthData.previousMonthCustomers);
  const avgOrderChange = calculatePercentageChange(monthData.currentMonthAvgOrder, monthData.previousMonthAvgOrder);

  // Get most sold product
  const mostSoldProduct = getMostSoldProduct(salesTransactions);

  // Calculate sales trend data from actual transactions
  const actualSalesTrendData = calculateSalesTrendData(salesTransactions);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API to revoke refresh token and clear cookies
      await apiService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear authentication data
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            {!sidebarCollapsed && <h2>Dashboard</h2>}
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          </div>

          {visibleNavItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const childActive = item.children?.some((child) => child.id === activeTab);
            const isProductGroup = item.id === "product";
            const isExpanded = isProductGroup && (productsNavOpen || Boolean(childActive) || activeTab === "product");
            const isActive = activeTab === item.id || Boolean(childActive);

            return (
              <div key={item.id} className="nav-group">
                <div
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (hasChildren && !sidebarCollapsed) {
                      setProductsNavOpen((open) => (activeTab === item.id || childActive ? !open : true));
                    }
                    handleTabChange(item.id);
                  }}
                  title={item.label}
                >
                  <span className="nav-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-item-label">{item.label}</span>
                  {hasChildren && !sidebarCollapsed && (
                    <span className={`nav-item-chevron ${isExpanded ? "open" : ""}`} aria-hidden="true">
                      ▾
                    </span>
                  )}
                </div>

                {hasChildren && isExpanded && !sidebarCollapsed && (
                  <div className="nav-submenu">
                    {item.children!
                      .filter((child) => !child.adminOnly || isAdmin())
                      .map((child) => (
                        <div
                          key={child.id}
                          className={`nav-item nav-subitem ${activeTab === child.id ? "active" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleTabChange(child.id);
                          }}
                          title={child.label}
                        >
                          <span className="nav-item-icon" aria-hidden="true">
                            {child.icon}
                          </span>
                          <span className="nav-item-label">{child.label}</span>
                        </div>
                      ))}
                  </div>
                )}

                {hasChildren && sidebarCollapsed && (
                  <div
                    className={`nav-item nav-subitem-collapsed ${activeTab === "add-stock" ? "active" : ""}`}
                    onClick={() => handleTabChange("add-stock")}
                    title="Add Stock"
                  >
                    <span className="nav-item-icon" aria-hidden="true">
                      📥
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="sidebar-footer">
            <button
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <span className="nav-item-icon" aria-hidden="true">
                🚪
              </span>
              <span className="nav-item-label">Logout</span>
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
          ) : activeTab === "home" && isAdmin() ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h1>Customer Management Dashboard</h1>
                <p>Welcome back! Here's what's happening with your business.</p>
              </div>
              
              {dashboardStats && (
                <div className="stats-grid">
                  <StatCard 
                    title="Total Revenue" 
                    value={`IDR ${dashboardStats.totalRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                    change={revenueChange} 
                    icon="💰"
                  />
                  <StatCard 
                    title="Total Customers" 
                    value={dashboardStats.totalCustomers.toString()} 
                    change={customersChange} 
                    icon="👥"
                  />
                  <StatCard 
                    title="Most Sold Product" 
                    value={mostSoldProduct ? mostSoldProduct.name : "No sales yet"} 
                    change={mostSoldProduct ? `${mostSoldProduct.count} sales` : ""} 
                    icon="🏆"
                  />
                  <StatCard 
                    title="Avg Order Value" 
                    value={`IDR ${Math.round(dashboardStats.avgOrderValue).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                    change={avgOrderChange} 
                    icon="📊"
                  />
                </div>
              )}

              <div className="dashboard-grid">
                <div className="chart-section">
                  <SimpleChart data={actualSalesTrendData} title="Sales Trend (Last 6 Months)" />
                </div>
                <div className="table-section">
                  <ProductSalesTable sales={salesTransactions} />
                </div>
              </div>
            </div>
          ) : activeTab === "sales" && isAdmin() ? (
            <SalesPage />
          ) : activeTab === "customers" && isAdmin() ? (
            <Customers />
          ) : activeTab === "cashier" ? (
            <Cashier />
          ) : activeTab === "finance" && isAdmin() ? (
            <Expense />
          ) : activeTab === "product" && isAdmin() ? (
            <ProductPage />
          ) : activeTab === "add-stock" && isAdmin() ? (
            <AddStockPage />
          ) : activeTab === "user" && isAdmin() ? (
            <UserPage />
          ) : (
            // Fallback: If Sales user tries to access restricted tab, show cashier
            <Cashier />
          )}
        </div>
      </div>
    </div>
  );
};

