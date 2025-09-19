import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export default function Register() {
  const { register: reg, handleSubmit } = useForm()
  const { register: doRegister, loading } = useAuth()

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

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-50 to-pink-50">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} className="w-full max-w-md card p-6">
        <div className="text-center mb-6">
          <div className="inline-block rounded-2xl px-4 py-2 text-white bg-gradient-to-br from-purple-600 to-pink-600 font-bold">كُل بحساب</div>
          <h1 className="text-xl font-bold mt-3">إنشاء حساب</h1>
          <p className="text-slate-500 text-sm mt-1">ابدأ رحلتك الصحية اليوم</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">الاسم</label>
            <input className="input" placeholder="اسمك" {...reg('name', { required: true })} />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" placeholder="example@email.com" {...reg('email', { required: true })} />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="input" type="password" placeholder="••••••••" {...reg('password', { required: true, minLength: 6 })} />
          </div>
          <div>
            <label className="label">العمر</label>
            <input className="input" type="number" placeholder="سنوات" {...reg('age', { required: true, min: 1, max: 120 })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">النوع</label>
              <select className="input" {...reg('gender')}>
                <option value="">غير محدد</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="label">الطول (سم)</label>
              <input className="input" type="number" step="0.1" {...reg('height')} />
            </div>
            <div>
              <label className="label">الوزن (كجم)</label>
              <input className="input" type="number" step="0.1" {...reg('weight')} />
            </div>
          </div>
          <button disabled={loading} className="btn-primary w-full" type="submit">
            {loading ? '...جاري إنشاء الحساب' : 'إنشاء حساب'}
          </button>
        </form>
        <div className="text-center text-sm text-slate-600 mt-4">
          لديك حساب بالفعل؟ <Link to="/login" className="text-purple-600 font-medium">تسجيل الدخول</Link>
        </div>
      </motion.div>
    </div>
  )
}
