import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { GenericForm, FormField } from "../components/GenericForm";
import { apiService } from "../services/api";
import { User, UserActivity, PagedResult } from "../types";
import "../assets/page-styles/Dashboard.css";
import "../assets/page-styles/Sales.css";
import "../assets/page-styles/Expense.css";
import "../assets/page-styles/Product.css";
import "../assets/page-styles/User.css";

const ACTIVITY_ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "ADD_STOCK", label: "Add Stock" },
  { value: "CREATE_EXPENSE", label: "Create Expense" },
  { value: "UPDATE_EXPENSE", label: "Update Expense" },
  { value: "DELETE_EXPENSE", label: "Delete Expense" },
  { value: "ADJUST_CAPITAL_IN", label: "Adjust Capital In" },
  { value: "ADJUST_CAPITAL_OUT", label: "Adjust Capital Out" },
];

export const UserPage = () => {
  const [pageTab, setPageTab] = useState<"users" | "activity">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [usernameFilter, setUsernameFilter] = useState<string>("");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalCount, setActivityTotalCount] = useState(0);
  const [activityUsername, setActivityUsername] = useState("");
  const [activityAction, setActivityAction] = useState("");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await apiService.getUsers();
      setUsers(result);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (page = activityPage) => {
    try {
      setActivityLoading(true);
      const result: PagedResult<UserActivity> = await apiService.getUserActivities({
        page,
        pageSize: 20,
        username: activityUsername || undefined,
        action: activityAction || undefined,
        startDate: activityStartDate || undefined,
        endDate: activityEndDate || undefined,
      });
      setActivities(result.data);
      setActivityPage(result.page);
      setActivityTotalPages(result.totalPages || 1);
      setActivityTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching user activities:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (pageTab === "activity") {
      fetchActivities(1);
    }
  }, [pageTab]);

  const handleClearFilters = () => {
    setUsernameFilter("");
    setEmailFilter("");
    setRoleFilter("");
  };

  const handleExportToExcel = () => {
    if (filteredUsers.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const exportData = filteredUsers.map((user) => ({
        Username: user.username,
        Email: user.email,
        Role: user.role,
        "Created At": formatDate(user.createdAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `User_Report_${dateStr}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatActionLabel = (action: string) =>
    ACTIVITY_ACTIONS.find((item) => item.value === action)?.label || action.replace(/_/g, " ");

  const filteredUsers = users.filter((user) => {
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

  const getUserFormFields = (isEdit: boolean): FormField[] => [
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      placeholder: "Enter username",
      disabled: isEdit,
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
      required: !isEdit,
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

  const handleUserSubmit = async (formData: Record<string, any>): Promise<void> => {
    const username = formData.username as string;
    const email = formData.email as string;
    const password = formData.password as string;
    const role = formData.role as string;

    if (!username?.trim()) throw new Error("Username is required");
    if (!email?.trim()) throw new Error("Email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    const validRoles = ["Admin", "SalesManager", "SalesRep"];
    if (!role?.trim() || !validRoles.includes(role)) {
      throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
    }

    if (editingUser) {
      const updateData: any = {
        email: email.trim(),
        role: role.trim(),
      };
      if (password?.trim()) {
        updateData.password = password.trim();
      }
      await apiService.updateUser(editingUser.id, updateData);
    } else {
      if (!password?.trim()) throw new Error("Password is required for new users");
      if (password.length < 6) throw new Error("Password must be at least 6 characters long");

      await apiService.createUser({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role.trim(),
      });
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await apiService.deleteUser(user.id);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <p>View and manage all system users.</p>
      </div>

      <div className="sales-tabs">
        <button
          type="button"
          className={`sales-tab ${pageTab === "users" ? "active" : ""}`}
          onClick={() => setPageTab("users")}
        >
          Users
        </button>
        <button
          type="button"
          className={`sales-tab ${pageTab === "activity" ? "active" : ""}`}
          onClick={() => setPageTab("activity")}
        >
          User Activity
        </button>
      </div>

      {pageTab === "users" ? (
        <div className="sales-report-container">
          <div className="expense-actions-row">
            <button
              className="new-expense-btn"
              onClick={() => {
                setEditingUser(null);
                setIsFormOpen(true);
              }}
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
              <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="SalesManager">Sales Manager</option>
                <option value="SalesRep">Sales Rep</option>
              </select>
            </div>
            <button onClick={() => undefined} disabled={loading}>
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button onClick={fetchUsers} disabled={loading} className="refresh-btn" title="Refresh data">
              🔄 Refresh
            </button>
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
            <button onClick={handleExportToExcel} disabled={filteredUsers.length === 0} className="export-excel-btn">
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
                  <span>
                    Showing <strong className="product-info-strong">{filteredUsers.length}</strong> of{" "}
                    <strong className="product-info-strong">{users.length}</strong> users
                  </span>
                </div>
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
                            <span
                              className={`user-role-badge ${
                                user.role === "Admin"
                                  ? "user-role-badge-admin"
                                  : user.role === "SalesManager"
                                    ? "user-role-badge-sales-manager"
                                    : "user-role-badge-sales-rep"
                              }`}
                            >
                              {user.role === "Admin" ? "👑 " : user.role === "SalesManager" ? "💼 " : "👔 "}
                              {user.role}
                            </span>
                          </td>
                          <td className="user-cell-created">{formatDate(user.createdAt)}</td>
                          <td>
                            <div className="product-actions-container">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsFormOpen(true);
                                }}
                                className="product-btn product-btn-edit"
                              >
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDelete(user)} className="product-btn product-btn-delete">
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
      ) : (
        <div className="sales-report-container">
          <div className="sales-report-filters">
            <div className="filter-group">
              <label htmlFor="activityUsername">Username</label>
              <input
                type="text"
                id="activityUsername"
                value={activityUsername}
                onChange={(e) => setActivityUsername(e.target.value)}
                placeholder="Search username..."
              />
            </div>
            <div className="filter-group">
              <label htmlFor="activityAction">Action</label>
              <select id="activityAction" value={activityAction} onChange={(e) => setActivityAction(e.target.value)}>
                {ACTIVITY_ACTIONS.map((action) => (
                  <option key={action.value || "all"} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="activityStartDate">Start Date</label>
              <input
                type="date"
                id="activityStartDate"
                value={activityStartDate}
                onChange={(e) => setActivityStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="activityEndDate">End Date</label>
              <input
                type="date"
                id="activityEndDate"
                value={activityEndDate}
                onChange={(e) => setActivityEndDate(e.target.value)}
              />
            </div>
            <button onClick={() => fetchActivities(1)} disabled={activityLoading}>
              {activityLoading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              onClick={() => {
                setActivityUsername("");
                setActivityAction("");
                setActivityStartDate("");
                setActivityEndDate("");
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
            <button onClick={() => fetchActivities(activityPage)} disabled={activityLoading} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>

          {activityLoading ? (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>Loading activity...</p>
            </div>
          ) : (
            <>
              <div className="product-info-bar">
                <div className="product-info-content">
                  <span className="product-info-icon">📋</span>
                  <span>
                    Showing <strong className="product-info-strong">{activities.length}</strong> of{" "}
                    <strong className="product-info-strong">{activityTotalCount}</strong> activities
                  </span>
                </div>
              </div>
              <div className="product-table-container">
                <table className="sales-report-table product-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="product-empty-state">
                          <div className="product-empty-state-content">
                            <span className="product-empty-state-icon">📋</span>
                            <span>No user activity found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity) => (
                        <tr key={activity.id} className="product-table-row">
                          <td>{formatDate(activity.createdAt)}</td>
                          <td>{activity.username}</td>
                          <td>{formatActionLabel(activity.action)}</td>
                          <td>{activity.entityType}</td>
                          <td>{activity.details || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {activityTotalPages > 1 && (
                <div className="expense-actions-row" style={{ marginTop: "1rem", gap: "0.75rem" }}>
                  <button
                    type="button"
                    disabled={activityPage <= 1 || activityLoading}
                    onClick={() => fetchActivities(activityPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {activityPage} of {activityTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={activityPage >= activityTotalPages || activityLoading}
                    onClick={() => fetchActivities(activityPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <GenericForm
        title={editingUser ? "Edit User" : "Create New User"}
        fields={getUserFormFields(!!editingUser)}
        mode={editingUser ? "edit" : "create"}
        initialValues={
          editingUser
            ? {
                username: editingUser.username,
                email: editingUser.email,
                password: "",
                role: editingUser.role,
              }
            : {
                username: "",
                email: "",
                password: "",
                role: "SalesRep",
              }
        }
        onSubmit={handleUserSubmit}
        onSuccess={() => {
          setEditingUser(null);
          fetchUsers();
        }}
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
