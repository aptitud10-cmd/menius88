'use client';

import { useState, useEffect } from 'react';
import {
  Plus, X, Mail, UserCheck, Clock, Trash2, Shield, Users, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffMember {
  id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  user?: { full_name: string; user_id: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/tenant/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff ?? []);
        setInvitations(data.invitations ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Email válido requerido');
      return;
    }
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/tenant/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInvitations(prev => [data.invitation, ...prev]);
      setEmail('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    }
    setSending(false);
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('¿Remover a este miembro del equipo?')) return;
    await fetch(`/api/tenant/staff?staff_id=${staffId}`, { method: 'DELETE' });
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  const handleRevokeInvitation = async (invId: string) => {
    await fetch(`/api/tenant/staff?invitation_id=${invId}`, { method: 'DELETE' });
    setInvitations(prev => prev.filter(i => i.id !== invId));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-40 bg-gray-200 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Invitar miembro
        </button>
      )}

      {/* Invite form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Invitar al equipo</h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="miembro@email.com"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              {role === 'staff' ? 'Acceso a órdenes y menú' : 'Acceso completo excepto facturación'}
            </p>
            <button
              onClick={handleInvite}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </div>
      )}

      {/* Active staff */}
      {staff.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5" /> Miembros activos ({staff.length})
          </h3>
          <div className="space-y-2">
            {staff.map(member => (
              <div key={member.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user?.full_name ?? 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      member.role === 'manager' ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {member.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStaff(member.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Invitaciones pendientes ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-white rounded-xl border border-dashed border-gray-200 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{inv.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      Expira {new Date(inv.expires_at).toLocaleDateString('es-MX')}
                    </span>
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      inv.role === 'manager' ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {inv.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvitation(inv.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Revocar invitación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {staff.length === 0 && invitations.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin miembros del equipo</p>
          <p className="text-sm mt-1 text-gray-300">Invita a tu equipo para que te ayuden a gestionar el restaurante</p>
        </div>
      )}

      {/* Roles info */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Permisos por rol
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Staff</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• Ver y gestionar órdenes</li>
              <li>• Ver menú y productos</li>
              <li>• Ver mesas</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-700 mb-1">Manager</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• Todo lo de Staff +</li>
              <li>• Editar menú y productos</li>
              <li>• Ver analytics</li>
              <li>• Gestionar promociones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
