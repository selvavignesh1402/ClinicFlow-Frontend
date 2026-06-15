import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllInvoices } from '../../services/invoiceService';
import { getAllPayments } from '../../services/paymentService';
import type { InvoiceResponseDto, PaymentResponseDto } from '../../models/types';
import {
  FileText,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
  Plus,
} from 'lucide-react';

export default function FinanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, pays] = await Promise.allSettled([
        getAllInvoices(),
        getAllPayments(),
      ]);
      if (invs.status === 'fulfilled') setInvoices(invs.value);
      if (pays.status === 'fulfilled') setPayments(pays.value);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'DRAFT': { cls: 'badge-neutral', label: 'Draft' },
      'ISSUED': { cls: 'badge-warning', label: 'Issued' },
      'PAID': { cls: 'badge-success', label: 'Paid' },
      'OVERDUE': { cls: 'badge-danger', label: 'Overdue' },
      'CANCELLED': { cls: 'badge-neutral', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const totalInvoices = invoices.length;
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = invoices.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').length;
  // Insurance claims — count invoices where status suggests insurance processing (placeholder: overdue ones)
  const insuranceClaims = invoices.filter(i => i.status === 'OVERDUE').length;

  const stats = [
    { label: 'Invoices Generated', value: totalInvoices.toString(), icon: <FileText size={22} />, color: 'primary' },
    { label: 'Payments Received', value: `₹${totalPaymentsReceived.toLocaleString('en-IN')}`, icon: <DollarSign size={22} />, color: 'success' },
    { label: 'Pending Payments', value: pendingPayments.toString(), icon: <Clock size={22} />, color: 'warning', alert: pendingPayments > 0 },
    { label: 'Insurance Claims', value: insuranceClaims.toString(), icon: <Shield size={22} />, color: 'purple' },
  ];

  // Pending bills (non-paid invoices)
  const pendingBills = invoices
    .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Finance Office 💰</h2>
          <p>Good day, {user?.name?.split(' ')[0]}. Manage billing, invoices, and payments.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/payments')}>
            <CreditCard size={18} /> Record Payment
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/invoices')}>
            <Plus size={18} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div className={`stat-card ${stat.alert ? 'alert-pulse' : ''}`} key={stat.label}>
            <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-card-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 className="dashboard-section-title">Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/invoices')}>
            <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FileText size={24} />
            </div>
            <h4>Generate Invoice</h4>
            <p>Create billing invoice</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/payments')}>
            <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CreditCard size={24} />
            </div>
            <h4>Record Payment</h4>
            <p>Log patient payment</p>
          </div>
        </div>
      </div>

      {/* Pending Bills Table */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-warning)' }} />
            Pending Bills
          </h3>
          <span className="badge badge-warning">{pendingBills.length}</span>
        </div>
        <div className="card-body" style={{ padding: '16px 0 0' }}>
          {pendingBills.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>All bills are settled. 🎉</p>
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBills.slice(0, 15).map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td>
                        <span className="badge badge-neutral" style={{ padding: '4px 8px', fontWeight: 600 }}>
                          INV-{inv.invoiceId}
                        </span>
                      </td>
                      <td className="cell-main">{inv.patientName}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: inv.status === 'OVERDUE' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                        </span>
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
