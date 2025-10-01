import React from 'react'
import { motion } from 'framer-motion'
import { Database, Download, Upload, FileText, BarChart3, Shield } from 'lucide-react'

const DataSection = ({ 
  onExportUserData,
  onExportToCSV,
  onExportAnalyticsReport,
  onExportHtmlReport,
  onTriggerImport,
  onImportUserData,
  exporting,
  importing,
  fileInputRef
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <motion.div 
        className="flex items-center gap-6 mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Database className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">إدارة البيانات</h2>
          <p className="text-base text-slate-600 mt-2">تصدير واستيراد البيانات والنسخ الاحتياطية بأمان وسهولة</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* JSON Backup Export */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full -translate-y-8 translate-x-8 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">نسخة احتياطية شاملة</h3>
              <p className="text-sm text-emerald-600 font-medium">JSON كامل</p>
            </div>
          </div>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            نسخة احتياطية كاملة تشمل الملف الشخصي والوجبات والأهداف اليومية مع إمكانية الاستعادة الكاملة
          </p>
          
          <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              يتضمن: الملف الشخصي + الوجبات + الأهداف + الإعدادات
            </div>
          </div>
          
          <motion.button
            onClick={onExportUserData}
            disabled={exporting}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
            whileHover={{ scale: exporting ? 1 : 1.05 }}
            whileTap={{ scale: exporting ? 1 : 0.95 }}
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                💾 تصدير النسخة الاحتياطية
              </>
            )}
          </motion.button>
        </motion.div>

        {/* CSV Export */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full -translate-y-8 translate-x-8 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">تصدير جدول البيانات</h3>
              <p className="text-sm text-blue-600 font-medium">CSV للتحليل</p>
            </div>
          </div>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            تصدير الوجبات والعناصر الغذائية كجدول بيانات لاستخدامها في Excel أو Google Sheets للتحليل المتقدم
          </p>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              متوافق مع: Excel • Google Sheets • Numbers
            </div>
          </div>
          
          <motion.button
            onClick={onExportToCSV}
            disabled={exporting}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
            whileHover={{ scale: exporting ? 1 : 1.05 }}
            whileTap={{ scale: exporting ? 1 : 0.95 }}
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                📊 تصدير جدول CSV
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Analytics Report */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group md:col-span-2 xl:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full -translate-y-8 translate-x-8 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">تقارير التحليلات</h3>
              <p className="text-sm text-purple-600 font-medium">إحصائيات متقدمة</p>
            </div>
          </div>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            تقارير شاملة تتضمن الإحصائيات والتوصيات والرسوم البيانية لآخر 30 يوم مع تحليل مفصل للتقدم
          </p>
          
          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              يشمل: الإحصائيات + الرسوم البيانية + التوصيات
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              onClick={onExportAnalyticsReport}
              disabled={exporting}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
              whileHover={{ scale: exporting ? 1 : 1.05 }}
              whileTap={{ scale: exporting ? 1 : 0.95 }}
            >
              <BarChart3 className="w-4 h-4" />
              {exporting ? 'جاري...' : '📈 JSON'}
            </motion.button>
            
            <motion.button
              onClick={onExportHtmlReport}
              disabled={exporting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
              whileHover={{ scale: exporting ? 1 : 1.05 }}
              whileTap={{ scale: exporting ? 1 : 0.95 }}
            >
              <FileText className="w-4 h-4" />
              {exporting ? 'جاري...' : '🌐 HTML'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Import Section */}
      <motion.div 
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-8 shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-800">استيراد البيانات</h3>
            <p className="text-sm text-amber-600 font-medium">استعادة من نسخة احتياطية</p>
          </div>
        </div>
        
        <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">⚠️</span>
            </div>
            <div>
              <h4 className="font-bold text-red-800 mb-2">تحذير مهم</h4>
              <p className="text-red-700 text-sm leading-relaxed">
                سيتم استبدال <strong>جميع البيانات الحالية</strong> بالبيانات المستوردة. تأكد من أن لديك نسخة احتياطية قبل المتابعة.
              </p>
            </div>
          </div>
        </div>
        
        <motion.button
          onClick={onTriggerImport}
          disabled={importing}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
          whileHover={{ scale: importing ? 1 : 1.05 }}
          whileTap={{ scale: importing ? 1 : 0.95 }}
        >
          {importing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              جاري الاستيراد...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              📂 اختيار ملف للاستيراد
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Security Notice */}
      <motion.div 
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-800 mb-4">إرشادات الأمان والخصوصية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">احتفظ بالنسخ الاحتياطية في مكان آمن ومشفر</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">لا تشارك ملفات النسخ الاحتياطي مع الآخرين</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">تأكد من صحة الملف قبل الاستيراد</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">قم بعمل نسخة احتياطية بانتظام</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">احذف الملفات المؤقتة بعد الاستيراد</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span className="text-sm">استخدم كلمات مرور قوية لحسابك</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onImportUserData}
        style={{ display: 'none' }}
      />
    </motion.div>
  )
}

export default DataSection
