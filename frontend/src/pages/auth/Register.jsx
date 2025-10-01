import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Utensils, Calendar, Ruler, Scale } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register: reg, handleSubmit, formState: { errors }, watch } = useForm()
  const { register: doRegister, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const watchedFields = watch()

  const onSubmit = async (values) => {
    await doRegister({ 
      name: values.name, 
      email: values.email, 
      password: values.password,
      age: Number(values.age),
      gender: values.gender || undefined,
      height: values.height ? Number(values.height) : undefined,
      weight: values.weight ? Number(values.weight) : undefined,
    })
  }

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStep1Valid = watchedFields.name && watchedFields.email && watchedFields.password && watchedFields.age

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden"
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
            ابدأ رحلتك الصحية
          </motion.h1>
          <motion.p 
            className="text-xl text-center text-white/90 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            انضم إلى آلاف المستخدمين الذين حققوا أهدافهم الصحية
          </motion.p>
          <motion.div 
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <span>تتبع دقيق للسعرات والماكروز</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span>حساب دقيق للـ BMI والسعرات اليومية</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span>تقارير يومية وأسبوعية شاملة</span>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div 
          className="w-full max-w-lg"
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
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
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
                إنشاء حساب جديد
              </motion.h1>
              <motion.p 
                className="text-slate-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                املأ البيانات التالية لبدء رحلتك الصحية
              </motion.p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 rounded-full ${
                  currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
              </div>
            </div>

            <motion.form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {currentStep === 1 && (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        className={`input w-full pr-12 ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
                        placeholder="أدخل اسمك الكامل" 
                        {...reg('name', { 
                          required: 'الاسم مطلوب',
                          minLength: {
                            value: 2,
                            message: 'الاسم يجب أن يكون حرفين على الأقل'
                          }
                        })} 
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        className={`input w-full pr-12 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
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
                        className={`input w-full pr-12 pl-12 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" 
                        {...reg('password', { 
                          required: 'كلمة المرور مطلوبة',
                          minLength: {
                            value: 6,
                            message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
                          }
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">العمر</label>
                    <div className="relative">
                      <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        className={`input w-full pr-12 ${errors.age ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
                        type="number" 
                        placeholder="العمر بالسنوات" 
                        {...reg('age', { 
                          required: 'العمر مطلوب',
                          min: {
                            value: 13,
                            message: 'العمر يجب أن يكون 13 سنة على الأقل'
                          },
                          max: {
                            value: 120,
                            message: 'العمر يجب أن يكون أقل من 120 سنة'
                          }
                        })} 
                      />
                    </div>
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                    )}
                  </div>

                  <motion.button 
                    type="button"
                    onClick={nextStep}
                    disabled={!isStep1Valid}
                    className="btn-primary w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: isStep1Valid ? 1.02 : 1 }}
                    whileTap={{ scale: isStep1Valid ? 0.98 : 1 }}
                  >
                    التالي - المعلومات الإضافية
                  </motion.button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">معلومات إضافية (اختيارية)</h3>
                    <p className="text-sm text-slate-500">ستساعدنا هذه المعلومات في تقديم تجربة أفضل لك</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الجنس</label>
                    <select 
                      className="input w-full border-slate-300 focus:border-emerald-500"
                      {...reg('gender')}
                    >
                      <option value="">اختر الجنس (اختياري)</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">الطول (سم)</label>
                      <div className="relative">
                        <Ruler className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          className="input w-full pr-12 border-slate-300 focus:border-emerald-500"
                          type="number" 
                          step="0.1"
                          placeholder="170"
                          {...reg('height', {
                            min: {
                              value: 100,
                              message: 'الطول يجب أن يكون 100 سم على الأقل'
                            },
                            max: {
                              value: 250,
                              message: 'الطول يجب أن يكون أقل من 250 سم'
                            }
                          })} 
                        />
                      </div>
                      {errors.height && (
                        <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">الوزن (كجم)</label>
                      <div className="relative">
                        <Scale className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          className="input w-full pr-12 border-slate-300 focus:border-emerald-500"
                          type="number" 
                          step="0.1"
                          placeholder="70"
                          {...reg('weight', {
                            min: {
                              value: 30,
                              message: 'الوزن يجب أن يكون 30 كجم على الأقل'
                            },
                            max: {
                              value: 300,
                              message: 'الوزن يجب أن يكون أقل من 300 كجم'
                            }
                          })} 
                        />
                      </div>
                      {errors.weight && (
                        <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button 
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-4 text-lg font-semibold border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      السابق
                    </motion.button>

                    <motion.button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          إنشاء الحساب
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.form>

            <motion.div 
              className="text-center mt-8 pt-6 border-t border-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <p className="text-slate-600">
                لديك حساب بالفعل؟{' '}
                <Link 
                  to="/login" 
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
