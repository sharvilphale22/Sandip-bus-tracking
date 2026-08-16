import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import {
  Bus, Users, Truck, MapPin, Send, Plus, Pencil, Trash2, X,
  Search, AlertTriangle, CheckCircle, Loader2, LayoutDashboard,
  Map, Megaphone, Link, Filter
} from 'lucide-react';

const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'buses', label: 'Buses', icon: Bus },
  { key: 'drivers', label: 'Drivers', icon: Truck },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'allotment', label: 'Bus Allotment', icon: Link },
  { key: 'map', label: 'Live Map', icon: Map },
  { key: 'notifications', label: 'Notifications', icon: Megaphone },
];

// Reusable Confirm Dialog
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="card p-6 w-full max-w-sm animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1 !bg-red-500/20 !border-red-500/40 !text-red-400">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [buses, setBuses] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveLocations, setLiveLocations] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [busFilter, setBusFilter] = useState('');

  // Modal states
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busForm, setBusForm] = useState({ number: '', route: '', capacity: 50 });

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', assignedBus: '', password: '' });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', erpId: '', password: '', pickupLocation: '', dropLocation: 'College Campus (Main)', assignedBus: '' });

  const [notifForm, setNotifForm] = useState({ message: '', targetRole: 'all', type: 'info' });
  const [notifSent, setNotifSent] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    Promise.all([
      api.get('/buses'),
      api.get('/users/drivers'),
      api.get('/users/students'),
    ])
      .then(([busRes, drvRes, stuRes]) => {
        setBuses(busRes.data);
        setDriversList(drvRes.data);
        setStudentsList(stuRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const socket = getSocket();
    if (socket) {
      socket.emit('admin:subscribe-all');
      socket.on('admin:all-locations', (locs) => setLiveLocations(locs));
      socket.on('bus:location-update', (data) => {
        setLiveLocations(prev => ({ ...prev, [data.busId]: data }));
      });
      socket.on('bus:status-change', (data) => {
        setBuses(prev => prev.map(b =>
          b.id === data.busId ? { ...b, status: data.status, tripActive: data.status === 'on-route' } : b
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('admin:all-locations');
        socket.off('bus:location-update');
        socket.off('bus:status-change');
      }
    };
  }, []);

  // ─── Refresh helpers ───
  const refreshDrivers = () => api.get('/users/drivers').then(r => setDriversList(r.data));
  const refreshStudents = () => api.get('/users/students').then(r => setStudentsList(r.data));
  const refreshBuses = () => api.get('/buses').then(r => setBuses(r.data));

  // ─── Bus CRUD ───
  const handleAddBus = async () => {
    try {
      const res = await api.post('/buses', busForm);
      setBuses(prev => [...prev, res.data.bus]);
      setShowBusModal(false);
      setBusForm({ number: '', route: '', capacity: 50 });
    } catch (err) { alert(err.response?.data?.message || 'Failed to add bus'); }
  };
  const handleEditBus = async () => {
    try {
      const res = await api.put(`/buses/${editingBus.id}`, busForm);
      setBuses(prev => prev.map(b => b.id === editingBus.id ? res.data.bus : b));
      setEditingBus(null);
      setShowBusModal(false);
      setBusForm({ number: '', route: '', capacity: 50 });
    } catch (err) { alert(err.response?.data?.message || 'Failed to update bus'); }
  };
  const handleDeleteBus = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Bus',
      message: 'Are you sure you want to delete this bus? This will unassign all drivers and students.',
      onConfirm: async () => {
        try {
          await api.delete(`/buses/${id}`);
          setBuses(prev => prev.filter(b => b.id !== id));
        } catch (err) { alert('Failed to delete bus'); }
        setConfirmDialog({ open: false });
      }
    });
  };

  // ─── Driver CRUD ───
  const handleAddDriver = async () => {
    try {
      const res = await api.post('/users/drivers', driverForm);
      setDriversList(prev => [...prev, res.data.driver]);
      setShowDriverModal(false);
      setDriverForm({ name: '', phone: '', assignedBus: '', password: '' });
      refreshBuses();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add driver'); }
  };
  const handleEditDriver = async () => {
    try {
      await api.put(`/users/drivers/${editingDriver.id}`, driverForm);
      await refreshDrivers();
      await refreshBuses();
      setEditingDriver(null);
      setShowDriverModal(false);
      setDriverForm({ name: '', phone: '', assignedBus: '', password: '' });
    } catch (err) { alert(err.response?.data?.message || 'Failed to update driver'); }
  };
  const handleDeleteDriver = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Driver',
      message: 'Are you sure you want to delete this driver? They will be unassigned from their bus.',
      onConfirm: async () => {
        try {
          await api.delete(`/users/drivers/${id}`);
          setDriversList(prev => prev.filter(d => d.id !== id));
          refreshBuses();
        } catch (err) { alert('Failed to delete driver'); }
        setConfirmDialog({ open: false });
      }
    });
  };

  // ─── Student CRUD ───
  const handleAddStudent = async () => {
    try {
      const res = await api.post('/users/students', studentForm);
      setStudentsList(prev => [...prev, res.data.student]);
      setShowStudentModal(false);
      setStudentForm({ name: '', erpId: '', password: '', pickupLocation: '', dropLocation: 'College Campus (Main)', assignedBus: '' });
      refreshBuses();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add student'); }
  };
  const handleEditStudent = async () => {
    try {
      await api.put(`/users/students/${editingStudent.id}`, studentForm);
      await refreshStudents();
      await refreshBuses();
      setEditingStudent(null);
      setShowStudentModal(false);
      setStudentForm({ name: '', erpId: '', password: '', pickupLocation: '', dropLocation: 'College Campus (Main)', assignedBus: '' });
    } catch (err) { alert(err.response?.data?.message || 'Failed to update student'); }
  };
  const handleDeleteStudent = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Student',
      message: 'Are you sure you want to delete this student? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/users/students/${id}`);
          setStudentsList(prev => prev.filter(s => s.id !== id));
          refreshBuses();
        } catch (err) { alert('Failed to delete student'); }
        setConfirmDialog({ open: false });
      }
    });
  };

  // ─── Bus Allotment ───
  const handleAllotBus = async (busId, driverId) => {
    try {
      await api.put('/users/allot-bus', { busId, driverId });
      await refreshDrivers();
      await refreshBuses();
    } catch (err) { alert(err.response?.data?.message || 'Failed to assign driver'); }
  };

  // ─── Notification ───
  const handleSendNotification = async () => {
    try {
      await api.post('/notifications', notifForm);
      setNotifSent(true);
      setNotifForm({ message: '', targetRole: 'all', type: 'info' });
      setTimeout(() => setNotifSent(false), 3000);
    } catch (err) { alert('Failed to send notification'); }
  };

  // ─── Helpers ───
  const openEditBusModal = (bus) => { setEditingBus(bus); setBusForm({ number: bus.number, route: bus.route, capacity: bus.capacity }); setShowBusModal(true); };
  const openEditDriverModal = (d) => { setEditingDriver(d); setDriverForm({ name: d.name, phone: d.phone, assignedBus: d.assignedBus || '', password: '' }); setShowDriverModal(true); };
  const openEditStudentModal = (s) => { setEditingStudent(s); setStudentForm({ name: s.name, erpId: s.erpId, password: '', pickupLocation: s.pickupLocation || s.pickupStop || '', dropLocation: s.dropLocation || s.dropStop || 'College Campus (Main)', assignedBus: s.assignedBus || '' }); setShowStudentModal(true); };

  const activeBusCount = buses.filter(b => b.tripActive).length;

  // Filtering
  const filteredBuses = buses.filter(b =>
    (!searchQuery || b.number?.toLowerCase().includes(searchQuery.toLowerCase()) || b.route?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredDrivers = driversList.filter(d =>
    (!searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.driverId?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!busFilter || d.assignedBus === busFilter)
  );
  const filteredStudents = studentsList.filter(s =>
    (!searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.erpId?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!busFilter || s.assignedBus === busFilter)
  );

  if (loading) {
    return (
      <div className="admin-shell min-h-screen bg-gradient-mesh">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-full max-w-6xl px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-3 w-20 bg-white/5 rounded mb-3" />
                  <div className="h-10 w-16 bg-white/10 rounded mb-2" />
                </div>
              ))}
            </div>
            <div className="glass-card p-4 animate-pulse">
              <div className="h-5 w-40 bg-white/5 rounded mb-3" />
              <div className="h-80 bg-white/5 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-gradient-mesh">
      <Navbar />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] bg-surface-900/50 border-r border-white/5 p-4">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { setActiveTab(item.key); setSearchQuery(''); setBusFilter(''); }}
                  className={`sidebar-item w-full ${activeTab === item.key ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                  {item.key === 'buses' && <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{buses.length}</span>}
                  {item.key === 'drivers' && <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{driversList.length}</span>}
                  {item.key === 'students' && <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{studentsList.length}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-900/95 backdrop-blur-xl border-t border-white/10 px-2 py-2">
          <div className="flex justify-around gap-1">
            {sidebarItems.slice(0, 6).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { setActiveTab(item.key); setSearchQuery(''); setBusFilter(''); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors ${activeTab === item.key ? 'text-primary-400' : 'text-white/40'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Buses', value: buses.length, icon: Bus, color: 'primary' },
                  { label: 'Active Now', value: activeBusCount, icon: MapPin, color: 'emerald' },
                  { label: 'Drivers', value: driversList.length, icon: Truck, color: 'amber' },
                  { label: 'Students', value: studentsList.length, icon: Users, color: 'blue' },
                ].map((s, i) => (
                  <div key={i} className="glass-card-hover p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider">{s.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${s.color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{s.value}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl bg-${s.color}-500/10 border border-${s.color}-500/20`}>
                        <s.icon className={`w-5 h-5 text-${s.color}-400`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Map className="w-4 h-4 text-primary-400" /> Live Bus Positions
                </h3>
                <MapView
                  height="400px"
                  busLocations={Object.entries(liveLocations).map(([busId, loc]) => {
                    const b = buses.find(x => x.id === busId);
                    return { id: busId, number: b?.number || busId, lat: loc.lat, lng: loc.lng, isActive: true, speed: loc.speed };
                  })}
                />
                {Object.keys(liveLocations).length === 0 && (
                  <p className="mt-3 text-center text-white/30 text-sm">No active buses. Start a trip from the Driver dashboard.</p>
                )}
              </div>
            </div>
          )}

          {/* ─── BUSES ─── */}
          {activeTab === 'buses' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-white">Bus Management</h2>
                <button onClick={() => { setEditingBus(null); setBusForm({ number: '', route: '', capacity: 50 }); setShowBusModal(true); }} className="btn-primary flex items-center gap-2 py-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Bus
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" placeholder="Search buses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10 py-2.5" />
              </div>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Bus #', 'Route', 'Driver', 'Students', 'Status', 'Actions'].map(h => (
                          <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} p-4 text-white/40 text-xs uppercase tracking-wider font-medium`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuses.map(bus => {
                        const driver = driversList.find(d => d.id === bus.assignedDriver);
                        return (
                          <tr key={bus.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center"><Bus className="w-4 h-4 text-primary-400" /></div><span className="text-white font-medium text-sm">{bus.number}</span></div></td>
                            <td className="p-4 text-white/60 text-sm">{bus.route}</td>
                            <td className="p-4 text-white/60 text-sm">{driver?.name || <span className="text-white/30 italic">Unassigned</span>}</td>
                            <td className="p-4 text-white/60 text-sm">{bus.studentCount || 0}</td>
                            <td className="p-4">
                              {bus.tripActive ? <span className="badge-online"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />On Route</span>
                                : bus.status === 'delayed' ? <span className="badge-delayed"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Delayed</span>
                                : <span className="badge-offline"><span className="w-1.5 h-1.5 rounded-full bg-white/30" />Idle</span>}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditBusModal(bus)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteBus(bus.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bus Modal */}
              {showBusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="glass-card p-6 w-full max-w-md animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
                      <button onClick={() => setShowBusModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                      <div><label className="block text-white/60 text-sm mb-1.5">Bus Number</label><input type="text" value={busForm.number} onChange={e => setBusForm({ ...busForm, number: e.target.value })} className="input-field" placeholder="e.g. SB-27" /></div>
                      <div><label className="block text-white/60 text-sm mb-1.5">Route</label><input type="text" value={busForm.route} onChange={e => setBusForm({ ...busForm, route: e.target.value })} className="input-field" placeholder="e.g. Panchavati - College" /></div>
                      <div><label className="block text-white/60 text-sm mb-1.5">Capacity</label><input type="number" value={busForm.capacity} onChange={e => setBusForm({ ...busForm, capacity: parseInt(e.target.value) })} className="input-field" /></div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowBusModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={editingBus ? handleEditBus : handleAddBus} className="btn-primary flex-1">{editingBus ? 'Save' : 'Add Bus'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── DRIVERS ─── */}
          {activeTab === 'drivers' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-white">Driver Management</h2>
                <button onClick={() => { setEditingDriver(null); setDriverForm({ name: '', phone: '', assignedBus: '', password: '' }); setShowDriverModal(true); }} className="btn-primary flex items-center gap-2 py-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Driver
                </button>
              </div>

              {/* Search + Filter */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="Search drivers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10 py-2.5" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select value={busFilter} onChange={e => setBusFilter(e.target.value)} className="input-field pl-10 py-2.5 pr-8 min-w-[160px]">
                    <option value="">All Buses</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.number}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDrivers.map(driver => {
                  const assignedBus = buses.find(b => b.id === driver.assignedBus);
                  return (
                    <div key={driver.id} className="glass-card-hover p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">{driver.name?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{driver.name}</p>
                          <p className="text-white/40 text-xs">{driver.driverId}</p>
                          <p className="text-white/40 text-xs">{driver.phone || 'No phone'}</p>
                        </div>
                        {driver.isActive
                          ? <span className="badge-online text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online</span>
                          : <span className="badge-offline text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-white/30" />Offline</span>}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Bus className="w-4 h-4 text-primary-400 flex-shrink-0" />
                          <span className="text-white/60 text-sm truncate">{assignedBus ? `${assignedBus.number} — ${assignedBus.route}` : <span className="text-white/30 italic">Unassigned</span>}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <button onClick={() => openEditDriverModal(driver)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Driver Modal */}
              {showDriverModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="glass-card p-6 w-full max-w-md animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
                      <button onClick={() => setShowDriverModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                      <div><label className="block text-white/60 text-sm mb-1.5">Driver Name *</label><input type="text" value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} className="input-field" placeholder="Full name" /></div>
                      {editingDriver && <div><label className="block text-white/60 text-sm mb-1.5">Driver ID</label><input type="text" value={editingDriver.driverId} disabled className="input-field opacity-50" /></div>}
                      <div><label className="block text-white/60 text-sm mb-1.5">Phone Number</label><input type="text" value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} className="input-field" placeholder="e.g. 9876543210" /></div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1.5">Assigned Bus</label>
                        <select value={driverForm.assignedBus} onChange={e => setDriverForm({ ...driverForm, assignedBus: e.target.value })} className="input-field">
                          <option value="">None</option>
                          {buses.map(b => <option key={b.id} value={b.id}>{b.number} — {b.route}</option>)}
                        </select>
                      </div>
                      {!editingDriver && <div><label className="block text-white/60 text-sm mb-1.5">Password</label><input type="password" value={driverForm.password} onChange={e => setDriverForm({ ...driverForm, password: e.target.value })} className="input-field" placeholder="Default: password123" /></div>}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowDriverModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={editingDriver ? handleEditDriver : handleAddDriver} className="btn-primary flex-1">{editingDriver ? 'Save' : 'Add Driver'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STUDENTS ─── */}
          {activeTab === 'students' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-white">Student Management ({studentsList.length})</h2>
                <button onClick={() => { setEditingStudent(null); setStudentForm({ name: '', erpId: '', password: '', pickupLocation: '', dropLocation: 'College Campus (Main)', assignedBus: '' }); setShowStudentModal(true); }} className="btn-primary flex items-center gap-2 py-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </div>

              {/* Search + Filter */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10 py-2.5" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select value={busFilter} onChange={e => setBusFilter(e.target.value)} className="input-field pl-10 py-2.5 pr-8 min-w-[160px]">
                    <option value="">All Buses</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.number}</option>)}
                  </select>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Student', 'ERP ID', 'Bus', 'Pickup', 'Drop', 'Actions'].map(h => (
                          <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} p-4 text-white/40 text-xs uppercase tracking-wider font-medium`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.slice(0, 50).map(student => {
                        const bus = buses.find(b => b.id === student.assignedBus);
                        return (
                          <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">{student.name?.charAt(0)}</div><span className="text-white/80 text-sm">{student.name}</span></div></td>
                            <td className="p-4 text-white/50 text-sm font-mono">{student.erpId}</td>
                            <td className="p-4 text-white/50 text-sm">{bus?.number || <span className="text-white/30 italic">N/A</span>}</td>
                            <td className="p-4 text-white/50 text-sm">{student.pickupLocation || student.pickupStop}</td>
                            <td className="p-4 text-white/50 text-sm">{student.dropLocation || student.dropStop || 'College Campus'}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditStudentModal(student)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteStudent(student.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Modal */}
              {showStudentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="glass-card p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                      <button onClick={() => setShowStudentModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                      <div><label className="block text-white/60 text-sm mb-1.5">Student Name *</label><input type="text" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} className="input-field" placeholder="Full name" /></div>
                      <div><label className="block text-white/60 text-sm mb-1.5">ERP ID {editingStudent ? '' : '(auto if blank)'}</label><input type="text" value={editingStudent ? editingStudent.erpId : studentForm.erpId} disabled={!!editingStudent} onChange={e => setStudentForm({ ...studentForm, erpId: e.target.value })} className={`input-field ${editingStudent ? 'opacity-50' : ''}`} placeholder="e.g. STU105" /></div>
                      {!editingStudent && <div><label className="block text-white/60 text-sm mb-1.5">Password *</label><input type="password" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} className="input-field" placeholder="Login password" /></div>}
                      <div><label className="block text-white/60 text-sm mb-1.5">Pickup Location (Home)</label><input type="text" value={studentForm.pickupLocation} onChange={e => setStudentForm({ ...studentForm, pickupLocation: e.target.value })} className="input-field" placeholder="e.g. Panchavati" /></div>
                      <div><label className="block text-white/60 text-sm mb-1.5">Drop Location</label><input type="text" value={studentForm.dropLocation} onChange={e => setStudentForm({ ...studentForm, dropLocation: e.target.value })} className="input-field" placeholder="College Campus (Main)" /></div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1.5">Assigned Bus</label>
                        <select value={studentForm.assignedBus} onChange={e => setStudentForm({ ...studentForm, assignedBus: e.target.value })} className="input-field">
                          <option value="">None</option>
                          {buses.map(b => <option key={b.id} value={b.id}>{b.number} — {b.route}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowStudentModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={editingStudent ? handleEditStudent : handleAddStudent} className="btn-primary flex-1">{editingStudent ? 'Save' : 'Add Student'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── BUS ALLOTMENT ─── */}
          {activeTab === 'allotment' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">Bus Allotment</h2>
              <p className="text-white/40 text-sm mb-6">Assign drivers to buses. One driver can only be assigned to one bus at a time.</p>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Bus #', 'Route', 'Current Driver', 'Assign Driver'].map(h => (
                          <th key={h} className="text-left p-4 text-white/40 text-xs uppercase tracking-wider font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {buses.map(bus => {
                        const currentDriver = driversList.find(d => d.id === bus.assignedDriver);
                        return (
                          <tr key={bus.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center"><Bus className="w-4 h-4 text-primary-400" /></div>
                                <span className="text-white font-medium text-sm">{bus.number}</span>
                              </div>
                            </td>
                            <td className="p-4 text-white/60 text-sm">{bus.route}</td>
                            <td className="p-4">
                              {currentDriver ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">{currentDriver.name?.charAt(0)}</div>
                                  <div>
                                    <p className="text-white/80 text-sm">{currentDriver.name}</p>
                                    <p className="text-white/30 text-xs">{currentDriver.driverId}</p>
                                  </div>
                                </div>
                              ) : <span className="text-white/30 text-sm italic">Not assigned</span>}
                            </td>
                            <td className="p-4">
                              <select
                                value={bus.assignedDriver || ''}
                                onChange={e => { if (e.target.value) handleAllotBus(bus.id, e.target.value); }}
                                className="input-field py-2 text-sm max-w-[220px]"
                              >
                                <option value="">Select driver...</option>
                                {driversList.map(d => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} {d.assignedBus && d.assignedBus !== bus.id ? `(on ${buses.find(b => b.id === d.assignedBus)?.number || '?'})` : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── LIVE MAP ─── */}
          {activeTab === 'map' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Live Bus Map</h2>
              <div className="glass-card p-4">
                <MapView
                  height="calc(100vh - 220px)"
                  busLocations={Object.entries(liveLocations).map(([busId, loc]) => {
                    const b = buses.find(x => x.id === busId);
                    return { id: busId, number: b?.number || busId, lat: loc.lat, lng: loc.lng, isActive: true, speed: loc.speed };
                  })}
                />
                <div className="mt-3 flex items-center gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-500" /> Active: {Object.keys(liveLocations).length}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Total: {buses.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Send Notifications</h2>
              <div className="glass-card p-6 max-w-2xl">
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1.5 font-medium">Message</label><textarea value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} className="input-field h-28 resize-none text-base leading-relaxed" placeholder="Type your notification message..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1.5 font-medium">Target</label><select value={notifForm.targetRole} onChange={e => setNotifForm({ ...notifForm, targetRole: e.target.value })} className="input-field"><option value="all">All Users</option><option value="student">Students Only</option><option value="driver">Drivers Only</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1.5 font-medium">Type</label><select value={notifForm.type} onChange={e => setNotifForm({ ...notifForm, type: e.target.value })} className="input-field"><option value="info">ℹ️ Info</option><option value="warning">⚠️ Warning</option><option value="delay">⏰ Delay</option><option value="arrival">🚌 Arrival</option></select></div>
                  </div>
                  <button onClick={handleSendNotification} disabled={!notifForm.message} className="btn-primary flex items-center gap-2 text-base"><Send className="w-4 h-4" /> Send Notification</button>
                  {notifSent && <div className="flex items-center gap-2 text-emerald-400 text-sm animate-fade-in"><CheckCircle className="w-4 h-4" /> Notification sent successfully!</div>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
