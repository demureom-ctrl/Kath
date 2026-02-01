// ==========================================
// Users Page - User Management & Activity Log (Admin Only)
// ==========================================

import { useState, useMemo } from 'react';
import { Header } from '../components/Layout';
import { useAuth, UserRole } from '../context/AuthContext';
import { useActivity, ActivityType } from '../context/ActivityContext';

// Activity type labels in Arabic
const ACTIVITY_LABELS: Record<ActivityType, { label: string; icon: string; color: string }> = {
    login: { label: 'تسجيل دخول', icon: '🔓', color: 'bg-green-100 text-green-700' },
    logout: { label: 'تسجيل خروج', icon: '🔒', color: 'bg-gray-100 text-gray-700' },
    sale_completed: { label: 'عملية بيع', icon: '💰', color: 'bg-blue-100 text-blue-700' },
    inventory_added: { label: 'إضافة مخزون', icon: '📦', color: 'bg-purple-100 text-purple-700' },
    inventory_updated: { label: 'تعديل مخزون', icon: '✏️', color: 'bg-yellow-100 text-yellow-700' },
    inventory_restocked: { label: 'تزويد مخزون', icon: '📥', color: 'bg-teal-100 text-teal-700' },
    product_added: { label: 'إضافة منتج', icon: '➕', color: 'bg-indigo-100 text-indigo-700' },
    product_updated: { label: 'تعديل منتج', icon: '✏️', color: 'bg-orange-100 text-orange-700' },
    product_deleted: { label: 'حذف منتج', icon: '🗑️', color: 'bg-red-100 text-red-700' },
};

export function UsersPage() {
    const { users, user: currentUser, addUser, deleteUser } = useAuth();
    const { activities, clearActivities, logActivity } = useActivity();

    const [activeTab, setActiveTab] = useState<'users' | 'activities'>('users');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [activityFilter, setActivityFilter] = useState<ActivityType | 'all'>('all');

    // Add User Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('staff');
    const [addError, setAddError] = useState('');

    // Filter activities
    const filteredActivities = useMemo(() => {
        let filtered = [...activities].reverse(); // Most recent first

        if (selectedUser) {
            filtered = filtered.filter(a => a.userId === selectedUser);
        }

        if (activityFilter !== 'all') {
            filtered = filtered.filter(a => a.type === activityFilter);
        }

        return filtered;
    }, [activities, selectedUser, activityFilter]);

    // Get user stats
    const getUserStats = (userId: string) => {
        const userActivities = activities.filter(a => a.userId === userId);
        const sales = userActivities.filter(a => a.type === 'sale_completed').length;
        const lastActivity = userActivities.length > 0
            ? userActivities[userActivities.length - 1].timestamp
            : null;

        return { totalActivities: userActivities.length, sales, lastActivity };
    };

    // Format relative time
    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    };

    // Format full date
    const formatFullDate = (date: Date) => {
        return new Intl.DateTimeFormat('ar-OM', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');

        if (!newUsername || !newName || !newPassword) {
            setAddError('جميع الحقول مطلوبة');
            return;
        }

        const result = await addUser({
            username: newUsername,
            name: newName,
            role: newRole,
            password: newPassword,
        });

        if (result.success) {
            setShowAddModal(false);
            setNewUsername('');
            setNewName('');
            setNewPassword('');
            setNewRole('staff');
            logActivity('inventory_updated', `إضافة مستخدم جديد: ${newName} (${newRole === 'admin' ? 'مدير' : 'موظف'})`);
        } else {
            setAddError(result.error || 'فشل إضافة المستخدم');
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`هل أنت متأكد من حذف المستخدم ${name}؟`)) {
            const result = await deleteUser(id);
            if (result.success) {
                logActivity('inventory_updated', `حذف مستخدم: ${name}`);
            } else {
                alert(result.error);
            }
        }
    };

    return (
        <div className="flex flex-col h-screen pb-20">
            <Header
                title="إدارة المستخدمين"
                subtitle={`${users.length} مستخدمين • ${activities.length} نشاط`}
            />

            <div className="flex-1 px-4 overflow-y-auto">
                {/* Tab Switcher */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-2 rounded-xl font-medium transition-colors ${activeTab === 'users'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        👥 المستخدمين
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`flex-1 py-2 rounded-xl font-medium transition-colors ${activeTab === 'activities'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        📋 سجل النشاطات
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-3 bg-[#556c33] text-white rounded-xl font-semibold shadow-md active:scale-98 transition-transform flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            إضافة مستخدم جديد
                        </button>

                        {users.map((user) => {
                            const stats = getUserStats(user.id);
                            return (
                                <div
                                    key={user.id}
                                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${user.role === 'admin'
                                                ? 'bg-yellow-100'
                                                : 'bg-blue-100'
                                                }`}>
                                                {user.role === 'admin' ? '👑' : '👤'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                                <p className="text-gray-500 text-sm">
                                                    @{user.username} • {user.role === 'admin' ? 'مدير' : 'موظف'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role === 'admin' ? '🔑 مدير' : '👤 موظف'}
                                            </span>
                                            {user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                                                    title="حذف المستخدم"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <p className="text-gray-500 text-xs">النشاطات</p>
                                            <p className="font-bold text-gray-900">{stats.totalActivities}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <p className="text-gray-500 text-xs">المبيعات</p>
                                            <p className="font-bold text-gray-900">{stats.sales}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <p className="text-gray-500 text-xs">آخر نشاط</p>
                                            <p className="font-bold text-gray-900 text-xs">
                                                {stats.lastActivity ? formatRelativeTime(stats.lastActivity) : 'لا يوجد'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* View Activities Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedUser(user.id);
                                            setActiveTab('activities');
                                        }}
                                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        عرض سجل النشاطات
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'activities' && (
                    <>
                        {/* Filters */}
                        <div className="space-y-3 mb-4">
                            {/* User Filter */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!selectedUser
                                        ? 'bg-[#556c33] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    الكل
                                </button>
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user.id)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedUser === user.id
                                            ? 'bg-[#556c33] text-white'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {user.name}
                                    </button>
                                ))}
                            </div>

                            {/* Activity Type Filter */}
                            <select
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value as ActivityType | 'all')}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                            >
                                <option value="all">جميع النشاطات</option>
                                {Object.entries(ACTIVITY_LABELS).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value.icon} {value.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Button */}
                        {activities.length > 0 && (
                            <button
                                onClick={clearActivities}
                                className="w-full mb-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                                🗑️ مسح جميع السجلات
                            </button>
                        )}

                        {/* Activities List */}
                        {filteredActivities.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">📋</span>
                                </div>
                                <p className="text-gray-500">لا توجد نشاطات مسجلة</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-6">
                                {filteredActivities.map((activity) => {
                                    const activityInfo = ACTIVITY_LABELS[activity.type];
                                    return (
                                        <div
                                            key={activity.id}
                                            className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${activityInfo.color}`}>
                                                    {activityInfo.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-900 text-sm">{activity.userName}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-xs ${activity.userRole === 'admin'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {activity.userRole === 'admin' ? 'مدير' : 'موظف'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{activity.description}</p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {formatFullDate(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-sm animate-slide-up shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">إضافة مستخدم جديد</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4">
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                        placeholder="مثال: أحمد محمد"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">اسم المستخدم (للدخول)</label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                        placeholder="مثال: ahmed"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">الصلاحية</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('staff')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 ${newRole === 'staff'
                                                ? 'border-[#556c33] bg-[#556c33]/5 text-[#556c33] font-medium'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            👤 موظف
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('admin')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 ${newRole === 'admin'
                                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-medium'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            👑 مدير
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {newRole === 'admin'
                                            ? 'المدير: يمكنه الوصول لجميع الصفحات وإدارة المستخدمين والمخزون.'
                                            : 'الموظف: يمكنه الوصول لصفحة البيع فقط.'
                                        }
                                    </p>
                                </div>

                                {addError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                                        {addError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-[#556c33] text-white rounded-xl font-semibold shadow-md active:scale-98 transition-transform"
                                >
                                    حفظ المستخدم
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersPage;
