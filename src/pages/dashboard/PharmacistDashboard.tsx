import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllPrescriptions } from '../../services/prescriptionService';
import { getAllDispenseRecords } from '../../services/pharmacyService';
import { getLowStock, getExpiredInventory } from '../../services/inventoryService';
import type {
  PrescriptionResponseDto,
  DispenseResponseDto,
  InventoryResponseDto,
} from '../../models/types';
import type { StockSummaryResponseDto } from '../../services/inventoryService';
import {
  Pill,
  Package,
  AlertTriangle,
  Clock,
  Plus,
  Activity,
} from 'lucide-react';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDto[]>([]);
  const [dispenseRecords, setDispenseRecords] = useState<DispenseResponseDto[]>([]);
  const [lowStock, setLowStock] = useState<StockSummaryResponseDto[]>([]);
  const [expiredMeds, setExpiredMeds] = useState<InventoryResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxs, disp, low, exp] = await Promise.allSettled([
        getAllPrescriptions(),
        getAllDispenseRecords(),
        getLowStock(),
        getExpiredInventory(),
      ]);
      if (rxs.status === 'fulfilled') setPrescriptions(rxs.value);
      if (disp.status === 'fulfilled') setDispenseRecords(disp.value);
      if (low.status === 'fulfilled') setLowStock(low.value);
      if (exp.status === 'fulfilled') setExpiredMeds(exp.value);
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
      'ACTIVE': { cls: 'badge-info', label: 'Active' },
      'DISPENSED': { cls: 'badge-success', label: 'Dispensed' },
      'COMPLETED': { cls: 'badge-success', label: 'Completed' },
      'CANCELLED': { cls: 'badge-danger', label: 'Cancelled' },
      'EXPIRED': { cls: 'badge-danger', label: 'Expired' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingRx = prescriptions.filter(rx => rx.status === 'ISSUED' || rx.status === 'ACTIVE');
  const dispensedToday = dispenseRecords.filter(d => d.dispensedAt?.startsWith(todayStr)).length;
  const lowStockCount = lowStock.length;
  const expiredCount = expiredMeds.length;

  const stats = [
    { label: 'Pending Prescriptions', value: pendingRx.length.toString(), icon: <Pill size={22} />, color: 'warning', alert: pendingRx.length > 0 },
    { label: 'Medicines Dispensed Today', value: dispensedToday.toString(), icon: <Activity size={22} />, color: 'success' },
    { label: 'Low Stock Medicines', value: lowStockCount.toString(), icon: <Package size={22} />, color: 'amber', alert: lowStockCount > 0 },
    { label: 'Expired Medicines', value: expiredCount.toString(), icon: <AlertTriangle size={22} />, color: 'danger', alert: expiredCount > 0 },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Pharmacy Station 💊</h2>
          <p>Good day, {user?.name?.split(' ')[0]}. Manage prescriptions and inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/pharmacy')}>
            <Pill size={18} /> Dispense Medicines
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
          <div className="quick-action-card" onClick={() => navigate('/pharmacy')}>
            <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Pill size={24} />
            </div>
            <h4>Dispense Medicines</h4>
            <p>Process prescriptions</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/inventory')}>
            <div className="qa-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Package size={24} />
            </div>
            <h4>Manage Inventory</h4>
            <p>Stock management</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/inventory')}>
            <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Plus size={24} />
            </div>
            <h4>Add Medicine</h4>
            <p>Register new stock</p>
          </div>
        </div>
      </div>

      {/* Pending Prescriptions Table */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-warning)' }} />
            Pending Prescriptions
          </h3>
          <span className="badge badge-warning">{pendingRx.length}</span>
        </div>
        <div className="card-body" style={{ padding: '16px 0 0' }}>
          {pendingRx.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>All prescriptions have been processed. 🎉</p>
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prescription ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Medication</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRx.slice(0, 15).map((rx) => (
                    <tr key={rx.rxId}>
                      <td>
                        <span className="badge badge-neutral" style={{ padding: '4px 8px', fontWeight: 600 }}>
                          RX-{rx.rxId}
                        </span>
                      </td>
                      <td className="cell-main">{rx.patientName}</td>
                      <td>{rx.clinicianName}</td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{rx.medicationName}</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{rx.dosage} · {rx.frequency}</div>
                      </td>
                      <td>{getStatusBadge(rx.status)}</td>
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
