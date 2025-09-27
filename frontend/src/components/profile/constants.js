// Profile-related constants and options

export const activityOptions = [
  { value: 'sedentary', label: 'خامل' },
  { value: 'light', label: 'نشاط خفيف' },
  { value: 'moderate', label: 'نشاط متوسط' },
  { value: 'active', label: 'نشاط عالي' },
  { value: 'very_active', label: 'نشاط عالي جداً' },
]

export const goalOptions = [
  { value: 'lose_weight', label: 'خسارة وزن' },
  { value: 'maintain_weight', label: 'ثبات الوزن' },
  { value: 'gain_weight', label: 'زيادة وزن' },
]

export const profileSections = [
  {
    id: 'personal',
    label: 'المعلومات الشخصية',
    icon: 'UserCircle',
    description: 'الاسم والصورة والبيانات الأساسية'
  },
  {
    id: 'goals',
    label: 'الأهداف والتغذية',
    icon: 'Target',
    description: 'الأهداف اليومية وحساب الماكروز'
  },
  {
    id: 'security',
    label: 'الأمان والحساب',
    icon: 'Lock',
    description: 'كلمة المرور وإعدادات الحساب'
  },
  {
    id: 'data',
    label: 'إدارة البيانات',
    icon: 'Database',
    description: 'النسخ الاحتياطي واستيراد البيانات'
  }
]
