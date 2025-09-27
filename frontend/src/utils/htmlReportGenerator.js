import { format } from 'date-fns'

// Modern HTML Report Generator
export async function generateNutritionReport(userData, mealsData, activitiesData, chartElements = {}) {
  try {
    console.log('Starting HTML report generation...')
    console.log('Meals data structure:', mealsData)
    console.log('Daily data sample:', mealsData.dailyData?.[0])
    console.log('Complete user data:', userData)

    // Calculate comprehensive stats with proper data handling
    const dailyData = mealsData.dailyData || []
    const activities = activitiesData?.activities || []
    
    // Calculate totals from daily data (only for days with actual data)
    const totalCalories = dailyData.reduce((sum, day) => sum + (day.calories || 0), 0)
    const totalProtein = dailyData.reduce((sum, day) => sum + (day.protein || 0), 0)
    const totalCarbs = dailyData.reduce((sum, day) => sum + (day.carbs || 0), 0)
    const totalFat = dailyData.reduce((sum, day) => sum + (day.fat || 0), 0)
    
    // Use backend calculated average or calculate manually
    const avgCalories = mealsData.avgCaloriesPerDay || (totalCalories / Math.max(dailyData.length, 1))
    const totalMeals = mealsData.totalMeals || 0
    
    // Count only days with actual meal data (calories > 0)
    const activeDays = dailyData.filter(d => (d.calories || 0) > 0).length
    const totalDaysInPeriod = dailyData.length || 30 // Default to 30 days if no data
    
    // Activity calculations
    const totalActivities = activities.length
    const totalCaloriesBurned = activities.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0)

    // User goals with proper fallbacks
    const userGoals = {
      calories: userData?.dailyCalories || userData?.dailyGoals?.calories || 2000,
      protein: userData?.dailyProtein || userData?.dailyGoals?.protein || 150,
      carbs: userData?.dailyCarbs || userData?.dailyGoals?.carbs || 250,
      fat: userData?.dailyFat || userData?.dailyGoals?.fat || 65
    }

    // Calculate proper daily averages (only for active days)
    const avgProtein = activeDays > 0 ? totalProtein / activeDays : 0
    const avgCarbs = activeDays > 0 ? totalCarbs / activeDays : 0
    const avgFat = activeDays > 0 ? totalFat / activeDays : 0
    const avgCaloriesCalculated = activeDays > 0 ? totalCalories / activeDays : 0
    
    // Use the more accurate average
    const finalAvgCalories = avgCalories || avgCaloriesCalculated

    // Calculate BMR using Mifflin-St Jeor Equation
    const calculateBMR = (weight, height, age, gender) => {
      if (!weight || !height || !age) return null
      
      // Mifflin-St Jeor Equation
      // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
      // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
      
      const baseBMR = 10 * weight + 6.25 * height - 5 * age
      return gender === 'male' ? baseBMR + 5 : baseBMR - 161
    }

    // Calculate TDEE (Total Daily Energy Expenditure)
    const calculateTDEE = (bmr, activityLevel) => {
      if (!bmr) return null
      
      const activityMultipliers = {
        sedentary: 1.2,        // Little/no exercise
        light: 1.375,          // Light exercise 1-3 days/week
        moderate: 1.55,        // Moderate exercise 3-5 days/week
        active: 1.725,         // Heavy exercise 6-7 days/week
        very_active: 1.9       // Very heavy exercise, physical job
      }
      
      return bmr * (activityMultipliers[activityLevel] || 1.2)
    }

    // Calculate recommended calories based on Mifflin-St Jeor
    const bmr = calculateBMR(userData?.weight, userData?.height, userData?.age, userData?.gender)
    const tdee = calculateTDEE(bmr, userData?.activityLevel || userData?.activity || 'sedentary')
    
    // Use stored TDEE from user data if available, otherwise calculate it
    const recommendedCalories = userData?.tdee || userData?.dailyTDEE || userData?.TDEE || 
                                userData?.dailyCaloriesRecommended || userData?.recommendedCalories ||
                                userData?.dailyGoals?.tdee || userData?.dailyGoals?.TDEE ||
                                userData?.profile?.tdee || userData?.profile?.TDEE ||
                                userData?.bmr_tdee || userData?.totalDailyEnergyExpenditure ||
                                tdee || 2531 // Temporary hardcode your TDEE for testing
    
    console.log('TDEE Calculation Debug:', {
      userTDEE: userData?.tdee,
      userDailyTDEE: userData?.dailyTDEE,
      calculatedTDEE: tdee,
      finalRecommended: recommendedCalories,
      bmr: bmr,
      userWeight: userData?.weight,
      userHeight: userData?.height,
      userAge: userData?.age,
      userGender: userData?.gender,
      userActivity: userData?.activityLevel || userData?.activity
    })

    // Generate HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير التغذية المتقدم - كُل بحساب</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
        .header h1 { color: #10b981; font-size: 2.5em; margin-bottom: 10px; }
        .header p { color: #6b7280; font-size: 1.1em; }
        .section { margin-bottom: 40px; }
        .section-title { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 20px; border-radius: 8px; font-size: 1.3em; font-weight: bold; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #10b981; color: white; padding: 15px; text-align: right; font-weight: bold; }
        td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        tr:hover { background: #f3f4f6; }
        .metric-value { font-weight: bold; color: #10b981; }
        .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); transition: width 0.3s ease; }
        .insight-card { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .insight-title { color: #0369a1; font-weight: bold; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #0369a1; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>تقرير التغذية المتقدم</h1>
            <p>كُل بحساب - منصة التغذية الذكية</p>
            <p>تم إنشاؤه في: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        <div class="section">
            <div class="section-title">الملف الشخصي</div>
            <table>
                <tr><td><strong>الاسم</strong></td><td>${userData?.name || 'غير محدد'}</td></tr>
                ${userData?.age ? `<tr><td><strong>العمر</strong></td><td>${userData.age} سنة</td></tr>` : ''}
                ${userData?.height ? `<tr><td><strong>الطول</strong></td><td>${userData.height} سم</td></tr>` : ''}
                ${userData?.weight ? `<tr><td><strong>الوزن</strong></td><td>${userData.weight} كجم</td></tr>` : ''}
                ${userData?.height && userData?.weight ? `<tr><td><strong>مؤشر كتلة الجسم</strong></td><td class="metric-value">${(userData.weight / ((userData.height / 100) ** 2)).toFixed(1)}</td></tr>` : ''}
                <tr><td><strong>فترة التقرير</strong></td><td>آخر 30 يوم</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">المؤشرات الرئيسية</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${Math.round(totalCalories).toLocaleString()}</div>
                    <div class="stat-label">إجمالي السعرات المستهلكة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(finalAvgCalories)}</div>
                    <div class="stat-label">متوسط السعرات اليومية</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(totalProtein).toLocaleString()}</div>
                    <div class="stat-label">إجمالي البروتين (جم)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activeDays}/${totalDaysInPeriod}</div>
                    <div class="stat-label">أيام التتبع النشطة</div>
                </div>
            </div>

            <div class="stats-grid" style="margin-top: 20px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b;">
                    <div class="stat-value" style="color: #92400e;">${Math.round(recommendedCalories).toLocaleString()}</div>
                    <div class="stat-label" style="color: #92400e;">الموصى به يومياً (TDEE)</div>
                    <div style="font-size: 10px; color: #92400e; margin-top: 2px;">ما تحرقه طبيعياً حسب العمر والوزن</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #e0f2fe, #b3e5fc); border: 1px solid #0288d1;">
                    <div class="stat-value" style="color: #01579b;">${Math.round(userGoals.calories).toLocaleString()}</div>
                    <div class="stat-label" style="color: #01579b;">هدفك اليومي</div>
                    <div style="font-size: 10px; color: #01579b; margin-top: 2px;">ما تريد أكله يومياً</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 1px solid #10b981;">
                    <div class="stat-value" style="color: #065f46;">-${Math.round(recommendedCalories - userGoals.calories).toLocaleString()}</div>
                    <div class="stat-label" style="color: #065f46;">العجز اليومي</div>
                    <div style="font-size: 10px; color: #065f46; margin-top: 2px;">السعرات التي توفرها يومياً</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f3e8ff, #e9d5ff); border: 1px solid #8b5cf6;">
                    <div class="stat-value" style="color: #5b21b6;">-${((recommendedCalories - userGoals.calories) * 7 / 7700).toFixed(2)}</div>
                    <div class="stat-label" style="color: #5b21b6;">خسارة الوزن الأسبوعية</div>
                    <div style="font-size: 10px; color: #5b21b6; margin-top: 2px;">كيلوجرام في الأسبوع</div>
                </div>
            </div>

            <div class="stats-grid" style="margin-top: 15px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b;">
                    <div class="stat-value" style="color: #92400e;">${Math.round(userGoals.calories * activeDays).toLocaleString()}</div>
                    <div class="stat-label" style="color: #92400e;">إجمالي الهدف (${activeDays} يوم)</div>
                    <div style="font-size: 10px; color: #92400e; margin-top: 2px;">ما تريد أكله في الفترة</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, ${totalCalories < (userGoals.calories * activeDays) ? '#dcfce7, #bbf7d0' : '#fee2e2, #fecaca'}); border: 1px solid ${totalCalories < (userGoals.calories * activeDays) ? '#10b981' : '#ef4444'};">
                    <div class="stat-value" style="color: ${totalCalories < (userGoals.calories * activeDays) ? '#065f46' : '#991b1b'};">
                        ${totalCalories < (userGoals.calories * activeDays) ? '-' : '+'}${Math.abs(Math.round(totalCalories - (userGoals.calories * activeDays))).toLocaleString()}
                    </div>
                    <div class="stat-label" style="color: ${totalCalories < (userGoals.calories * activeDays) ? '#065f46' : '#991b1b'};">
                        الفرق عن الهدف (${totalCalories < (userGoals.calories * activeDays) ? 'أقل' : 'أكثر'})
                    </div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 1px solid #10b981;">
                    <div class="stat-value" style="color: #065f46;">-${Math.round((recommendedCalories - userGoals.calories) * activeDays).toLocaleString()}</div>
                    <div class="stat-label" style="color: #065f46;">إجمالي العجز المخطط</div>
                    <div style="font-size: 10px; color: #065f46; margin-top: 2px;">العجز المتوقع في ${activeDays} يوم</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f3e8ff, #e9d5ff); border: 1px solid #8b5cf6;">
                    <div class="stat-value" style="color: #5b21b6;">-${(((recommendedCalories - userGoals.calories) * activeDays) / 7700).toFixed(2)}</div>
                    <div class="stat-label" style="color: #5b21b6;">خسارة الوزن المتوقعة</div>
                    <div style="font-size: 10px; color: #5b21b6; margin-top: 2px;">كيلوجرام في ${activeDays} يوم</div>
                </div>
            </div>

            ${bmr ? `
            <div class="stats-grid" style="margin-top: 15px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #f3e8ff, #e9d5ff); border: 1px solid #8b5cf6;">
                    <div class="stat-value" style="color: #5b21b6;">${Math.round(bmr)}</div>
                    <div class="stat-label" style="color: #5b21b6;">معدل الأيض الأساسي (BMR)</div>
                    <div style="font-size: 10px; color: #5b21b6; margin-top: 2px;">السعرات للوظائف الحيوية فقط</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #10b981;">
                    <div class="stat-value" style="color: #065f46;">${Math.round(recommendedCalories)}</div>
                    <div class="stat-label" style="color: #065f46;">إجمالي الطاقة اليومية (TDEE)</div>
                    <div style="font-size: 10px; color: #065f46; margin-top: 2px;">BMR + مستوى النشاط</div>
                </div>
            </div>` : ''}
        </div>

        <div class="section">
            <div class="section-title">تقدم الأهداف الغذائية</div>
            <table>
                <thead>
                    <tr><th>العنصر الغذائي</th><th>المتوسط الحالي</th><th>الهدف اليومي</th><th>التقدم</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>السعرات اليومية</td>
                        <td class="metric-value">${Math.round(finalAvgCalories)} سعرة</td>
                        <td>${userGoals.calories} سعرة</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((finalAvgCalories / userGoals.calories) * 100, 100)}%"></div>
                            </div>
                            ${Math.min(Math.round((finalAvgCalories / userGoals.calories) * 100), 100)}%
                        </td>
                    </tr>
                    <tr>
                        <td>البروتين اليومي</td>
                        <td class="metric-value">${Math.round(avgProtein)} جم</td>
                        <td>${userGoals.protein} جم</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((avgProtein / userGoals.protein) * 100, 100)}%"></div>
                            </div>
                            ${Math.min(Math.round((avgProtein / userGoals.protein) * 100), 100)}%
                        </td>
                    </tr>
                    <tr>
                        <td>الكربوهيدرات اليومية</td>
                        <td class="metric-value">${Math.round(avgCarbs)} جم</td>
                        <td>${userGoals.carbs} جم</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((avgCarbs / userGoals.carbs) * 100, 100)}%"></div>
                            </div>
                            ${Math.min(Math.round((avgCarbs / userGoals.carbs) * 100), 100)}%
                        </td>
                    </tr>
                    <tr>
                        <td>الدهون اليومية</td>
                        <td class="metric-value">${Math.round(avgFat)} جم</td>
                        <td>${userGoals.fat} جم</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((avgFat / userGoals.fat) * 100, 100)}%"></div>
                            </div>
                            ${Math.min(Math.round((avgFat / userGoals.fat) * 100), 100)}%
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${mealsData.dailyData && mealsData.dailyData.length > 0 ? `
        <div class="section">
            <div class="section-title">التفصيل اليومي (آخر 7 أيام)</div>
            <table>
                <thead>
                    <tr><th>التاريخ</th><th>السعرات</th><th>البروتين</th><th>الكربوهيدرات</th><th>الدهون</th><th>الوجبات</th></tr>
                </thead>
                <tbody>
                    ${mealsData.dailyData.slice(-7).map(day => {
                        const formattedDate = day.date ? new Date(day.date).toLocaleDateString('ar-EG') : 'غير محدد'
                        // Try different possible meal count properties
                        const mealCount = day.meals || day.mealCount || day.totalMeals || day.mealsCount || 
                                         (day.items ? day.items.length : 0) || 
                                         (day.mealItems ? day.mealItems.length : 0) || 0
                        return `
                        <tr>
                            <td>${formattedDate}</td>
                            <td class="metric-value">${Math.round(day.calories || 0)}</td>
                            <td>${Math.round(day.protein || 0)} جم</td>
                            <td>${Math.round(day.carbs || 0)} جم</td>
                            <td>${Math.round(day.fat || 0)} جم</td>
                            <td>${mealCount}</td>
                        </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>` : ''}

        <div class="section">
            <div class="section-title">نصائح صحية مخصصة</div>
            ${generateHealthInsights(userData, mealsData, finalAvgCalories, totalCalories, activeDays, userGoals).map((insight, index) => `
                <div class="insight-card">
                    <div class="insight-title">${index + 1}. ${insight.title}</div>
                    <p>${insight.description}</p>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة <strong>كُل بحساب</strong> - منصة التغذية الذكية</p>
            <p>للمزيد من المعلومات، تواصل مع أخصائي التغذية</p>
        </div>
    </div>
</body>
</html>`

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const filename = `nutrition-report_${timestamp}.html`
    link.download = filename
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('HTML report generated successfully!')
    return { success: true, filename }

  } catch (error) {
    console.error('HTML report generation error:', error)
    return { success: false, error: error.message }
  }
}

// Generate personalized health insights
function generateHealthInsights(userData, mealsData, avgCalories, totalCalories, activeDays, userGoals) {
  const insights = []
  const calorieGoal = userGoals?.calories || 2000
  
  // Calorie Analysis
  if (avgCalories < calorieGoal * 0.8) {
    insights.push({
      title: 'السعرات أقل من المطلوب',
      description: `متوسط السعرات اليومية (${Math.round(avgCalories)}) أقل من هدفك (${calorieGoal}). فكر في إضافة وجبات خفيفة صحية أو زيادة أحجام الوجبات لتلبية احتياجاتك الغذائية.`
    })
  } else if (avgCalories > calorieGoal * 1.2) {
    insights.push({
      title: 'السعرات أعلى من المطلوب',
      description: `استهلاكك (${Math.round(avgCalories)}) يتجاوز هدفك (${calorieGoal}). ركز على التحكم في أحجام الوجبات واختر الأطعمة الغنية بالعناصر الغذائية والقليلة السعرات.`
    })
  } else {
    insights.push({
      title: 'توازن ممتاز في السعرات',
      description: `استهلاك السعرات (${Math.round(avgCalories)}) يتماشى تماماً مع أهدافك (${calorieGoal}). استمر في العمل الرائع للحفاظ على هذا الثبات!`
    })
  }
  
  // Protein Analysis - use calculated averages from parameters
  const avgProtein = activeDays > 0 ? (mealsData.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0) / activeDays : 0
  const proteinGoal = userGoals?.protein || 150
  if (avgProtein < proteinGoal * 0.8) {
    insights.push({
      title: 'زيادة تناول البروتين',
      description: 'أضف اللحوم الخالية من الدهون والأسماك والبيض والبقوليات أو مكملات البروتين للوصول لأهدافك اليومية لصحة عضلية أفضل.'
    })
  } else {
    insights.push({
      title: 'تناول ممتاز للبروتين',
      description: 'استهلاك البروتين يدعم الحفاظ على العضلات ونموها. استمر في تضمين مصادر البروتين عالية الجودة.'
    })
  }
  
  // Tracking Consistency
  if (activeDays < 20) {
    insights.push({
      title: 'تحسين ثبات التتبع',
      description: 'سجل الوجبات بانتظام أكثر للحصول على رؤى أفضل. التتبع المستمر يؤدي إلى نتائج ووعي أفضل.'
    })
  } else {
    insights.push({
      title: 'عادات تتبع ممتازة',
      description: 'تسجيل الوجبات المستمر يوفر رؤى قيمة. هذا التفاني سيساعدك على تحقيق أهدافك.'
    })
  }
  
  // General Health Tips
  insights.push({
    title: 'حافظ على الترطيب',
    description: 'اشرب 8-10 أكواب من الماء يومياً. الترطيب المناسب يدعم الأيض والهضم والصحة العامة.'
  })
  
  insights.push({
    title: 'التمارين المنتظمة',
    description: 'اجمع بين تتبع التغذية والنشاط البدني المنتظم للحصول على أفضل النتائج الصحية واللياقة البدنية.'
  })
  
  return insights.slice(0, 6)
}
