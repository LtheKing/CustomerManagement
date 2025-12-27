import { 
  DashboardStats, 
  SalesData,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CapitalCashResponse,
  CreateCashFlowRequest,
  CashFlowResponse,
  SeedDataResponse,
  TestConnectionResponse,
  Expense,
  CreateSalesTransactionRequest,
  SalesTransactionResponse,
  Customer,
  Product
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'https://localhost:44372/api' : '');

class ApiService {
  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Customer endpoints
  async getCustomers(): Promise<CustomerResponse[]> {
    return this.fetchData<CustomerResponse[]>('/customers');
  }

  async getCustomer(id: string): Promise<CustomerResponse> {
    return this.fetchData<CustomerResponse>(`/customers/${id}`);
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerResponse> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async updateCustomer(id: string, request: UpdateCustomerRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Dashboard data processing
  async getDashboardStats(): Promise<DashboardStats> {
    const customers = await this.getCustomers();
    
    // Calculate stats from customer data
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => 
      c.sales && c.sales.length > 0 && 
      new Date(c.sales[c.sales.length - 1]?.saleDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const totalRevenue = customers.reduce((sum, customer) => 
      sum + customer.sales.reduce((customerSum, sale) => customerSum + sale.amount, 0), 0
    );
    
    const totalSales = customers.reduce((sum, customer) => sum + customer.sales.length, 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue,
      totalCustomers,
      activeCustomers,
      avgOrderValue
    };
  }

  async getSalesData(): Promise<SalesData[]> {
    const customers = await this.getCustomers();
    
    // Group sales by month for the last 6 months
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    return last6Months.map(date => {
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthSales = customers.reduce((sum, customer) => {
        const customerMonthSales = customer.sales.filter(sale => 
          sale.saleDate.startsWith(monthKey)
        );
        return sum + customerMonthSales.reduce((saleSum, sale) => saleSum + sale.amount, 0);
      }, 0);

      const monthCustomers = customers.filter(customer => 
        customer.sales.some(sale => sale.saleDate.startsWith(monthKey))
      ).length;

      return {
        month: monthName,
        sales: monthSales,
        customers: monthCustomers
      };
    });
  }

  // Seed data endpoint
  async seedData(): Promise<SeedDataResponse> {
    const response = await fetch(`${API_BASE_URL}/seed`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async testConnection(): Promise<TestConnectionResponse> {
    return this.fetchData<TestConnectionResponse>('/seed/test');
  }

  // Capital Cash endpoints (now using CashFlowController)
  async getCapitalCash(): Promise<CapitalCashResponse> {
    try {
      // Use /latest endpoint to get the most recent capital cash record
      const result = await this.fetchData<any>('/CashFlow/latest');
      
      // Handle null or undefined result
      if (!result) {
        console.warn('Capital Cash endpoint returned null/undefined, returning default');
        return { id: '', balance: 0, updatedAt: new Date().toISOString() };
      }
      
      // Handle both camelCase and PascalCase responses (ASP.NET Core may return either)
      return {
        id: result.id || result.Id || '',
        balance: typeof (result.balance ?? result.Balance) === 'number' 
          ? (result.balance ?? result.Balance) 
          : 0,
        updatedAt: result.updatedAt || result.UpdatedAt || new Date().toISOString(),
      };
    } catch (error) {
      // If endpoint doesn't exist yet, return default
      console.warn('Capital Cash endpoint not available, returning default', error);
      return { id: '', balance: 0, updatedAt: new Date().toISOString() };
    }
  }

  // Note: Balance update methods removed - balance is now calculated from CashFlow
  // Balance cannot be manually updated. It is automatically calculated from CashFlow entries.

  // CashFlow endpoints
  async createCashFlow(request: CreateCashFlowRequest): Promise<CashFlowResponse> {
    // Convert camelCase to PascalCase to match backend model
    const requestBody = {
      FlowType: request.flowType,
      ReferenceId: request.referenceId,
      Amount: request.amount,
      Info: request.info || "",
      FlowDate: request.flowDate,
    };

    const response = await fetch(`${API_BASE_URL}/CashFlow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Convert PascalCase response back to camelCase
    return {
      id: result.Id || result.id,
      flowType: result.FlowType || result.flowType,
      referenceId: result.ReferenceId !== undefined ? result.ReferenceId : (result.referenceId !== undefined ? result.referenceId : null),
      amount: result.Amount || result.amount,
      info: result.Info || result.info || "",
      flowDate: result.FlowDate || result.flowDate,
    };
  }

  // Expense endpoints
  async getExpenses(): Promise<Expense[]> {
    try {
      return this.fetchData<Expense[]>('/expenses');
    } catch (error) {
      console.warn('Expenses endpoint not available');
      return [];
    }
  }

  // Sales Transaction endpoints
  async createSalesTransaction(request: CreateSalesTransactionRequest): Promise<SalesTransactionResponse> {
    // Convert camelCase to PascalCase to match backend model
    // Support hybrid approach: CustomerId OR CustomerName
    const requestBody: any = {
      ProductId: request.productId,
      Quantity: request.quantity,
      Amount: request.amount,
      CashierName: request.cashierName || "",
      CreatedBy: request.createdBy,
    };

    // Add CustomerId if provided, otherwise add CustomerName
    if (request.customerId) {
      requestBody.CustomerId = request.customerId;
    } else if (request.customerName) {
      requestBody.CustomerName = request.customerName;
    }

    // Add SaleDate if provided
    if (request.saleDate) {
      requestBody.SaleDate = request.saleDate;
    }

    const response = await fetch(`${API_BASE_URL}/Sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // If not JSON, use the text as error message
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Convert PascalCase response back to camelCase
    return {
      id: result.Id || result.id,
      customerId: result.CustomerId || result.customerId,
      productId: result.ProductId || result.productId,
      quantity: result.Quantity || result.quantity,
      amount: result.Amount || result.amount,
      cashierName: result.CashierName || result.cashierName,
      saleDate: result.SaleDate || result.saleDate,
      createdBy: result.CreatedBy || result.createdBy,
    };
  }

  // Product endpoints
  async getProducts(activeOnly: boolean = false): Promise<Product[]> {
    try {
      const endpoint = activeOnly ? '/Product?activeOnly=true' : '/Product';
      const result = await this.fetchData<any[]>(endpoint);
      
      // Convert PascalCase response to camelCase
      return result.map((product: any) => ({
        id: product.Id || product.id,
        name: product.Name || product.name,
        price: product.Price || product.price,
      }));
    } catch (error) {
      console.warn('Products endpoint not available', error);
      return [];
    }
  }
}

export const apiService = new ApiService();
