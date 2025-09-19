import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { register: reg, handleSubmit } = useForm()
  const { login, loading } = useAuth()

  const onSubmit = async (values) => {
    await login(values.email, values.password)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md card p-6">
        <div className="text-center mb-6">
          <div className="inline-block rounded-2xl px-4 py-2 text-white bg-gradient-to-br from-purple-600 to-pink-600 font-bold">كُل بحساب</div>
          <h1 className="text-xl font-bold mt-3">تسجيل الدخول</h1>
          <p className="text-slate-500 text-sm mt-1">مرحباً بعودتك 👋</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" placeholder="example@email.com" {...reg('email', { required: true })} />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="input" type="password" placeholder="••••••••" {...reg('password', { required: true })} />
          </div>
          <button disabled={loading} className="btn-primary w-full" type="submit">
            {loading ? '...جاري الدخول' : 'دخول'}
          </button>
        </form>
        <div className="text-center text-sm text-slate-600 mt-4">
          ليس لديك حساب؟ <Link to="/register" className="text-purple-600 font-medium">إنشاء حساب</Link>
        </div>
      </div>
    </div>
  )
}
