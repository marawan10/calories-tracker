import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, Utensils } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { register: reg, handleSubmit, formState: { errors } } = useForm()
  const { login, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (values) => {
    await login(values.email, values.password)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm"
          >
            <Utensils className="w-12 h-12" />
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold mb-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            كُل بحساب
          </motion.h1>
          <motion.p 
            className="text-xl text-center text-white/90 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            تتبع تغذيتك بذكاء وحقق أهدافك الصحية
          </motion.p>
          <motion.div 
            className="grid grid-cols-3 gap-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">100+</div>
              <div className="text-sm text-white/80">طعام</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-white/80">تتبع</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-white/80">دقة</div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
            <div className="text-center mb-8">
              <motion.div 
                className="inline-flex items-center gap-3 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">كُل بحساب</span>
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold text-slate-800 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                مرحباً بعودتك
              </motion.h1>
              <motion.p 
                className="text-slate-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                سجل دخولك لمتابعة رحلتك الصحية
              </motion.p>
            </div>

            <motion.form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    className={`input w-full pr-12 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'}`}
                    type="email" 
                    placeholder="example@email.com" 
                    {...reg('email', { 
                      required: 'البريد الإلكتروني مطلوب',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'البريد الإلكتروني غير صحيح'
                      }
                    })} 
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    className={`input w-full pr-12 pl-12 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    {...reg('password', { 
                      required: 'كلمة المرور مطلوبة'
                    })} 
                  />
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <motion.button 
                disabled={loading} 
                className="btn-primary w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.div 
              className="text-center mt-8 pt-6 border-t border-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <p className="text-slate-600">
                ليس لديك حساب؟{' '}
                <Link 
                  to="/register" 
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
