import React, { useState, useEffect } from "react";

const baseInputStyle =
  "pos-input";

const FieldRenderer = ({ field, value, onChange }) => {
  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          className={baseInputStyle}
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={`Enter ${field.label}`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className={baseInputStyle}
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={`Enter ${field.label}`}
        />
      );

    case "select":
      return (
        <select
          className={baseInputStyle}
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      );

    case "textarea":
      return (
        <textarea
          className={baseInputStyle}
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={`Enter ${field.label}`}
          rows={field.rows || 4}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          className={baseInputStyle}
          value={value || new Date().toISOString().slice(0, 16)}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );

    case "date":
      return (
        <input
          type="date"
          className={baseInputStyle}
          value={value || new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );

    default:
      return null;
  }
};

const DynamicForm = ({
  schema,
  initialValues = {},
  onSubmit,
  onValuesChange,
  title = "Create Product",
  subtitle = "Add a new product to your inventory",
  submitLabel = "Save Product",
  resetOnSubmit = true,
  footerActions = null,
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
    onValuesChange?.(initialValues);
  }, [initialValues, onValuesChange]);

  const handleChange = (name, value) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      onValuesChange?.(next);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (resetOnSubmit) {
        setFormData({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pos-card m-6">
      <div className="p-8">
        <h2 className="pos-section-title">
          {title}
        </h2>
        <p className="pos-section-subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {schema.map((field) => (
              <div
                key={field.name}
                className={`pos-form-group ${field.fullWidth ? "md:col-span-2" : ""}`}
              >
                <label className="pos-label">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                <FieldRenderer
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              type="submit"
              className="pos-btn-primary min-w-[180px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
            {footerActions}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicForm;
