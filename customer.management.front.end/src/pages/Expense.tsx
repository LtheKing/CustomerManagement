import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { PagedResult } from "../types";
import type { Expense as ExpenseType } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";

export const Expense = () => {
  const [pagedResult, setPagedResult] = useState<PagedResult<ExpenseType>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  // Cache management
  const [pageCache, setPageCache] = useState<Map<string, PagedResult<ExpenseType>>>(new Map());
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(Date.now());
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

  const getCacheKey = (page: number): string => {
    return `${page}-${pageSize}-${startDate}-${endDate}-${description}-${minAmount}-${maxAmount}`;
  };

  const isCacheValid = (): boolean => {
    return (Date.now() - cacheTimestamp) < CACHE_EXPIRY_MS;
  };

  const clearCache = () => {
    setPageCache(new Map());
    setCacheTimestamp(Date.now());
  };

  const fetchExpenses = async (page: number = currentPage, forceRefresh: boolean = false) => {
    try {
      const cacheKey = getCacheKey(page);
      
      if (!forceRefresh && isCacheValid()) {
        const cached = pageCache.get(cacheKey);
        if (cached) {
          setPagedResult(cached);
          return;
        }
      }

      setLoading(true);
      const result = await apiService.getExpensesPaged(
        page,
        pageSize,
        startDate || undefined,
        endDate || undefined,
        description || undefined,
        minAmount ? Number(minAmount) : undefined,
        maxAmount ? Number(maxAmount) : undefined
      );
      
      setPageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, result);
        return newCache;
      });
      setCacheTimestamp(Date.now());
      
      setPagedResult(result);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    clearCache();
    fetchExpenses(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, description, minAmount, maxAmount, pageSize]);

  useEffect(() => {
    fetchExpenses(currentPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleFilter = () => {
    setCurrentPage(1);
    clearCache();
    fetchExpenses(1, true);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setDescription("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleRefresh = () => {
    clearCache();
    fetchExpenses(currentPage, true);
  };

  const handleExportToExcel = async () => {
    if (pagedResult.data.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const allData: ExpenseType[] = [];
      let currentPageNum = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await apiService.getExpensesPaged(
          currentPageNum,
          1000,
          startDate || undefined,
          endDate || undefined,
          description || undefined,
          minAmount ? Number(minAmount) : undefined,
          maxAmount ? Number(maxAmount) : undefined
        );
        
        allData.push(...result.data);
        hasMore = result.hasNextPage;
        currentPageNum++;
      }

      const exportData = allData.map(expense => ({
        "Date": formatDate(expense.expenseDate),
        "Description": expense.description,
        "Amount": expense.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Report");

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Expense_Report_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Backend returns DateTimeOffset as ISO string (UTC)
      // new Date() parses it and converts to local timezone automatically
      // toLocaleDateString() formats it in user's local timezone
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short' // Optional: shows timezone abbreviation
      });
    } catch {
      return dateString;
    }
  };

  const getExpenseFormFields = (): FormField[] => {
    return [
      {
        name: "description",
        label: "Description",
        type: "text",
        required: true,
        placeholder: "Enter expense description",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
        min: 0.01,
        step: 0.01,
      },
      {
        name: "expenseDate",
        label: "Expense Date",
        type: "date",
        required: false,
      },
    ];
  };

  const handleExpenseSubmit = async (formData: Record<string, any>): Promise<void> => {
    const description = formData.description as string;
    const amount = Number(formData.amount);
    
    // TIMEZONE HANDLING STRATEGY:
    // 1. User selects a date (YYYY-MM-DD) - this is a date-only input
    // 2. We use the current LOCAL time (hours, minutes, seconds) from user's device
    // 3. Combine selected date + current local time = local datetime
    // 4. Convert to UTC (ISO string) for storage in database
    // 5. Backend stores as DateTimeOffset in UTC
    // 6. When displaying, browser automatically converts UTC back to local timezone
    let expenseDate: string | undefined = undefined;
    if (formData.expenseDate) {
      // Parse the date string (YYYY-MM-DD format from date input)
      const dateParts = formData.expenseDate.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JavaScript
        const day = parseInt(dateParts[2], 10);
        
        // Get current local time from user's device
        const now = new Date();
        const localHours = now.getHours();
        const localMinutes = now.getMinutes();
        const localSeconds = now.getSeconds();
        
        // Create date object with selected date + current local time
        // This creates a date in the user's local timezone
        const localDate = new Date(year, month, day, localHours, localMinutes, localSeconds);
        
        // Convert to ISO string (UTC) - this is what backend expects
        // toISOString() automatically converts local time to UTC
        if (!isNaN(localDate.getTime())) {
          expenseDate = localDate.toISOString();
        }
      }
    }

    if (!description || !description.trim()) {
      throw new Error("Description is required");
    }

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    await apiService.createExpense(description.trim(), amount, expenseDate);
  };

  const handleExpenseSuccess = () => {
    clearCache();
    fetchExpenses(currentPage, true);
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Expense Management</h1>
        <p>View and manage all business expenses.</p>
      </div>
      
      <div className="sales-report-container">
        <div className="expense-actions-row">
          <button 
            className="new-expense-btn" 
            onClick={() => setIsFormOpen(true)}
          >
            new expense
          </button>
        </div>
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
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Search description..."
            />
          </div>
          <div className="filter-group">
            <label htmlFor="minAmount">Min Amount</label>
            <input
              type="number"
              id="minAmount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxAmount">Max Amount</label>
            <input
              type="number"
              id="maxAmount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
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
            <p>Loading expenses...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Showing {pagedResult.data.length} of {pagedResult.totalCount} expenses
                {pagedResult.totalPages > 1 && ` (Page ${pagedResult.page} of ${pagedResult.totalPages})`}
              </div>
              {!isCacheValid() && (
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                  Cache expired - data will refresh on next navigation
                </div>
              )}
            </div>
            <table className="sales-report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pagedResult.data.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  pagedResult.data.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td>{expense.description}</td>
                      <td className="text-right">${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
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

      <GenericForm
        title="Create New Expense"
        fields={getExpenseFormFields()}
        mode="create"
        initialValues={{
          expenseDate: new Date().toISOString().split('T')[0],
        }}
        onSubmit={handleExpenseSubmit}
        onSuccess={handleExpenseSuccess}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
        submitLabel="Create Expense"
      />
    </div>
  );
};

