# Customer Management System - Architecture & Workflow Documentation

## 📊 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Data Flow & Workflow](#data-flow--workflow)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Technology Stack](#technology-stack)

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (TypeScript + Vite)                      │  │
│  │  - Dashboard UI                                           │  │
│  │  - Customer Management                                    │  │
│  │  - Sales Analytics                                        │  │
│  │  - API Service Layer                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP/HTTPS (REST API)
                        │ CORS Enabled
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (.NET Core 8)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers                                               │  │
│  │  ├── CustomersController                                  │  │
│  │  └── SeedController                                       │  │
│  │                                                            │  │
│  │  Services                                                  │  │
│  │  └── DataSeedingService                                   │  │
│  │                                                            │  │
│  │  Middleware                                               │  │
│  │  ├── CORS                                                 │  │
│  │  ├── Swagger/OpenAPI                                      │  │
│  │  └── HTTPS Redirection                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ Entity Framework Core
                        │ DbContext
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CustomerManagementDbContext                              │  │
│  │  - DbSet<CustomerModelEntity>                             │  │
│  │  - DbSet<SalesModelEntity>                                │  │
│  │  - DbSet<UserModelEntity>                                │  │
│  │  - DbSet<CustomerTrafficModelEntity>                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ SQL Server Connection
                        │ Connection String
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQL Server Database                                      │  │
│  │  - Customers Table                                        │  │
│  │  - Sales Table                                            │  │
│  │  - Users Table                                            │  │
│  │  - CustomerTraffic Table                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   UserModelEntity    │
├──────────────────────┤
│ PK: Id (Guid)        │
│     Username         │
│     Email            │
│     PasswordHash     │
│     Role             │
│     CreatedAt        │
└──────────┬───────────┘
           │
           │ 1 (CreatedBy)
           │
           │
           ├──────────────────────────────┐
           │                              │
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│ CustomerModelEntity  │      │ SalesModelEntity     │
├──────────────────────┤      ├──────────────────────┤
│ PK: Id (Guid)        │      │ PK: Id (Guid)        │
│     Name             │      │ FK: CustomerId       │
│     Email            │◄─────┤     Product          │
│     Phone            │  *   │     Quantity         │
│     Address          │      │     Amount            │
│     Company          │      │     SaleDate          │
│     CreatedAt        │      │ FK: CreatedBy        │
│     UpdatedAt        │      └──────────────────────┘
│ FK: CreatedBy        │
└──────────┬───────────┘
           │
           │ 1
           │
           │
           ▼
┌──────────────────────────────┐
│ CustomerTrafficModelEntity   │
├──────────────────────────────┤
│ PK: Id (Guid)                │
│ FK: CustomerId (nullable)    │
│     Source                    │
│     Campaign                  │
│     VisitDate                 │
│     Page                      │
└──────────────────────────────┘

RELATIONSHIP SUMMARY:
─────────────────────
User (1) ──────< (*) Customer (CreatedBy)
User (1) ──────< (*) Sales (CreatedBy)
Customer (1) ────< (*) Sales (CustomerId)
Customer (1) ────< (*) CustomerTraffic (CustomerId)
```

### Entity Details

#### 1. **UserModelEntity** (Users Table)
- **Purpose**: System users who create/manage customers and sales
- **Key Fields**:
  - `Id`: Primary Key (Guid)
  - `Username`: Unique identifier
  - `Email`: Unique email address
  - `PasswordHash`: BCrypt hashed password
  - `Role`: User role (Admin, SalesManager, SalesRep)
- **Relationships**: 
  - One-to-Many with Customers (CreatedBy)
  - One-to-Many with Sales (CreatedBy)

#### 2. **CustomerModelEntity** (Customers Table)
- **Purpose**: Customer information and contact details
- **Key Fields**:
  - `Id`: Primary Key (Guid)
  - `Name`: Customer name
  - `Email`, `Phone`, `Address`, `Company`: Contact information
  - `CreatedBy`: Foreign Key to User
  - `CreatedAt`, `UpdatedAt`: Timestamps
- **Relationships**:
  - Many-to-One with User (CreatedBy)
  - One-to-Many with Sales
  - One-to-Many with CustomerTraffic

#### 3. **SalesModelEntity** (Sales Table)
- **Purpose**: Sales transactions and order records
- **Key Fields**:
  - `Id`: Primary Key (Guid)
  - `CustomerId`: Foreign Key to Customer
  - `Product`: Product name
  - `Quantity`: Number of items
  - `Amount`: Total sale amount (decimal)
  - `SaleDate`: Transaction date
  - `CreatedBy`: Foreign Key to User
- **Relationships**:
  - Many-to-One with Customer
  - Many-to-One with User (CreatedBy)

#### 4. **CustomerTrafficModelEntity** (CustomerTraffic Table)
- **Purpose**: Track customer website visits and marketing data
- **Key Fields**:
  - `Id`: Primary Key (Guid)
  - `CustomerId`: Foreign Key to Customer (nullable)
  - `Source`: Traffic source (Google, Facebook, etc.)
  - `Campaign`: Marketing campaign name
  - `VisitDate`: Visit timestamp
  - `Page`: Page visited
- **Relationships**:
  - Many-to-One with Customer (nullable - can track anonymous traffic)

---

## 🔄 Data Flow & Workflow

### Application Startup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION STARTUP                        │
└─────────────────────────────────────────────────────────────┘

1. Program.cs Initialization
   │
   ├─► Configure Services
   │   ├─► Add CORS Policy
   │   ├─► Add Controllers
   │   ├─► Add Swagger
   │   ├─► Add DbContext (SQL Server)
   │   └─► Add DataSeedingService
   │
   ├─► Configure Middleware Pipeline
   │   ├─► Swagger (Development)
   │   ├─► CORS
   │   ├─► HTTPS Redirection
   │   └─► Authorization
   │
   └─► Background Task: Data Seeding
       │
       ├─► Retry Logic (10 attempts, 5 sec delay)
       │
       ├─► Test Database Connection
       │
       ├─► Check if Data Exists
       │   └─► If exists: Skip seeding
       │
       └─► Seed Data (if needed)
           ├─► Create Users (4 users)
           ├─► Create Customers (6 customers)
           ├─► Create Sales (2-5 per customer)
           └─► Create Traffic (3-8 per customer)
```

### Frontend to Backend Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND REQUEST WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

User Action (Click/Page Load)
    │
    ▼
React Component (App.tsx)
    │
    ├─► useEffect Hook Triggers
    │
    ▼
API Service (api.ts)
    │
    ├─► fetchData() Method
    │   ├─► Construct URL: API_BASE_URL + endpoint
    │   ├─► HTTP Request (GET/POST/PUT/DELETE)
    │   └─► Handle Response/Error
    │
    ▼
HTTP Request (CORS Headers)
    │
    ├─► Origin: http://localhost:5173
    ├─► Method: GET/POST/PUT/DELETE
    └─► Headers: Content-Type, etc.
    │
    ▼
.NET Core API (Program.cs)
    │
    ├─► CORS Middleware Validates Origin
    │
    ├─► Route Matching
    │   └─► api/customers → CustomersController
    │
    ▼
Controller (CustomersController.cs)
    │
    ├─► Dependency Injection: DbContext
    │
    ├─► Execute Action Method
    │   ├─► GET: Query Database
    │   ├─► POST: Add Entity
    │   ├─► PUT: Update Entity
    │   └─► DELETE: Remove Entity
    │
    ▼
Entity Framework Core
    │
    ├─► LINQ Query Translation
    │
    ├─► SQL Query Generation
    │
    └─► Include Related Entities
        ├─► .Include(c => c.User)
        ├─► .Include(c => c.Sales)
        └─► .Include(c => c.Traffic)
    │
    ▼
SQL Server Database
    │
    ├─► Execute Query
    │
    ├─► Return Results
    │
    └─► Entity Framework Materialization
    │
    ▼
Controller Returns JSON Response
    │
    ├─► Serialize Entities to JSON
    │
    └─► HTTP 200 OK (or error status)
    │
    ▼
Frontend Receives Response
    │
    ├─► Parse JSON
    │
    ├─► Update React State
    │
    └─► Re-render UI Components
```

### Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD DATA PROCESSING                        │
└─────────────────────────────────────────────────────────────┘

Page Load (Overview Tab)
    │
    ▼
useEffect Hook
    │
    ├─► Parallel API Calls
    │   ├─► apiService.getCustomers()
    │   ├─► apiService.getDashboardStats()
    │   └─► apiService.getSalesData()
    │
    ▼
getCustomers()
    │
    └─► GET /api/customers
        └─► Returns: Customer[] with nested Sales, User, Traffic
    │
    ▼
getDashboardStats()
    │
    ├─► Calls getCustomers() internally
    │
    ├─► Calculate Metrics:
    │   ├─► totalCustomers = customers.length
    │   ├─► activeCustomers = filter(has recent sales)
    │   ├─► totalRevenue = sum(all sales.amount)
    │   └─► avgOrderValue = totalRevenue / totalSales
    │
    └─► Returns: DashboardStats object
    │
    ▼
getSalesData()
    │
    ├─► Calls getCustomers() internally
    │
    ├─► Group Sales by Month (Last 6 months)
    │   ├─► Filter sales by month
    │   ├─► Sum amounts per month
    │   └─► Count unique customers per month
    │
    └─► Returns: SalesData[] array
    │
    ▼
React State Updates
    │
    ├─► setCustomers(customersData)
    ├─► setDashboardStats(statsData)
    └─► setSalesData(salesDataResult)
    │
    ▼
UI Components Re-render
    │
    ├─► StatCard Components (4 cards)
    ├─► SimpleChart Component (Bar chart)
    └─► CustomerTable Component (Data table)
```

---

## 🌐 API Endpoints

### CustomersController

```
Base Route: /api/customers

┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER ENDPOINTS                        │
└─────────────────────────────────────────────────────────────┘

GET    /api/customers
       ├─► Returns: Customer[] (with User, Sales, Traffic)
       ├─► Purpose: Get all customers
       └─► Used by: Dashboard Overview, Customers Tab

GET    /api/customers/{id}
       ├─► Returns: Customer (single with relations)
       ├─► Purpose: Get specific customer details
       └─► Used by: Customer detail view

POST   /api/customers
       ├─► Body: CustomerModelEntity
       ├─► Returns: Created Customer (201)
       ├─► Purpose: Create new customer
       └─► Used by: Add customer form

PUT    /api/customers/{id}
       ├─► Body: CustomerModelEntity
       ├─► Returns: NoContent (204)
       ├─► Purpose: Update existing customer
       └─► Used by: Edit customer form

DELETE /api/customers/{id}
       ├─► Returns: NoContent (204)
       ├─► Purpose: Delete customer
       └─► Used by: Delete customer action

┌─────────────────────────────────────────────────────────────┐
│                 CUSTOMER TRAFFIC ENDPOINTS                   │
└─────────────────────────────────────────────────────────────┘

GET    /api/customers/traffic
       ├─► Returns: CustomerTraffic[] (with Customer)
       └─► Purpose: Get all traffic records

GET    /api/customers/traffic/{id}
       ├─► Returns: CustomerTraffic (single)
       └─► Purpose: Get specific traffic record

POST   /api/customers/traffic
       ├─► Body: CustomerTrafficModelEntity
       └─► Purpose: Create traffic record

PUT    /api/customers/traffic/{id}
       └─► Purpose: Update traffic record

DELETE /api/customers/traffic/{id}
       └─► Purpose: Delete traffic record
```

### SeedController

```
Base Route: /api/seed

GET    /api/seed/test
       ├─► Returns: { message, canConnect, timestamp }
       └─► Purpose: Test database connection

POST   /api/seed
       ├─► Returns: { message: "Data seeded successfully!" }
       ├─► Purpose: Seed sample data (if not exists)
       └─► Used by: Frontend "Seed Data" button

POST   /api/seed/force
       ├─► Returns: { message: "Data force reseeded successfully!" }
       ├─► Purpose: Clear and reseed all data
       └─► Used by: Force reseed operation
```

---

## 🎨 Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND COMPONENT TREE                      │
└─────────────────────────────────────────────────────────────┘

App.tsx (Root Component)
│
├─► State Management
│   ├─► activeTab: "home" | "sales" | "customers"
│   ├─► customers: Customer[]
│   ├─► dashboardStats: DashboardStats
│   ├─► salesData: SalesData[]
│   └─► loading: LoadingState
│
├─► Sidebar Component
│   ├─► Navigation Items
│   │   ├─► Overview (home)
│   │   ├─► Sales
│   │   ├─► Customers
│   │   └─► Analytics
│   └─► Seed Data Button
│
└─► Content Panel (Conditional Rendering)
    │
    ├─► Loading State
    │   └─► Loading Spinner
    │
    ├─► Error State
    │   └─► Error Message + Retry Button
    │
    ├─► Overview Tab (activeTab === "home")
    │   ├─► Dashboard Header
    │   ├─► Stats Grid
    │   │   └─► StatCard × 4
    │   │       ├─► Total Revenue
    │   │       ├─► Total Customers
    │   │       ├─► Active Customers
    │   │       └─► Avg Order Value
    │   └─► Dashboard Grid
    │       ├─► Chart Section
    │       │   └─► SimpleChart (Sales Trend)
    │       └─► Table Section
    │           └─► CustomerTable
    │
    ├─► Sales Tab (activeTab === "sales")
    │   ├─► Dashboard Header
    │   └─► Sales Grid
    │       ├─► Sales Chart
    │       │   └─► SimpleChart (Monthly Performance)
    │       └─► Customer Insights
    │           └─► Insight Cards × 3
    │               ├─► Top Customer
    │               ├─► Total Orders
    │               └─► Active Rate
    │
    └─► Customers Tab (activeTab === "customers")
        ├─► Dashboard Header
        └─► Customers Section
            └─► CustomerTable (Full List)

┌─────────────────────────────────────────────────────────────┐
│                    REUSABLE COMPONENTS                        │
└─────────────────────────────────────────────────────────────┘

StatCard
├─► Props: title, value, change, icon
└─► Displays: Metric card with icon and value

SimpleChart
├─► Props: data (SalesData[]), title
└─► Displays: Bar chart visualization

CustomerTable
├─► Props: customers (Customer[])
├─► Functions:
│   ├─► getCustomerStatus() - Active/Inactive/No Orders
│   ├─► getLastOrderDate() - Format date
│   └─► getTotalSpent() - Calculate total
└─► Displays: HTML table with customer data
```

---

## 🛠️ Technology Stack

### Backend
- **.NET Core 8.0**: Web API framework
- **Entity Framework Core**: ORM for database operations
- **SQL Server**: Relational database
- **Swagger/OpenAPI**: API documentation
- **BCrypt.Net**: Password hashing

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **CSS3**: Styling with modern features

### Data Flow Technologies
- **REST API**: HTTP-based communication
- **JSON**: Data serialization format
- **CORS**: Cross-origin resource sharing
- **LINQ**: Query language for EF Core

---

## 📝 Key Workflows

### 1. Customer Creation Workflow
```
User Input → Frontend Form → POST /api/customers
    → Controller → DbContext → SQL INSERT
    → Return Created Customer → Frontend Update
```

### 2. Dashboard Loading Workflow
```
Page Load → useEffect → Parallel API Calls
    → GET /api/customers → Process Data
    → Calculate Stats → Update State → Render UI
```

### 3. Data Seeding Workflow
```
App Startup → Background Task → Test Connection
    → Check Existing Data → Create Users
    → Create Customers → Create Sales → Create Traffic
    → Save Changes → Log Success
```

### 4. Sales Analytics Workflow
```
Sales Tab → Fetch Customers → Group by Month
    → Calculate Totals → Generate Chart Data
    → Find Top Customer → Calculate Metrics
    → Display Charts and Insights
```

---

## 🔐 Security & Configuration

- **CORS**: Configured for specific origins
- **HTTPS**: Enabled in production
- **Password Hashing**: BCrypt with salt
- **SQL Injection**: Prevented by EF Core parameterization
- **Connection String**: Stored in appsettings.json

---

## 📊 Database Schema Summary

```
Tables:
├── Users (4 columns + PK)
├── Customers (9 columns + PK + FK)
├── Sales (7 columns + PK + 2 FKs)
└── CustomerTraffic (6 columns + PK + FK)

Indexes:
├── Users.Username (Unique)
├── Users.Email (Unique)
└── Default indexes on PKs

Constraints:
├── Foreign Keys with Restrict/SetNull delete behavior
└── Default values for IDs and timestamps
```

---

This architecture provides a complete, scalable customer management system with clear separation of concerns, proper data relationships, and a modern frontend-backend integration.

