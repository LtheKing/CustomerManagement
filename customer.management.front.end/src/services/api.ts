import { 
  DashboardStats, 
  SalesData,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CapitalCashResponse,
  CreateCashFlowRequest,
  CashFlowResponse,
  Expense,
  CreateSalesTransactionRequest,
  SalesTransactionResponse,
  Product,
  Sales,
  PagedResult,
  LoginRequest,
  LoginResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'https://localhost:44372/api' : '');

class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  private async fetchData<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Send cookies automatically
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      // Handle 401 Unauthorized - token expired
      if (response.status === 401 && endpoint !== '/user/login' && endpoint !== '/user/refresh') {
        // Try to refresh token
        await this.refreshAccessToken();
        // Retry original request
        return this.fetchData<T>(endpoint, options);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/refresh`, {
          method: 'POST',
          credentials: 'include', // Send refresh token cookie
        });

        if (!response.ok) {
          // Refresh failed, redirect to login
          localStorage.removeItem("user");
          localStorage.removeItem("isAuthenticated");
          window.location.href = "/login";
          throw new Error("Session expired. Please login again.");
        }
      } catch (error) {
        // If refresh fails, clear auth and redirect
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        window.location.href = "/login";
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Customer endpoints
  async getCustomers(): Promise<CustomerResponse[]> {
    return this.fetchData<CustomerResponse[]>('/customers');
  }

  async getCustomer(id: string): Promise<CustomerResponse> {
    return this.fetchData<CustomerResponse>(`/customers/${id}`);
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerResponse> {
    return this.fetchData<CustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateCustomer(id: string, request: UpdateCustomerRequest): Promise<void> {
    await this.fetchData<void>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.fetchData<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
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

  // Paginated Expense endpoints
  async getExpensesPaged(
    page: number = 1,
    pageSize: number = 20,
    startDate?: string,
    endDate?: string,
    description?: string,
    minAmount?: number,
    maxAmount?: number
  ): Promise<PagedResult<Expense>> {
    try {
      let endpoint = '/Expense';
      const params: string[] = [];
      
      // Add pagination parameters
      params.push(`page=${page}`);
      params.push(`pageSize=${pageSize}`);
      
      // Add filter parameters
      if (startDate) {
        params.push(`startDate=${encodeURIComponent(startDate)}`);
      }
      if (endDate) {
        params.push(`endDate=${encodeURIComponent(endDate)}`);
      }
      if (description) {
        params.push(`description=${encodeURIComponent(description)}`);
      }
      if (minAmount !== undefined) {
        params.push(`minAmount=${minAmount}`);
      }
      if (maxAmount !== undefined) {
        params.push(`maxAmount=${maxAmount}`);
      }
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const result = await this.fetchData<any>(endpoint);
      
      // Convert PascalCase response to camelCase
      return {
        data: (result.Data || result.data || []).map((expense: any) => ({
          id: expense.Id || expense.id,
          description: expense.Description || expense.description,
          amount: expense.Amount || expense.amount,
          expenseDate: expense.ExpenseDate || expense.expenseDate,
        })),
        totalCount: result.TotalCount || result.totalCount || 0,
        page: result.Page || result.page || 1,
        pageSize: result.PageSize || result.pageSize || 20,
        totalPages: result.TotalPages || result.totalPages || 0,
        hasPreviousPage: result.HasPreviousPage ?? result.hasPreviousPage ?? false,
        hasNextPage: result.HasNextPage ?? result.hasNextPage ?? false,
      };
    } catch (error) {
      console.warn('Expenses paginated endpoint not available', error);
      return {
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
  }

  async createExpense(description: string, amount: number, expenseDate?: string): Promise<any> {
    const requestBody: any = {
      Description: description,
      Amount: amount,
    };

    if (expenseDate) {
      requestBody.ExpenseDate = expenseDate;
    }

    const response = await fetch(`${API_BASE_URL}/Expense`, {
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
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return {
      id: result.Id || result.id,
      description: result.Description || result.description,
      amount: result.Amount || result.amount,
      expenseDate: result.ExpenseDate || result.expenseDate,
    };
  }

  // Sales Transaction endpoints
  async getSalesTransactions(
    page: number = 1,
    pageSize: number = 20,
    startDate?: string,
    endDate?: string,
    customerId?: string,
    productId?: string,
    cashierName?: string
  ): Promise<PagedResult<Sales>> {
    try {
      let endpoint = '/Sales';
      const params: string[] = [];
      
      // Add pagination parameters
      params.push(`page=${page}`);
      params.push(`pageSize=${pageSize}`);
      
      // Add filter parameters
      if (startDate) {
        params.push(`startDate=${encodeURIComponent(startDate)}`);
      }
      if (endDate) {
        params.push(`endDate=${encodeURIComponent(endDate)}`);
      }
      if (customerId) {
        params.push(`customerId=${encodeURIComponent(customerId)}`);
      }
      if (productId) {
        params.push(`productId=${encodeURIComponent(productId)}`);
      }
      if (cashierName) {
        params.push(`cashierName=${encodeURIComponent(cashierName)}`);
      }
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const result = await this.fetchData<any>(endpoint);
      
      // Convert PascalCase response to camelCase
      return {
        data: (result.Data || result.data || []).map((sale: any) => ({
          id: sale.Id || sale.id,
          customerId: sale.CustomerId || sale.customerId,
          customerName: sale.CustomerName || sale.customerName,
          productId: sale.ProductId || sale.productId,
          productName: sale.ProductName || sale.productName,
          quantity: sale.Quantity || sale.quantity,
          amount: sale.Amount || sale.amount,
          cashierName: sale.CashierName || sale.cashierName,
          saleDate: sale.SaleDate || sale.saleDate,
          createdBy: sale.CreatedBy || sale.createdBy,
          createdByUsername: sale.CreatedByUsername || sale.createdByUsername,
        })),
        totalCount: result.TotalCount || result.totalCount || 0,
        page: result.Page || result.page || 1,
        pageSize: result.PageSize || result.pageSize || 20,
        totalPages: result.TotalPages || result.totalPages || 0,
        hasPreviousPage: result.HasPreviousPage ?? result.hasPreviousPage ?? false,
        hasNextPage: result.HasNextPage ?? result.hasNextPage ?? false,
      };
    } catch (error) {
      console.warn('Sales transactions endpoint not available', error);
      // Return empty paginated result on error
      return {
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
  }

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
        sku: product.SKU || product.sku || '',
        price: product.Price || product.price,
        stock: product.Stock || product.stock || 0,
        isActive: product.IsActive ?? product.isActive ?? true,
        createdAt: product.CreatedAt || product.createdAt || new Date().toISOString(),
        updatedAt: product.UpdatedAt || product.updatedAt,
      }));
    } catch (error) {
      console.warn('Products endpoint not available', error);
      return [];
    }
  }

  async getProduct(id: string): Promise<Product> {
    const result = await this.fetchData<any>(`/Product/${id}`);
    
    // Convert PascalCase response to camelCase
    return {
      id: result.Id || result.id,
      name: result.Name || result.name,
      sku: result.SKU || result.sku || '',
      price: result.Price || result.price,
      stock: result.Stock || result.stock || 0,
      isActive: result.IsActive ?? result.isActive ?? true,
      createdAt: result.CreatedAt || result.createdAt || new Date().toISOString(),
      updatedAt: result.UpdatedAt || result.updatedAt,
    };
  }

  async createProduct(request: { name: string; sku: string; price: number; stock?: number; isActive?: boolean }): Promise<Product> {
    const requestBody = {
      Name: request.name,
      SKU: request.sku,
      Price: request.price,
      Stock: request.stock ?? 0,
      IsActive: request.isActive ?? true,
    };

    const response = await fetch(`${API_BASE_URL}/Product`, {
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
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return {
      id: result.Id || result.id,
      name: result.Name || result.name,
      sku: result.SKU || result.sku || '',
      price: result.Price || result.price,
      stock: result.Stock || result.stock || 0,
      isActive: result.IsActive ?? result.isActive ?? true,
      createdAt: result.CreatedAt || result.createdAt || new Date().toISOString(),
      updatedAt: result.UpdatedAt || result.updatedAt,
    };
  }

  async updateProduct(id: string, request: { name?: string; sku?: string; price?: number; stock?: number; isActive?: boolean }): Promise<void> {
    const requestBody: any = {};
    if (request.name !== undefined) requestBody.Name = request.name;
    if (request.sku !== undefined) requestBody.SKU = request.sku;
    if (request.price !== undefined) requestBody.Price = request.price;
    if (request.stock !== undefined) requestBody.Stock = request.stock;
    if (request.isActive !== undefined) requestBody.IsActive = request.isActive;

    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
      method: 'PUT',
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
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }
  }

  // User authentication endpoints
  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.fetchData<LoginResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<void> {
    await this.fetchData<void>('/user/logout', {
      method: 'POST',
    });
  }

  // User management endpoints
  async getUsers(): Promise<User[]> {
    try {
      const result = await this.fetchData<any[]>('/user');
      
      // Convert PascalCase response to camelCase
      return result.map((user: any) => ({
        id: user.Id || user.id,
        username: user.Username || user.username,
        email: user.Email || user.email,
        role: user.Role || user.role,
        createdAt: user.CreatedAt || user.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Users endpoint not available', error);
      return [];
    }
  }

  async getUser(id: string): Promise<User> {
    const result = await this.fetchData<any>(`/user/${id}`);
    
    // Convert PascalCase response to camelCase
    return {
      id: result.Id || result.id,
      username: result.Username || result.username,
      email: result.Email || result.email,
      role: result.Role || result.role,
      createdAt: result.CreatedAt || result.createdAt || new Date().toISOString(),
    };
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const requestBody = {
      Username: request.username,
      Email: request.email,
      Password: request.password,
      Role: request.role,
    };

    const result = await this.fetchData<any>('/user', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      id: result.Id || result.id,
      username: result.Username || result.username,
      email: result.Email || result.email,
      role: result.Role || result.role,
      createdAt: result.CreatedAt || result.createdAt || new Date().toISOString(),
    };
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<void> {
    const requestBody: any = {};
    if (request.username !== undefined) requestBody.Username = request.username;
    if (request.email !== undefined) requestBody.Email = request.email;
    if (request.password !== undefined) requestBody.Password = request.password;
    if (request.role !== undefined) requestBody.Role = request.role;

    await this.fetchData<void>(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.fetchData<void>(`/user/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
