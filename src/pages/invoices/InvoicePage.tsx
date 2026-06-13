import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { InvoiceResponseDto, PatientResponseDto, EncounterResponseDto } from "../../models/types";
import { getAllInvoices, createInvoice, deleteInvoice } from "../../services/invoiceService";
import { getAllPatients } from "../../services/patientService";
import { getAllEncounters } from "../../services/encounterService";
import { Panel, Table, StatusBadge, Modal, money, date, today } from "../../components/ui/components";
import "./InvoicePage.css";

export interface LineItem {
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export default function InvoicePage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [patients, setPatients] = useState<PatientResponseDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponseDto | null>(null);

  // Form States
  const [patientId, setPatientId] = useState<number>(0);
  const [encounterId, setEncounterId] = useState<string>("");
  const [issuedAt, setIssuedAt] = useState(today);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [taxes, setTaxes] = useState<number | "">("");
  const [discounts, setDiscounts] = useState<number | "">("");
  const [status, setStatus] = useState<string>("UNPAID");

  // Service Items State
  const [serviceItems, setServiceItems] = useState<{ serviceItemCode: string; quantity: number | "" }[]>([
    { serviceItemCode: "", quantity: 1 }
  ]);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [invoiceData, patientData, encounterData] = await Promise.all([
        getAllInvoices(),
        getAllPatients(),
        getAllEncounters()
      ]);
      setInvoices(invoiceData);
      setPatients(patientData);
      setEncounters(encounterData);
      if (patientData.length > 0 && !patientId) {
        setPatientId(patientData[0].patientId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load database records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter encounters to only show the selected patient's encounters
  const filteredEncounters = useMemo(() => {
    return encounters.filter((e) => e.patientId === Number(patientId));
  }, [encounters, patientId]);

  // Handle service item field changes
  function updateServiceItem(index: number, field: "serviceItemCode" | "quantity", value: string | number) {
    const updated = [...serviceItems];
    const item = { ...updated[index] };

    if (field === "serviceItemCode") {
      item.serviceItemCode = String(value);
    } else if (field === "quantity") {
      item.quantity = value === "" ? "" : Number(value);
    }
    
    updated[index] = item;
    setServiceItems(updated);
  }

  function addServiceItem() {
    setServiceItems([...serviceItems, { serviceItemCode: "", quantity: 1 }]);
  }

  function removeServiceItem(index: number) {
    if (serviceItems.length === 1) return;
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!patientId) return;

    const formattedItems = serviceItems
      .filter(item => item.serviceItemCode.trim())
      .map(item => ({
        serviceItemCode: item.serviceItemCode.trim(),
        quantity: item.quantity === "" ? 1 : Number(item.quantity)
      }));

    if (formattedItems.length === 0) {
      toast.error("Please add at least one service item code.");
      return;
    }

    try {
      await createInvoice({
        patientId: Number(patientId),
        encounterId: encounterId ? Number(encounterId) : null,
        taxes: taxes === "" ? 0 : Number(taxes),
        discounts: discounts === "" ? 0 : Number(discounts),
        issuedAt: new Date(issuedAt).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        status,
        serviceItems: formattedItems
      });

      toast.success("Invoice created successfully.");
      
      // Reset Form
      setServiceItems([{ serviceItemCode: "", quantity: 1 }]);
      setTaxes("");
      setDiscounts("");
      setEncounterId("");
      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice.");
    }
  }

  async function handleVoid(invoiceId: number) {
    if (!window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;
    try {
      await deleteInvoice(invoiceId);
      toast.success("Invoice deleted/voided successfully.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoice.");
    }
  }

  function handlePaySelect(invoice: InvoiceResponseDto) {
    navigate("/payments", { state: { preselectedInvoice: invoice } });
  }

  // Parse invoice line items
  function getInvoiceItems(invoice: InvoiceResponseDto): LineItem[] {
    try {
      return JSON.parse(invoice.lineItemsJson || "[]");
    } catch {
      return [{ name: invoice.lineItemsJson || "Consultation Service", unitPrice: invoice.subtotal, quantity: 1, amount: invoice.subtotal }];
    }
  }

  if (loading && invoices.length === 0) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Invoice Management</h1>
          <p>Generate invoice records, manage client billing lists, and configure itemized rates.</p>
        </div>
      </div>

      <Panel
        title="Invoices List"
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Invoice"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={submit} style={{ background: "var(--color-bg)", padding: "24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: 600 }}>Create New Invoice</h3>
              <button type="button" style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--color-text-muted)" }} onClick={() => setShowForm(false)}>&times;</button>
            </div>
            
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select className="form-select" value={patientId} onChange={(e) => {
                  const pid = Number(e.target.value);
                  setPatientId(pid);
                  setEncounterId("");
                }} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Related Encounter</label>
                <select className="form-select" value={encounterId} onChange={(e) => setEncounterId(e.target.value)}>
                  <option value="">-- None / General --</option>
                  {filteredEncounters.map((e) => (
                    <option key={e.encounterId} value={e.encounterId}>
                      Encounter #{e.encounterId} - {e.visitType} ({e.chiefComplaint || "No details"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Issue Date *</label>
                <input className="form-input" type="datetime-local" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input className="form-input" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tax Override Amount (₹)</label>
                <input className="form-input" type="number" min="0" value={taxes} onChange={(e) => setTaxes(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>

              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input className="form-input" type="number" min="0" value={discounts} onChange={(e) => setDiscounts(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Service Items (Database Priced)</h4>
              <div className="items-list">
                {serviceItems.map((item, idx) => (
                  <div key={idx} className="item-row" style={{ gridTemplateColumns: "3fr 1.5fr auto", alignItems: "end", gap: "16px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Service Item Code *</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. CONSULTATION, XRAY-01, LAB-05"
                        value={item.serviceItemCode}
                        onChange={(e) => updateServiceItem(idx, "serviceItemCode", e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Quantity *</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="1"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(idx, "quantity", e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ height: "42px" }}
                      onClick={() => removeServiceItem(idx)}
                      disabled={serviceItems.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-secondary" style={{ marginTop: "12px" }} onClick={addServiceItem}>
                + Add Service Code
              </button>
            </div>

            <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              * Note: Invoice subtotals and totals will be calculated automatically by the database based on the service codes entered.
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn btn-primary">Create Invoice</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <Table
          columns={["Invoice ID", "Patient", "Issued On", "Total Amount", "Status", "Actions"]}
          rows={invoices.map((inv) => [
            `#${inv.invoiceId}`,
            <div key={inv.invoiceId}>
              <strong className="cell-main">{inv.patientName || `Patient #${inv.patientId}`}</strong>
              <span className="cell-sub" style={{ display: "block" }}>
                {patients.find((p) => p.patientId === inv.patientId)?.mrn || "No MRN"}
              </span>
            </div>,
            date(inv.issuedAt),
            <strong>{money(inv.totalAmount)}</strong>,
            <StatusBadge key={`badge-${inv.invoiceId}`} status={inv.status} />,
            <div className="actions-cell" key={`actions-${inv.invoiceId}`}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedInvoice(inv)}>
                View
              </button>
              {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => handlePaySelect(inv)}>
                    Record Pay
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleVoid(inv.invoiceId)}>
                    Void
                  </button>
                </>
              )}
            </div>
          ])}
        />

        {selectedInvoice && (
          <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice Details #${selectedInvoice.invoiceId}`}>
            <div className="receipt">
              <div className="receipt-header">
                <div>
                  <span className="receipt-logo">ClinicFlow</span>
                  <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>HEALTHCARE FINANCE</span>
                </div>
                <div className="receipt-meta">
                  <span className="receipt-title">Invoice Receipt</span>
                  <span>Invoice ID: #{selectedInvoice.invoiceId}</span>
                  <span>Date: {new Date(selectedInvoice.issuedAt || "").toLocaleDateString()}</span>
                  <span>Due Date: {new Date(selectedInvoice.dueDate || "").toLocaleDateString()}</span>
                </div>
              </div>

              <div className="receipt-info-grid">
                <div className="receipt-info-block">
                  <span>BILLED TO:</span>
                  <strong>{selectedInvoice.patientName || `Patient ID: ${selectedInvoice.patientId}`}</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--color-text)", fontWeight: "normal", marginTop: "4px" }}>
                    MRN: {patients.find((p) => p.patientId === selectedInvoice.patientId)?.mrn || "N/A"}
                  </span>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "normal" }}>
                    Insurance ID: {patients.find((p) => p.patientId === selectedInvoice.patientId)?.insuranceId || "None"}
                  </span>
                </div>
                
                <div className="receipt-info-block" style={{ textAlign: "right" }}>
                  <span>STATUS:</span>
                  <div style={{ marginTop: "4px" }}>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  {selectedInvoice.encounterId && (
                    <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
                      Encounter reference: #{selectedInvoice.encounterId}
                    </span>
                  )}
                </div>
              </div>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Description</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getInvoiceItems(selectedInvoice).map((item, index) => (
                    <tr key={index}>
                      <td>{item.name || "General Healthcare Service"}</td>
                      <td style={{ textAlign: "right" }}>{money(item.unitPrice)}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{money(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-summary">
                <div className="receipt-summary-row">
                  <span>Subtotal:</span>
                  <span>{money(selectedInvoice.subtotal)}</span>
                </div>
                <div className="receipt-summary-row">
                  <span>Tax:</span>
                  <span>{money(selectedInvoice.taxes)}</span>
                </div>
                {selectedInvoice.discounts > 0 && (
                  <div className="receipt-summary-row" style={{ color: "var(--color-danger)" }}>
                    <span>Discount:</span>
                    <span>-{money(selectedInvoice.discounts)}</span>
                  </div>
                )}
                <div className="receipt-summary-row total">
                  <span>Total Amount:</span>
                  <span>{money(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="receipt-footer">
                <p>Thank you for choosing ClinicFlow Services.</p>
                <p>For billing queries, please contact billing@clinicflow.com.</p>
              </div>

              <div className="modal-footer" style={{ marginTop: "24px", padding: 0 }}>
                <button className="btn btn-primary" onClick={() => window.print()}>Print Receipt</button>
                <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
              </div>
            </div>
          </Modal>
        )}
      </Panel>
    </div>
  );
}
