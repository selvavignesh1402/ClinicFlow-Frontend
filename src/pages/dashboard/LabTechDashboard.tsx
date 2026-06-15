import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllOrders } from '../../services/labService';
import type { LabOrderResponseDto } from '../../models/types';
import {
  FlaskConical,
  TestTube2,
  FileCheck,
  ClipboardList,
  FileText,
} from 'lucide-react';

export default function LabTechDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [labOrders, setLabOrders] = useState<LabOrderResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const orders = await getAllOrders();
      setLabOrders(orders);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'ORDERED': { cls: 'badge-warning', label: 'Ordered' },
      'COLLECTED': { cls: 'badge-info', label: 'Collected' },
      'RESULTS_REPORTED': { cls: 'badge-success', label: 'Reported' },
      'CRITICAL_REPORTED': { cls: 'badge-danger', label: 'Critical' },
      'CANCELLED': { cls: 'badge-neutral', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  const parseTests = (testsJson: string): string[] => {
    try {
      const parsed = JSON.parse(testsJson);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [testsJson || '—'];
    }
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const pendingOrders = labOrders.filter(o => o.status === 'ORDERED').length;
  const collectedSamples = labOrders.filter(o => o.status === 'COLLECTED').length;
  const completedReports = labOrders.filter(o => o.status === 'RESULTS_REPORTED' || o.status === 'CRITICAL_REPORTED').length;

  const stats = [
    { label: 'Pending Lab Orders', value: pendingOrders.toString(), icon: <FlaskConical size={22} />, color: 'warning', alert: pendingOrders > 0 },
    { label: 'Samples Collected', value: collectedSamples.toString(), icon: <TestTube2 size={22} />, color: 'info' },
    { label: 'Completed Reports', value: completedReports.toString(), icon: <FileCheck size={22} />, color: 'success' },
  ];

  // Active lab orders (non-cancelled, most recent first)
  const activeOrders = [...labOrders]
    .filter(o => o.status !== 'CANCELLED')
    .sort((a, b) => {
      // Prioritize ORDERED, then COLLECTED, then others
      const priority: Record<string, number> = { 'ORDERED': 0, 'COLLECTED': 1, 'RESULTS_REPORTED': 2, 'CRITICAL_REPORTED': 2 };
      return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
    });

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Lab Station 🔬</h2>
          <p>Good day, {user?.name?.split(' ')[0]}. Manage lab orders and record results.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/lab')}>
            <FlaskConical size={18} /> View All Orders
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
          <div className="quick-action-card" onClick={() => navigate('/lab')}>
            <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <ClipboardList size={24} />
            </div>
            <h4>Record Results</h4>
            <p>Enter lab findings</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/lab')}>
            <div className="qa-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
              <FileText size={24} />
            </div>
            <h4>View Orders</h4>
            <p>Browse all orders</p>
          </div>
        </div>
      </div>

      {/* Lab Orders Table */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={18} style={{ color: 'var(--color-primary)' }} />
            Lab Orders
          </h3>
          <span className="badge badge-primary">{activeOrders.length}</span>
        </div>
        <div className="card-body" style={{ padding: '16px 0 0' }}>
          {activeOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No lab orders found.</p>
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Patient</th>
                    <th>Test</th>
                    <th>Sample ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.slice(0, 15).map((order) => {
                    const tests = parseTests(order.testsJson);
                    return (
                      <tr key={order.labOrderId} style={{ cursor: 'pointer' }} onClick={() => navigate('/lab')}>
                        <td>
                          <span className="badge badge-neutral" style={{ padding: '4px 8px', fontWeight: 600 }}>
                            #{order.labOrderId}
                          </span>
                        </td>
                        <td className="cell-main">{order.patientName}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {tests.slice(0, 3).map((t, i) => (
                              <span key={i} className="badge badge-neutral" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{t}</span>
                            ))}
                            {tests.length > 3 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>+{tests.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: order.sampleId ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                            {order.sampleId || '—'}
                          </span>
                        </td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
