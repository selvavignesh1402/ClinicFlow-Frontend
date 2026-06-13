import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { PaymentResponseDto, InvoiceResponseDto, PatientResponseDto } from "../../models/types";
import { getAllPayments, createPayment } from "../../services/paymentService";
import { getAllInvoices } from "../../services/invoiceService";
import { getAllPatients } from "../../services/patientService";
import { Panel, Table, StatusBadge, money, date, today } from "../../components/ui/components";
import "./PaymentPage.css";

export default function PaymentPage() {
  const location = useLocation();
  const stateInvoice = location.state?.preselectedInvoice as InvoiceResponseDto | null;

  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [patients, setPatients] = useState<PatientResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>("CASH");
  const [paidAt, setPaidAt] = useState<string>(today);
  const [status, setStatus] = useState<string>("SUCCESS");

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentData, invoiceData, patientData] = await Promise.all([
        getAllPayments(),
        getAllInvoices(),
        getAllPatients()
      ]);
      setPayments(paymentData);
      setInvoices(invoiceData);
      setPatients(patientData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get only unpaid/pending/partially paid invoices for selection
  const selectableInvoices = useMemo(() => {
    return invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
  }, [invoices]);

  // Handle invoice selection change
  function handleInvoiceChange(invIdStr: string) {
    setInvoiceId(invIdStr);
    if (!invIdStr) {
      setPatientId("");
      setPatientName("");
      setAmount(0);
      return;
    }

    const selectedInv = invoices.find((i) => i.invoiceId === Number(invIdStr));
    if (selectedInv) {
      setPatientId(String(selectedInv.patientId));
      setPatientName(selectedInv.patientName || `Patient #${selectedInv.patientId}`);
      
      const alreadyPaid = payments
        .filter((p) => p.invoiceId === selectedInv.invoiceId && (p.status === "SUCCESS" || p.status === "COMPLETED"))
        .reduce((sum, p) => sum + p.amount, 0);

      const remaining = Math.max(0, selectedInv.totalAmount - alreadyPaid);
      setAmount(remaining);
    }
  }

  // Handle preselected invoice passed from state
  useEffect(() => {
    if (stateInvoice && payments.length > 0 && invoices.length > 0) {
      setShowForm(true);
      setInvoiceId(String(stateInvoice.invoiceId));
      setPatientId(String(stateInvoice.patientId));
      setPatientName(stateInvoice.patientName || `Patient #${stateInvoice.patientId}`);
      
      const alreadyPaid = payments
        .filter((p) => p.invoiceId === stateInvoice.invoiceId && (p.status === "SUCCESS" || p.status === "COMPLETED"))
        .reduce((sum, p) => sum + p.amount, 0);

      const remaining = Math.max(0, stateInvoice.totalAmount - alreadyPaid);
      setAmount(remaining);
    }
  }, [stateInvoice, payments, invoices]);

  // Filter payments by search query
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        String(p.invoiceId).includes(query) ||
        String(p.paymentId).includes(query) ||
        p.patientName?.toLowerCase().includes(query) ||
        p.method.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!invoiceId || !patientId || amount <= 0) return;

    try {
      await createPayment({
        invoiceId: Number(invoiceId),
        patientId: Number(patientId),
        amount,
        method,
        paidAt: new Date(paidAt).toISOString(),
        status
      });

      toast.success("Payment recorded successfully.");

      // Reset Form
      setInvoiceId("");
      setPatientId("");
      setPatientName("");
      setAmount(0);
      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment.");
    }
  }

  function handleCancel() {
    setShowForm(false);
    setInvoiceId("");
    setPatientId("");
    setPatientName("");
    setAmount(0);
  }

  if (loading && payments.length === 0) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments History</h1>
          <p>Trace patient transaction archives, log manual collections, and audit accounts receivable.</p>
        </div>
      </div>

      <Panel
        title="Transactions List"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm ? "Cancel" : "+ Record Payment"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={submit} style={{ background: "var(--color-bg)", padding: "24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: 600 }}>Record Manual Payment</h3>
              <button type="button" style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--color-text-muted)" }} onClick={handleCancel}>&times;</button>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Select Unpaid Invoice *</label>
                <select className="form-select" value={invoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} required>
                  <option value="">-- Choose Invoice --</option>
                  {stateInvoice && !selectableInvoices.some(i => i.invoiceId === stateInvoice.invoiceId) && (
                    <option value={stateInvoice.invoiceId}>
                      Invoice #{stateInvoice.invoiceId} - {stateInvoice.patientName} (Selected)
                    </option>
                  )}
                  {selectableInvoices.map((inv) => (
                    <option key={inv.invoiceId} value={inv.invoiceId}>
                      Invoice #{inv.invoiceId} - {inv.patientName} (Due: {money(inv.totalAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Patient Name (Auto)</label>
                <input className="form-input" type="text" value={patientName} readOnly style={{ background: "var(--color-border-light)", cursor: "not-allowed" }} />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD</option>
                  <option value="UPI">UPI</option>
                  <option value="INSURANCE">INSURANCE</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Paid At *</label>
                <input className="form-input" type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="SUCCESS">SUCCESS (Paid)</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn btn-primary" disabled={amount <= 0}>Record Payment</button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        )}

        <div className="filters-bar">
          <div className="header-search search-input" style={{ flex: 1, maxWidth: "400px" }}>
            <input
              className="form-input"
              type="text"
              placeholder="Search payments by Patient Name, Invoice ID, or Method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table
          columns={["Payment ID", "Invoice ID", "Patient Name", "Amount Paid", "Method", "Paid At", "Status"]}
          rows={filteredPayments.map((pay) => [
            `#${pay.paymentId}`,
            `#${pay.invoiceId}`,
            pay.patientName || `Patient #${pay.patientId}`,
            <strong>{money(pay.amount)}</strong>,
            <span key={`method-${pay.paymentId}`} style={{ fontWeight: 600 }}>{pay.method}</span>,
            date(pay.paidAt),
            <StatusBadge key={`badge-${pay.paymentId}`} status={pay.status || "SUCCESS"} />
          ])}
        />
      </Panel>
    </div>
  );
}
