import React from "react";

export const today = new Date().toISOString().slice(0, 16);

export function Panel({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" {...inputProps} />
    </div>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string | number; label: string }[] }) {
  const { label, options, ...selectProps } = props;
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" {...selectProps}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Table({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toUpperCase();
  let className = "badge-neutral";
  
  if (normalized === "PAID" || normalized === "SUCCESS" || normalized === "COMPLETED") {
    className = "badge-success";
  } else if (normalized === "UNPAID" || normalized === "PENDING" || normalized === "PARTIALLY_PAID") {
    className = "badge-warning";
  } else if (normalized === "VOID" || normalized === "CANCELLED" || normalized === "FAILED" || normalized === "OVERDUE") {
    className = "badge-danger";
  }

  return (
    <span className={`badge ${className}`}>
      <span className="badge-dot"></span>
      {status}
    </span>
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} style={{ fontSize: "1.5rem" }}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

export function date(value?: string) {
  return value ? new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : "-";
}
