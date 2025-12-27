/**
 * Example usage of GenericForm component
 * 
 * This file demonstrates how to use the GenericForm component
 * for creating and editing entities (e.g., Customers)
 */

import { useState } from "react";
import { GenericForm, FormField } from "./GenericForm";
import { apiService } from "../services/api";
import { Customer } from "../types";

// Example: Customer form fields configuration
const customerFields: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
    placeholder: "Enter customer name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter email address",
    validation: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
      return null;
    },
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "Enter phone number",
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    placeholder: "Enter address",
  },
  {
    name: "company",
    label: "Company",
    type: "text",
    placeholder: "Enter company name",
  },
];

// Example component using GenericForm
export function CustomerFormExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleCreate = () => {
    setEditingCustomer(null);
    setIsOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsOpen(true);
  };

  const handleSubmit = async (data: Partial<Customer>) => {
    if (editingCustomer) {
      // Update existing customer
      await apiService.updateCustomer(editingCustomer.id, data);
    } else {
      // Create new customer
      await apiService.createCustomer({
        ...data,
        createdBy: "user-id-here", // You would get this from auth context
      } as any);
    }
  };

  const handleSuccess = () => {
    // Refresh customer list, show success message, etc.
    console.log("Customer saved successfully!");
    // You might want to refresh data here
  };

  return (
    <>
      <button onClick={handleCreate}>Create Customer</button>
      
      {/* Example: Edit button in a table row */}
      {/* <button onClick={() => handleEdit(customer)}>Edit</button> */}

      <GenericForm<Customer>
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingCustomer(null);
        }}
        fields={customerFields}
        mode={editingCustomer ? "edit" : "create"}
        initialValues={editingCustomer || undefined}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        title={editingCustomer ? "Edit Customer" : "Create New Customer"}
      />
    </>
  );
}

