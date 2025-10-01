import React from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">سياسة الخصوصية</h1>
              <p className="text-gray-600">آخر تحديث: 1 أكتوبر 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8 prose prose-lg max-w-none">
          <h2>مقدمة</h2>
          <p>
            تطبيق متتبع السعرات الحرارية ("نحن" أو "التطبيق") ملتزم بحماية خصوصيتك. 
            توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيق تتبع السعرات الحرارية.
          </p>

          <h2>المعلومات التي نجمعها</h2>
          
          <h3>المعلومات الشخصية</h3>
          <ul>
            <li><strong>معلومات الحساب</strong>: عنوان البريد الإلكتروني والاسم ومعلومات الملف الشخصي</li>
            <li><strong>البيانات الصحية</strong>: السعرات الحرارية المتناولة واستهلاك الطعام والمعلومات الغذائية</li>
            <li><strong>بيانات اللياقة البدنية</strong>: عند ربط Google Fit، نصل إلى:
              <ul>
                <li>السعرات الحرارية المحروقة</li>
                <li>عدد الخطوات</li>
                <li>المسافة المقطوعة</li>
                <li>معدل ضربات القلب</li>
                <li>معلومات النشاط البدني</li>
              </ul>
            </li>
          </ul>

          <h3>المعلومات المجمعة تلقائياً</h3>
          <ul>
            <li><strong>بيانات الاستخدام</strong>: كيفية تفاعلك مع التطبيق</li>
            <li><strong>معلومات الجهاز</strong>: نوع المتصفح ونظام التشغيل</li>
            <li><strong>بيانات السجل</strong>: عنوان IP وأوقات الوصول والصفحات المعروضة</li>
          </ul>

          <h2>كيف نستخدم معلوماتك</h2>
          <p>نستخدم معلوماتك من أجل:</p>
          <ul>
            <li>توفير تتبع السعرات الحرارية والتحليل الغذائي</li>
            <li>مزامنة بيانات اللياقة البدنية من Google Fit</li>
            <li>إنشاء رؤى وتقارير صحية</li>
            <li>تحسين خدماتنا</li>
            <li>التواصل معك حول حسابك</li>
          </ul>

          <h2>تكامل Google Fit</h2>
          <p>عند ربط Google Fit:</p>
          <ul>
            <li>نصل فقط إلى بيانات اللياقة البدنية التي تسمح بها صراحة</li>
            <li>تُستخدم البيانات فقط لأغراض تتبع السعرات الحرارية</li>
            <li>لا نشارك بيانات لياقتك البدنية مع أطراف ثالثة</li>
            <li>يمكنك قطع الاتصال مع Google Fit في أي وقت</li>
          </ul>

          <h2>أمان البيانات</h2>
          <p>نطبق تدابير أمنية مناسبة لحماية معلوماتك:</p>
          <ul>
            <li>نقل البيانات المشفرة (HTTPS)</li>
            <li>تخزين آمن في قاعدة البيانات</li>
            <li>تحديثات أمنية منتظمة</li>
            <li>وصول محدود للبيانات الشخصية</li>
          </ul>

          <h2>الاحتفاظ بالبيانات</h2>
          <ul>
            <li><strong>بيانات الحساب</strong>: محتفظ بها أثناء نشاط حسابك</li>
            <li><strong>بيانات اللياقة البدنية</strong>: محتفظ بها لأغراض التتبع التاريخي</li>
            <li>يمكنك طلب حذف البيانات في أي وقت</li>
          </ul>

          <h2>حقوقك</h2>
          <p>لديك الحق في:</p>
          <ul>
            <li>الوصول إلى بياناتك الشخصية</li>
            <li>تصحيح المعلومات غير الدقيقة</li>
            <li>حذف حسابك وبياناتك</li>
            <li>قطع الاتصال مع التكاملات الخارجية</li>
            <li>تصدير بياناتك</li>
          </ul>

          <h2>الخدمات الخارجية</h2>
          <p>نتكامل مع:</p>
          <ul>
            <li><strong>Google Fit</strong>: لمزامنة بيانات اللياقة البدنية</li>
            <li><strong>MongoDB</strong>: لتخزين البيانات الآمن</li>
            <li><strong>Vercel</strong>: لاستضافة التطبيق</li>
          </ul>

          <h2>التغييرات على هذه السياسة</h2>
          <p>
            قد نحدث سياسة الخصوصية هذه بشكل دوري. سنخطرك بالتغييرات المهمة عبر البريد الإلكتروني أو إشعار التطبيق.
          </p>

          <h2>اتصل بنا</h2>
          <p>إذا كان لديك أسئلة حول سياسة الخصوصية هذه، اتصل بنا على:</p>
          <ul>
            <li>البريد الإلكتروني: support@calories-tracker.com</li>
            <li>الموقع الإلكتروني: calories-tracker.vercel.app</li>
          </ul>

          <h2>الامتثال</h2>
          <p>تتوافق هذه السياسة مع:</p>
          <ul>
            <li>سياسة بيانات المستخدم لخدمات Google API</li>
            <li>اللائحة العامة لحماية البيانات (GDPR)</li>
            <li>قانون خصوصية المستهلك في كاليفورنيا (CCPA)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
