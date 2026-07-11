import { useState, useEffect, Fragment } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../services/api";
import { Customer, DashboardStats, SalesData, LoadingState, Product, PagedResult, SalesTransactionGroup } from "../types";
import type { Sales as SalesType } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";

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

const AnalyticTab = ({ customers, dashboardStats, salesTransactions }: { customers: Customer[]; dashboardStats: DashboardStats | null; salesTransactions: SalesType[] }) => {
  // Helper function to calculate sales data from actual transactions (same as Dashboard)
  const calculateSalesTrendData = (sales: SalesType[]): SalesData[] => {
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

  const actualSalesTrendData = calculateSalesTrendData(salesTransactions);

  return (
    <div className="sales-grid">
      <div className="sales-chart">
        <SimpleChart data={actualSalesTrendData} title="Monthly Sales Performance" />
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
            <span>IDR {customers.length > 0 ? Math.max(...customers.map(c => c.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}</span>
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
  );
};

const ReportTab = () => {
  const [pagedResult, setPagedResult] = useState<PagedResult<SalesTransactionGroup>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cashierNames, setCashierNames] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedCashier, setSelectedCashier] = useState<string>("");

  // Cache management: Store loaded pages by filter key and page number
  const [pageCache, setPageCache] = useState<Map<string, PagedResult<SalesTransactionGroup>>>(new Map());
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(Date.now());
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

  // Generate cache key from current filters
  const getCacheKey = (page: number): string => {
    return `grouped-${page}-${pageSize}-${startDate}-${endDate}-${selectedCustomerId}-${selectedProductId}-${selectedCashier}`;
  };

  // Check if cache is valid (not expired)
  const isCacheValid = (): boolean => {
    return (Date.now() - cacheTimestamp) < CACHE_EXPIRY_MS;
  };

  // Clear cache (useful for refresh)
  const clearCache = () => {
    setPageCache(new Map());
    setCacheTimestamp(Date.now());
  };

  const toggleExpanded = (transactionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const fetchSalesTransactions = async (page: number = currentPage, forceRefresh: boolean = false) => {
    try {
      const cacheKey = getCacheKey(page);
      
      // Check cache first (if not forcing refresh and cache is valid)
      if (!forceRefresh && isCacheValid()) {
        const cached = pageCache.get(cacheKey);
        if (cached) {
          setPagedResult(cached);
          return; // Use cached data
        }
      }

      setLoading(true);
      const result = await apiService.getSalesTransactionGroups(
        page,
        pageSize,
        startDate || undefined,
        endDate || undefined,
        selectedCustomerId || undefined,
        selectedProductId || undefined,
        selectedCashier || undefined
      );
      
      // Update cache
      setPageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, result);
        return newCache;
      });
      setCacheTimestamp(Date.now());
      
      setPagedResult(result);
      
      // Extract unique cashier names from current page
      const uniqueCashiers = Array.from(
        new Set(result.data.map(s => s.cashierName).filter(Boolean))
      ).sort() as string[];
      if (uniqueCashiers.length > 0) {
        setCashierNames(prev => {
          const combined = [...new Set([...prev, ...uniqueCashiers])].sort();
          return combined;
        });
      }
    } catch (error) {
      console.error('Error fetching sales transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts()
      ]);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching customers/products:', error);
    }
  };

  useEffect(() => {
    fetchCustomersAndProducts();
  }, []);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    setCurrentPage(1);
    clearCache(); // Clear cache when filters change
    fetchSalesTransactions(1, true); // Force refresh when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedCustomerId, selectedProductId, selectedCashier, pageSize]);

  // Fetch data when page changes (use cache if available)
  useEffect(() => {
    fetchSalesTransactions(currentPage, false); // Use cache if available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleFilter = () => {
    setCurrentPage(1);
    clearCache(); // Clear cache on manual filter
    fetchSalesTransactions(1, true);
  };

  const handleRefresh = () => {
    clearCache(); // Clear cache on refresh
    fetchSalesTransactions(currentPage, true);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCustomerId("");
    setSelectedProductId("");
    setSelectedCashier("");
  };

  const handleExportToExcel = async () => {
    if (pagedResult.data.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const allData: SalesTransactionGroup[] = [];
      let exportPage = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await apiService.getSalesTransactionGroups(
          exportPage,
          1000,
          startDate || undefined,
          endDate || undefined,
          selectedCustomerId || undefined,
          selectedProductId || undefined,
          selectedCashier || undefined
        );
        
        allData.push(...result.data);
        hasMore = result.hasNextPage;
        exportPage++;
      }

      const exportData = allData.flatMap((transaction) =>
        transaction.items.map((item) => ({
          "Date": formatDate(transaction.saleDate),
          "Transaction ID": transaction.transactionId,
          "Customer": transaction.customerName,
          "Product": item.productName,
          "Quantity": item.quantity,
          "Amount": item.amount,
          "Transaction Total": transaction.totalAmount,
          "Cashier": transaction.cashierName || "N/A",
        }))
      );

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Sales_Report_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number) =>
    `IDR ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const productSummary = (transaction: SalesTransactionGroup) => {
    if (transaction.items.length === 1) {
      return transaction.items[0].productName;
    }
    return `${transaction.itemCount} products`;
  };

  return (
    <div className="sales-report-container">
      <div className="sales-report-filters">
        <div className="filter-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="customer">Customer</label>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="product">Product</label>
          <select
            id="product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="cashier">Cashier</label>
          <select
            id="cashier"
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
          >
            <option value="">All Cashiers</option>
            {cashierNames.map(cashier => (
              <option key={cashier} value={cashier}>
                {cashier}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleFilter} disabled={loading}>
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button onClick={handleRefresh} disabled={loading} className="refresh-btn" title="Refresh data (clears cache)">
          🔄 Refresh
        </button>
        <button onClick={handleClearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
        <button 
          onClick={handleExportToExcel} 
          disabled={pagedResult.data.length === 0}
          className="export-excel-btn"
        >
          📊 Export to Excel
        </button>
        <div className="filter-group">
          <label htmlFor="pageSize">Page Size</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading sales transactions...</p>
        </div>
      ) : (
        <>
          <div className="sales-report-info-bar">
            <div className="sales-report-info-content">
              <span className="sales-report-info-icon">📊</span>
              <span>Showing <strong className="sales-report-info-strong">{pagedResult.data.length}</strong> of <strong className="sales-report-info-strong">{pagedResult.totalCount}</strong> transactions
              {pagedResult.totalPages > 1 && ` (Page ${pagedResult.page} of ${pagedResult.totalPages})`}</span>
            </div>
            {!isCacheValid() && (
              <div className="sales-report-cache-indicator">
                <span>🔍</span>
                <span>Cache expired - data will refresh on next navigation</span>
              </div>
            )}
          </div>
          <div className="sales-report-table-container">
            <table className="sales-report-table sales-report-table-wrapper">
              <thead>
                <tr>
                  <th className="sales-col-expand"></th>
                  <th className="sales-col-date">Date</th>
                  <th className="sales-col-customer">Customer</th>
                  <th className="sales-col-product">Products</th>
                  <th className="text-center sales-col-quantity">Qty</th>
                  <th className="text-right sales-col-amount">Total</th>
                  <th className="sales-col-cashier">Cashier</th>
                </tr>
              </thead>
              <tbody>
                {pagedResult.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="sales-report-empty-state">
                      <div className="sales-report-empty-state-content">
                        <span className="sales-report-empty-state-icon">💰</span>
                        <span>No sales transactions found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedResult.data.map((transaction) => {
                    const isExpanded = expandedIds.has(transaction.transactionId);
                    const canExpand = transaction.items.length > 1;

                    return (
                      <Fragment key={transaction.transactionId}>
                        <tr
                          className={`sales-report-table-row ${canExpand ? "sales-report-row-expandable" : ""} ${isExpanded ? "expanded" : ""}`}
                          onClick={() => canExpand && toggleExpanded(transaction.transactionId)}
                        >
                          <td className="sales-cell-expand">
                            {canExpand ? (
                              <button
                                type="button"
                                className="sales-expand-btn"
                                aria-label={isExpanded ? "Collapse transaction" : "Expand transaction"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(transaction.transactionId);
                                }}
                              >
                                {isExpanded ? "▾" : "▸"}
                              </button>
                            ) : (
                              <span className="sales-expand-placeholder">•</span>
                            )}
                          </td>
                          <td className="sales-cell-date">{formatDate(transaction.saleDate)}</td>
                          <td className="sales-cell-customer">{transaction.customerName}</td>
                          <td className="sales-cell-product">{productSummary(transaction)}</td>
                          <td className="text-center sales-cell-quantity">{transaction.totalQuantity}</td>
                          <td className="text-right sales-cell-amount">{formatAmount(transaction.totalAmount)}</td>
                          <td className={transaction.cashierName ? "sales-cell-cashier" : "sales-cell-cashier sales-cell-cashier-na"}>
                            {transaction.cashierName || "N/A"}
                          </td>
                        </tr>
                        {isExpanded && transaction.items.map((item) => (
                          <tr key={item.id} className="sales-report-item-row">
                            <td></td>
                            <td className="sales-cell-date sales-cell-muted"></td>
                            <td className="sales-cell-customer sales-cell-muted"></td>
                            <td className="sales-cell-product">{item.productName}</td>
                            <td className="text-center sales-cell-quantity">{item.quantity}</td>
                            <td className="text-right sales-cell-amount">{formatAmount(item.amount)}</td>
                            <td></td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagedResult.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagedResult.hasPreviousPage || loading}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <div className="pagination-info">
                {Array.from({ length: Math.min(5, pagedResult.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagedResult.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagedResult.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagedResult.page >= pagedResult.totalPages - 2) {
                    pageNum = pagedResult.totalPages - 4 + i;
                  } else {
                    pageNum = pagedResult.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`pagination-btn ${pagedResult.page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagedResult.totalPages, prev + 1))}
                disabled={!pagedResult.hasNextPage || loading}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const Sales = () => {
  const [activeTab, setActiveTab] = useState<"analytic" | "report">("analytic");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<SalesType[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, error: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ isLoading: true, error: null });
        
        // Fetch all data in parallel
        const [customersData, statsData, salesTransactionsResult] = await Promise.all([
          apiService.getCustomers(),
          apiService.getDashboardStats(),
          apiService.getSalesTransactions(1, 1000).catch(() => ({ data: [], totalCount: 0, page: 1, pageSize: 1000, totalPages: 0, hasPreviousPage: false, hasNextPage: false }))
        ]);

        setCustomers(customersData);
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
      
      <div className="sales-tabs">
        <button
          className={`sales-tab ${activeTab === "analytic" ? "active" : ""}`}
          onClick={() => setActiveTab("analytic")}
        >
          analytic
        </button>
        <button
          className={`sales-tab ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          report
        </button>
      </div>

      {activeTab === "analytic" ? (
        <AnalyticTab customers={customers} dashboardStats={dashboardStats} salesTransactions={salesTransactions} />
      ) : (
        <ReportTab />
      )}
    </div>
  );
};

