import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  UserPlus, 
  Crown,
  Calendar,
  Activity,
  Mail,
  Phone,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Target,
  TrendingUp,
  Clock,
  Utensils
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, roles: {}, recentUsers: 0 })
  const [pagination, setPagination] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  
  // Filters and search
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit,
          search,
          role: roleFilter,
          sortBy,
          sortOrder
        }
      })
      setUsers(data.users)
      setStats(data.stats || { total: 0, roles: {}, recentUsers: 0 })
      setPagination(data.pagination)
    } catch (error) {
      console.error('Load users error:', error)
      toast.error('فشل في تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, search, roleFilter, sortBy, sortOrder])

  // Load user details
  const loadUserDetails = async (userId) => {
    try {
      const { data } = await api.get(`/admin/users/${userId}`)
      setSelectedUser(data)
      setShowUserModal(true)
    } catch (error) {
      console.error('Load user details error:', error)
      toast.error('فشل في تحميل تفاصيل المستخدم')
    }
  }

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await api.delete(`/admin/users/${userToDelete._id}`)
      toast.success('تم حذف المستخدم بنجاح')
      setShowDeleteModal(false)
      setUserToDelete(null)
      loadUsers()
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('فشل في حذف المستخدم')
    }
  }

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole })
      toast.success('تم تحديث دور المستخدم')
      loadUsers()
    } catch (error) {
      console.error('Update role error:', error)
      toast.error('فشل في تحديث دور المستخدم')
    }
  }

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'اليوم'
    if (days === 1) return 'أمس'
    if (days < 7) return `منذ ${days} أيام`
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`
    return `منذ ${Math.floor(days / 30)} شهور`
  }

  // Get user status color based on multiple activity indicators
  const getUserStatusColor = (user) => {
    const now = new Date()
    
    // Priority order for activity detection:
    // 1. Last login time (most accurate)
    // 2. Profile updates (user interaction)
    // 3. Account creation (fallback)
    
    let lastActivity
    if (user.lastLoginAt) {
      lastActivity = new Date(user.lastLoginAt)
    } else {
      // Fallback to updatedAt if no login tracking
      lastActivity = new Date(user.updatedAt)
    }
    
    const hoursSinceActive = (now - lastActivity) / (1000 * 60 * 60)
    const daysSinceActive = hoursSinceActive / 24
    
    // More granular activity detection
    if (hoursSinceActive < 2) return 'bg-green-500'      // Active (within 2 hours)
    if (daysSinceActive < 3) return 'bg-yellow-500'      // Inactive (2 hours - 3 days)
    return 'bg-gray-400'                                 // Dormant (>3 days)
  }

  // Get user status text
  const getUserStatusText = (user) => {
    const now = new Date()
    
    let lastActivity
    if (user.lastLoginAt) {
      lastActivity = new Date(user.lastLoginAt)
    } else {
      lastActivity = new Date(user.updatedAt)
    }
    
    const hoursSinceActive = (now - lastActivity) / (1000 * 60 * 60)
    const daysSinceActive = hoursSinceActive / 24
    
    if (hoursSinceActive < 2) return 'نشط الآن'
    if (daysSinceActive < 3) return 'غير نشط'
    return 'خامل'
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة المستخدمين</h1>
            <p className="text-slate-500 mt-1">عرض وإدارة جميع مستخدمي النظام</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
          <Crown className="w-4 h-4" />
          <span className="font-medium">لوحة الإدارة</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats?.total ?? 0}</div>
              <div className="text-sm text-slate-500">إجمالي المستخدمين</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats?.recentUsers ?? 0}</div>
              <div className="text-sm text-slate-500">مستخدمون جدد (30 يوم)</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats?.roles?.admin ?? 0}</div>
              <div className="text-sm text-slate-500">المديرون</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats?.roles?.user ?? 0}</div>
              <div className="text-sm text-slate-500">المستخدمون العاديون</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            className="input w-full md:w-48"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">جميع الأدوار</option>
            <option value="user">مستخدم عادي</option>
            <option value="admin">مدير</option>
          </select>

          {/* Sort */}
          <select
            className="input w-full md:w-48"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}
          >
            <option value="createdAt-desc">الأحدث أولاً</option>
            <option value="createdAt-asc">الأقدم أولاً</option>
            <option value="name-asc">الاسم (أ-ي)</option>
            <option value="name-desc">الاسم (ي-أ)</option>
            <option value="email-asc">البريد (أ-ي)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-slate-500">جاري تحميل المستخدمين...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <div>لا توجد مستخدمون</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right p-4 font-semibold text-slate-700">المستخدم</th>
                    <th className="text-right p-4 font-semibold text-slate-700">الدور</th>
                    <th className="text-right p-4 font-semibold text-slate-700">تاريخ التسجيل</th>
                    <th className="text-right p-4 font-semibold text-slate-700">آخر نشاط</th>
                    <th className="text-right p-4 font-semibold text-slate-700">الحالة</th>
                    <th className="text-center p-4 font-semibold text-slate-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold ${user.avatar ? 'hidden' : 'flex'}`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getUserStatusColor(user)} rounded-full border-2 border-white`}></div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' && <Crown className="w-3 h-3" />}
                          {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatRelativeTime(user.updatedAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          getUserStatusColor(user) === 'bg-green-500' 
                            ? 'bg-green-100 text-green-700' 
                            : getUserStatusColor(user) === 'bg-yellow-500'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {getUserStatusText(user)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => loadUserDetails(user._id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => updateUserRole(user._id, 'admin')}
                              className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="ترقية إلى مدير"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}
                          
                          {user.role === 'admin' && user._id !== currentUser._id && (
                            <button
                              onClick={() => updateUserRole(user._id, 'user')}
                              className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="إلغاء الإدارة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          
                          {user._id !== currentUser._id && (
                            <button
                              onClick={() => {
                                setUserToDelete(user)
                                setShowDeleteModal(true)
                              }}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  عرض {((pagination.current - 1) * pagination.limit) + 1} إلى {Math.min(pagination.current * pagination.limit, pagination.total)} من {pagination.total} مستخدم
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            page === currentPage
                              ? 'bg-primary-500 text-white'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">تفاصيل المستخدم</h3>
                    <p className="text-blue-100">عرض شامل لبيانات ونشاط المستخدم</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="p-8 space-y-8">
                {/* Enhanced User Profile Card */}
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        {selectedUser.user.avatar ? (
                          <img 
                            src={selectedUser.user.avatar} 
                            alt={selectedUser.user.name}
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl group-hover:shadow-2xl transition-all duration-300 ${selectedUser.user.avatar ? 'hidden' : 'flex'}`}
                        >
                          {selectedUser.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-slate-800 mb-1">{selectedUser.user.name}</h4>
                        <p className="text-slate-600 mb-3 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedUser.user.email}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                            selectedUser.user.role === 'admin' 
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                              : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                          }`}>
                            {selectedUser.user.role === 'admin' && <Crown className="w-4 h-4" />}
                            {selectedUser.user.role === 'admin' ? '👑 مدير النظام' : '👤 مستخدم عادي'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4 text-center shadow-md">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Utensils className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-lg font-bold text-slate-800">{selectedUser.activity?.totalMeals || 0}</div>
                        <div className="text-xs text-slate-500">إجمالي الوجبات</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-md">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-lg font-bold text-slate-800">{selectedUser.activity?.totalFoods || 0}</div>
                        <div className="text-xs text-slate-500">أطعمة مضافة</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-md">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="text-lg font-bold text-slate-800">{selectedUser.activity?.recentMeals || 0}</div>
                        <div className="text-xs text-slate-500">وجبات حديثة</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-md">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-lg font-bold text-slate-800">
                          {selectedUser.activity?.lastActive ? formatRelativeTime(selectedUser.activity.lastActive) : 'غير متوفر'}
                        </div>
                        <div className="text-xs text-slate-500">آخر نشاط</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Profile Information */}
                {selectedUser.user.profile && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <h5 className="text-lg font-bold text-slate-800">المعلومات الشخصية</h5>
                      </div>
                      <div className="space-y-4">
                        {selectedUser.user.profile.age && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">العمر:</span>
                            <span className="text-slate-800 font-semibold">{selectedUser.user.profile.age} سنة</span>
                          </div>
                        )}
                        {selectedUser.user.profile.gender && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">النوع:</span>
                            <span className="text-slate-800 font-semibold">
                              {selectedUser.user.profile.gender === 'male' ? '👨 ذكر' : '👩 أنثى'}
                            </span>
                          </div>
                        )}
                        {selectedUser.user.profile.height && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">الطول:</span>
                            <span className="text-slate-800 font-semibold">{selectedUser.user.profile.height} سم</span>
                          </div>
                        )}
                        {selectedUser.user.profile.weight && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">الوزن:</span>
                            <span className="text-slate-800 font-semibold">{selectedUser.user.profile.weight} كجم</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-semibold text-slate-700">إحصائيات النشاط</h5>
                    <div className="flex justify-between">
                      <span className="text-slate-500">إجمالي الوجبات:</span>
                      <span className="text-slate-800">{selectedUser.activity.totalMeals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الأطعمة المضافة:</span>
                      <span className="text-slate-800">{selectedUser.activity.totalFoods}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وجبات حديثة:</span>
                      <span className="text-slate-800">{selectedUser.activity.recentMeals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">آخر نشاط:</span>
                      <span className="text-slate-800">{formatRelativeTime(selectedUser.activity.lastActive)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Meals */}
              {selectedUser.recentMeals && selectedUser.recentMeals.length > 0 && (
                <div>
                  <h5 className="font-semibold text-slate-700 mb-3">الوجبات الأخيرة</h5>
                  <div className="space-y-2">
                    {selectedUser.recentMeals.map((meal, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-800">{formatDate(meal.date)}</div>
                          <div className="text-sm text-slate-500">{meal.totalCalories} سعرة حرارية</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatRelativeTime(meal.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">تاريخ التسجيل:</span>
                    <span className="text-slate-800">{formatDate(selectedUser.user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">آخر تحديث:</span>
                    <span className="text-slate-800">{formatDate(selectedUser.user.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">حذف المستخدم</h3>
                  <p className="text-slate-600">هل أنت متأكد من حذف هذا المستخدم؟</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="font-medium text-red-800">{userToDelete.name}</div>
                <div className="text-sm text-red-600">{userToDelete.email}</div>
                <div className="text-xs text-red-500 mt-2">
                  سيتم حذف جميع البيانات المرتبطة بهذا المستخدم نهائياً
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={deleteUser}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  حذف نهائي
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
