# Customer Management Dashboard

A modern React dashboard for managing customers, sales, and business analytics.

## Features

- **Real-time Dashboard**: Overview with key business metrics
- **Sales Analytics**: Detailed sales performance and trends
- **Customer Management**: View and manage customer data
- **API Integration**: Connected to .NET Core backend
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Proper loading and error handling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- .NET Core 8.0
- SQL Server

### Backend Setup

1. Navigate to the API project:

   ```bash
   cd customer.management.api
   ```

2. Update the connection string in `appsettings.json` to point to your SQL Server instance

3. Run the backend:

   ```bash
   dotnet run
   ```

   The API will be available at `https://localhost:44372` (HTTPS) or `http://localhost:5094` (HTTP)

### Frontend Setup

1. Navigate to the frontend project:

   ```bash
   cd customer.management.front.end
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The dashboard will be available at `http://localhost:5173`

## API Endpoints

The frontend connects to these backend endpoints:

- `GET /api/customers` - Get all customers
- `GET /api/customers/{id}` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer
- `POST /api/seed` - Seed sample data
- `GET /api/seed/test` - Test database connection

## Dashboard Features

### Overview Tab

- Total Revenue, Customers, Active Customers, Average Order Value
- Sales trend chart (last 6 months)
- Recent customers table

### Sales Tab

- Monthly sales performance chart
- Customer insights (top customer, total orders, active rate)

### Customers Tab

- Full customer management table
- Customer status based on recent activity
- Total spending per customer

## Data Seeding

Click the "🌱 Seed Data" button in the sidebar to populate the database with sample data. This will create:

- Sample customers
- Sales records
- User accounts
- Traffic data

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: .NET Core 8, Entity Framework Core
- **Database**: SQL Server
- **Styling**: CSS3 with modern design patterns

## Development

The project uses:

- TypeScript for type safety
- Modern React hooks (useState, useEffect)
- Async/await for API calls
- Responsive CSS Grid and Flexbox
- Error boundaries and loading states

## Troubleshooting

### CORS Issues

If you encounter CORS errors when the frontend tries to connect to the backend:

1. **Check API URL**: Ensure the frontend is pointing to the correct backend URL

   - Update `API_BASE_URL` in `src/services/api.ts` if needed
   - Default: `https://localhost:44372/api` (HTTPS) or `http://localhost:5094/api` (HTTP)

2. **Restart Backend**: After making CORS changes, restart your .NET Core backend:

   ```bash
   cd customer.management.api
   dotnet run
   ```

3. **Check Browser Console**: Look for specific CORS error messages

### Database Connection Issues

1. **Update Connection String**: Ensure your SQL Server connection string in `appsettings.json` is correct
2. **Test Connection**: Use the "🌱 Seed Data" button to test database connectivity
3. **Check SQL Server**: Ensure SQL Server is running and accessible

### Common Issues

- **Port Conflicts**: If ports 44372 or 5094 are in use, .NET will automatically assign different ports
- **SSL Certificate**: For HTTPS, you may need to trust the development certificate
- **Firewall**: Ensure your firewall allows connections on the API ports
