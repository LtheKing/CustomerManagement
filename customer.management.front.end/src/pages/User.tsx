import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { User } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";
import "../assets/page-styles/Product.css";
import "../assets/page-styles/User.css";

export const UserPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Filter states
  const [usernameFilter, setUsernameFilter] = useState<string>("");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await apiService.getUsers();
      setUsers(result);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFilter = () => {
    // Filters are applied in the filteredUsers calculation
  };

  const handleClearFilters = () => {
    setUsernameFilter("");
    setEmailFilter("");
    setRoleFilter("");
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleExportToExcel = () => {
    if (filteredUsers.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const exportData = filteredUsers.map(user => ({
        "Username": user.username,
        "Email": user.email,
        "Role": user.role,
        "Created At": formatDate(user.createdAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `User_Report_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const filteredUsers = users.filter(user => {
    if (usernameFilter && !user.username.toLowerCase().includes(usernameFilter.toLowerCase())) {
      return false;
    }
    if (emailFilter && !user.email.toLowerCase().includes(emailFilter.toLowerCase())) {
      return false;
    }
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }
    return true;
  });

  const getUserFormFields = (isEdit: boolean): FormField[] => {
    return [
      {
        name: "username",
        label: "Username",
        type: "text",
        required: true,
        placeholder: "Enter username",
        disabled: isEdit, // Username cannot be changed after creation
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "Enter email address",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: !isEdit, // Password is required only for new users
        placeholder: isEdit ? "Leave blank to keep current password" : "Enter password (min 6 characters)",
        validation: (value) => {
          if (!isEdit && (!value || value.trim() === "")) {
            return "Password is required";
          }
          if (value && value.length < 6) {
            return "Password must be at least 6 characters long";
          }
          return null;
        },
      },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { value: "Admin", label: "Admin" },
          { value: "SalesManager", label: "Sales Manager" },
          { value: "SalesRep", label: "Sales Rep" },
        ],
      },
    ];
  };

  const handleUserSubmit = async (formData: Record<string, any>): Promise<void> => {
    const username = formData.username as string;
    const email = formData.email as string;
    const password = formData.password as string;
    const role = formData.role as string;

    if (!username || !username.trim()) {
      throw new Error("Username is required");
    }

    if (!email || !email.trim()) {
      throw new Error("Email is required");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    if (!role || !role.trim()) {
      throw new Error("Role is required");
    }

    // Validate role
    const validRoles = ["Admin", "SalesManager", "SalesRep"];
    if (!validRoles.includes(role)) {
      throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
    }

    if (editingUser) {
      // Update existing user
      const updateData: any = {
        email: email.trim(),
        role: role.trim(),
      };
      
      // Only include password if it was provided
      if (password && password.trim() !== "") {
        updateData.password = password.trim();
      }

      await apiService.updateUser(editingUser.id, updateData);
    } else {
      // Create new user
      if (!password || password.trim() === "") {
        throw new Error("Password is required for new users");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      await apiService.createUser({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role.trim(),
      });
    }
  };

  const handleUserSuccess = () => {
    setEditingUser(null);
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await apiService.deleteUser(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : "Failed to delete user. Please try again.");
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <p>View and manage all system users.</p>
      </div>
      
      <div className="sales-report-container">
        <div className="expense-actions-row">
          <button 
            className="new-expense-btn" 
            onClick={handleCreate}
          >
            new user
          </button>
        </div>
        <div className="sales-report-filters">
          <div className="filter-group">
            <label htmlFor="usernameFilter">Username</label>
            <input
              type="text"
              id="usernameFilter"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              placeholder="Search username..."
            />
          </div>
          <div className="filter-group">
            <label htmlFor="emailFilter">Email</label>
            <input
              type="text"
              id="emailFilter"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Search email..."
            />
          </div>
          <div className="filter-group">
            <label htmlFor="roleFilter">Role</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="SalesManager">Sales Manager</option>
              <option value="SalesRep">Sales Rep</option>
            </select>
          </div>
          <button onClick={handleFilter} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button onClick={handleRefresh} disabled={loading} className="refresh-btn" title="Refresh data">
            🔄 Refresh
          </button>
          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
          <button 
            onClick={handleExportToExcel} 
            disabled={filteredUsers.length === 0}
            className="export-excel-btn"
          >
            📊 Export to Excel
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="product-info-bar">
              <div className="product-info-content">
                <span className="product-info-icon">👤</span>
                <span>Showing <strong className="product-info-strong">{filteredUsers.length}</strong> of <strong className="product-info-strong">{users.length}</strong> users</span>
              </div>
              {filteredUsers.length !== users.length && (
                <div className="product-filter-indicator">
                  <span>🔍</span>
                  <span>Filters applied</span>
                </div>
              )}
            </div>
            <div className="product-table-container">
              <table className="sales-report-table product-table">
                <thead>
                  <tr>
                    <th className="user-col-username">Username</th>
                    <th className="user-col-email">Email</th>
                    <th className="user-col-role">Role</th>
                    <th className="user-col-created">Created At</th>
                    <th className="user-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="product-empty-state">
                        <div className="product-empty-state-content">
                          <span className="product-empty-state-icon">👤</span>
                          <span>No users found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="product-table-row">
                        <td className="user-cell-username">{user.username}</td>
                        <td className="user-cell-email">{user.email}</td>
                        <td>
                          <span className={`user-role-badge ${
                            user.role === "Admin" 
                              ? 'user-role-badge-admin' 
                              : user.role === "SalesManager"
                              ? 'user-role-badge-sales-manager'
                              : 'user-role-badge-sales-rep'
                          }`}>
                            {user.role === "Admin" ? "👑 " : user.role === "SalesManager" ? "💼 " : "👔 "}{user.role}
                          </span>
                        </td>
                        <td className="user-cell-created">{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="product-actions-container">
                            <button
                              onClick={() => handleEdit(user)}
                              className="product-btn product-btn-edit"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="product-btn product-btn-delete"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <GenericForm
        title={editingUser ? "Edit User" : "Create New User"}
        fields={getUserFormFields(!!editingUser)}
        mode={editingUser ? "edit" : "create"}
        initialValues={editingUser ? {
          username: editingUser.username,
          email: editingUser.email,
          password: "",
          role: editingUser.role,
        } : {
          username: "",
          email: "",
          password: "",
          role: "SalesRep",
        }}
        onSubmit={handleUserSubmit}
        onSuccess={handleUserSuccess}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        isOpen={isFormOpen}
        submitLabel={editingUser ? "Update User" : "Create User"}
      />
    </div>
  );
};

