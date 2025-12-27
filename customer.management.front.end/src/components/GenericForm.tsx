import { useState, useEffect, FormEvent } from "react";
import "../assets/components-styles/GenericForm.css";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "tel" | "select" | "date" | "textarea" | "password" | "combobox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface GenericFormProps<T extends Record<string, any>> {
  // Configuration
  fields: FormField[];
  mode: "create" | "edit";
  
  // Data
  initialValues?: Partial<T>;
  
  // Actions
  onSubmit: (data: Partial<T>) => Promise<T | void>;
  onSuccess?: (result: T | void) => void;
  onCancel?: () => void;
  
  // UI
  submitLabel?: string;
  cancelLabel?: string;
  title?: string;
  
  // Modal control
  isOpen: boolean;
  onClose: () => void;
  
  // Advanced features
  onFieldChange?: (fieldName: string, value: any, formData: Record<string, any>) => void;
  computedFields?: (formData: Record<string, any>) => Record<string, any>;
  twoColumn?: boolean; // Enable two-column layout
}

export function GenericForm<T extends Record<string, any>>({
  fields,
  mode,
  initialValues,
  onSubmit,
  onSuccess,
  onCancel,
  submitLabel,
  cancelLabel,
  title,
  isOpen,
  onClose,
  onFieldChange,
  computedFields,
  twoColumn = false,
}: GenericFormProps<T>) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data from initialValues
  useEffect(() => {
    let initial: Record<string, any> = {};
    if (initialValues) {
      fields.forEach((field) => {
        initial[field.name] = initialValues[field.name] ?? "";
      });
    } else {
      fields.forEach((field) => {
        initial[field.name] = "";
      });
    }
    
    // Apply computed fields if provided
    if (computedFields) {
      const computed = computedFields(initial);
      initial = { ...initial, ...computed };
    }
    
    setFormData(initial);
    setErrors({});
    setSubmitError(null);
  }, [initialValues, isOpen, fields]);

  const validateField = (field: FormField, value: any): string | null => {
    // Required validation
    if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      return `${field.label} is required`;
    }

    // Type-specific validation
    if (value && field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }

    if (value && field.type === "number") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return "Please enter a valid number";
      }
      if (field.min !== undefined && numValue < field.min) {
        return `Value must be at least ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `Value must be at most ${field.max}`;
      }
    }

    // Custom validation
    if (field.validation && value) {
      return field.validation(value);
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      const value = formData[field.name];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name: string, value: any) => {
    const updatedData = { ...formData, [name]: value };
    
    // Apply computed fields if provided
    let finalData = updatedData;
    if (computedFields) {
      const computed = computedFields(updatedData);
      finalData = { ...updatedData, ...computed };
    }
    
    setFormData(finalData);
    
    // Call onFieldChange callback if provided
    if (onFieldChange) {
      onFieldChange(name, value, finalData);
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData as Partial<T>);
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
      // Reset form
      const empty: Record<string, any> = {};
      fields.forEach((field) => {
        empty[field.name] = "";
      });
      setFormData(empty);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while submitting the form";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
    setErrors({});
    setSubmitError(null);
  };

  if (!isOpen) return null;

  const formTitle = title || (mode === "create" ? "Create New" : "Edit");
  const submitButtonLabel = submitLabel || (mode === "create" ? "Create" : "Update");
  const cancelButtonLabel = cancelLabel || "Cancel";

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className={`modal-content ${twoColumn ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formTitle}</h2>
          <button className="modal-close" onClick={handleCancel} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`generic-form ${twoColumn ? 'compact' : ''}`}>
          {submitError && (
            <div className="form-error-message">
              {submitError}
            </div>
          )}

          <div className={`form-fields ${twoColumn ? 'two-column' : ''}`}>
            {fields.map((field) => (
              <div key={field.name} className="form-field">
                <label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="required-asterisk">*</span>}
                </label>
                
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    disabled={field.disabled || isSubmitting}
                    className={errors[field.name] ? "error" : ""}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "combobox" ? (
                  <div className="combobox-container">
                    <input
                      type="text"
                      id={field.name}
                      name={field.name}
                      list={`${field.name}-options`}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={field.disabled || isSubmitting}
                      className={errors[field.name] ? "error" : ""}
                    />
                    {field.options && field.options.length > 0 && (
                      <datalist id={`${field.name}-options`}>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.label} />
                        ))}
                      </datalist>
                    )}
                  </div>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={field.disabled || isSubmitting}
                    className={errors[field.name] ? "error" : ""}
                    rows={4}
                  />
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={field.type === "number" 
                      ? (formData[field.name] ?? (formData[field.name] === 0 ? 0 : ""))
                      : (formData[field.name] || "")}
                    onChange={(e) => {
                      const value = field.type === "number" 
                        ? (e.target.value === "" ? "" : Number(e.target.value))
                        : e.target.value;
                      handleChange(field.name, value);
                    }}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={field.disabled || isSubmitting}
                    className={errors[field.name] ? "error" : ""}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
                )}
                
                {errors[field.name] && (
                  <span className="field-error">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="btn-cancel"
            >
              {cancelButtonLabel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? "Submitting..." : submitButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

