import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'

// Modern Professional PDF Report Generator
export async function generateNutritionReport(userData, mealsData, activitiesData, chartElements = {}) {
  try {
    // Starting modern PDF generation
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    let currentY = margin

    // Color palette
    const colors = {
      primary: [16, 185, 129],     // Emerald
      secondary: [59, 130, 246],   // Blue
      accent: [245, 158, 11],      // Amber
      danger: [239, 68, 68],       // Red
      dark: [30, 41, 59],          // Slate
      gray: [71, 85, 105],         // Slate gray
      light: [248, 250, 252],      // Light gray
      white: [255, 255, 255]
    }

    // Safe text addition function
    const addText = (text, x, y, options = {}) => {
      try {
        const textStr = String(text || '')
        if (!textStr) return
        
        pdf.setFontSize(options.fontSize || 12)
        pdf.setFont('helvetica', options.fontWeight || 'normal')
        
        if (options.color && Array.isArray(options.color)) {
          pdf.setTextColor(options.color[0], options.color[1], options.color[2])
        } else {
          pdf.setTextColor(0, 0, 0)
        }
        
        const textOptions = {}
        if (options.align) textOptions.align = options.align
        
        pdf.text(textStr, x, y, textOptions)
      } catch (error) {
        console.error('Error adding text:', error)
      }
    }

    // Draw project logo (enhanced nutrition icon)
    const drawLogo = (x, y, size = 20) => {
      // Background circle with gradient effect
      pdf.setFillColor(...colors.primary)
      pdf.circle(x + size/2, y + size/2, size/2, 'F')
      
      // Inner circle for depth
      pdf.setFillColor(255, 255, 255)
      pdf.circle(x + size/2, y + size/2, size/2 - 2, 'F')
      
      // Plate outline
      pdf.setDrawColor(...colors.primary)
      pdf.setLineWidth(1.5)
      pdf.circle(x + size/2, y + size/2, size/2 - 4, 'S')
      
      // Food items on plate
      pdf.setFillColor(...colors.accent)
      pdf.circle(x + size/2 - 3, y + size/2 - 2, 2, 'F')
      
      pdf.setFillColor(...colors.danger)
      pdf.circle(x + size/2 + 3, y + size/2 - 2, 2, 'F')
      
      pdf.setFillColor(...colors.secondary)
      pdf.circle(x + size/2, y + size/2 + 3, 1.5, 'F')
      
      // Fork and knife silhouettes
      pdf.setDrawColor(...colors.gray)
      pdf.setLineWidth(0.8)
      // Fork
      pdf.line(x + size/2 - 8, y + size/2 - 6, x + size/2 - 8, y + size/2 + 2)
      pdf.line(x + size/2 - 9, y + size/2 - 6, x + size/2 - 9, y + size/2 - 2)
      pdf.line(x + size/2 - 7, y + size/2 - 6, x + size/2 - 7, y + size/2 - 2)
      // Knife
      pdf.line(x + size/2 + 8, y + size/2 - 6, x + size/2 + 8, y + size/2 + 2)
      pdf.line(x + size/2 + 7, y + size/2 - 6, x + size/2 + 9, y + size/2 - 4)
    }

    // Modern gradient header
    const addGradientHeader = () => {
      // Main header background with gradient effect
      pdf.setFillColor(...colors.primary)
      pdf.rect(0, 0, pageWidth, 35, 'F')
      
      // Overlay for gradient effect
      pdf.setFillColor(255, 255, 255)
      pdf.setGState(new pdf.GState({opacity: 0.1}))
      pdf.rect(0, 0, pageWidth, 35, 'F')
      pdf.setGState(new pdf.GState({opacity: 1}))
      
      // Logo
      drawLogo(margin, margin - 5, 25)
      
      // Header text with modern typography
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('NUTRITION ANALYTICS', margin + 35, margin + 8)
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text('كُل بحساب - Advanced Health & Nutrition Report', margin + 35, margin + 16)
      
      // Report ID and date
      const reportId = `NR-${format(new Date(), 'yyyyMMdd-HHmm')}`
      pdf.setFontSize(9)
      pdf.text(`Report ID: ${reportId}`, pageWidth - margin, margin + 8, { align: 'right' })
      pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - margin, margin + 16, { align: 'right' })
      
      // Decorative line
      pdf.setDrawColor(255, 255, 255)
      pdf.setLineWidth(0.5)
      pdf.line(margin + 35, margin + 20, pageWidth - margin, margin + 20)
    }

    // Add modern section header
    const addSectionHeader = (title, icon, color = colors.primary) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage()
        currentY = margin
      }
      
      // Section background
      pdf.setFillColor(...colors.light)
      pdf.roundedRect(margin, currentY - 2, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      // Accent bar
      pdf.setFillColor(...color)
      pdf.rect(margin, currentY - 2, 4, 12, 'F')
      
      // Icon background
      pdf.setFillColor(...color)
      pdf.circle(margin + 15, currentY + 4, 4, 'F')
      
      // Icon text
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(icon, margin + 15, currentY + 6, { align: 'center' })
      
      // Section title
      pdf.setTextColor(...colors.dark)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(title, margin + 25, currentY + 6)
      
      currentY += 20
    }

    // Add professional stats card
    const addStatsCard = (title, value, unit, icon, color = colors.primary, width = 45) => {
      const cardHeight = 25
      
      // Card background with shadow effect
      pdf.setFillColor(250, 250, 250)
      pdf.roundedRect(margin, currentY, width, cardHeight, 3, 3, 'F')
      
      // Border
      pdf.setDrawColor(...colors.light)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(margin, currentY, width, cardHeight, 3, 3, 'S')
      
      // Icon background
      pdf.setFillColor(...color)
      pdf.circle(margin + 8, currentY + 8, 4, 'F')
      
      // Icon
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text(icon, margin + 8, currentY + 9, { align: 'center' })
      
      // Value
      pdf.setTextColor(...colors.dark)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(String(value), margin + 16, currentY + 10)
      
      // Unit
      pdf.setTextColor(...colors.gray)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(unit, margin + 16, currentY + 16)
      
      // Title
      pdf.setTextColor(...colors.gray)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(title, width - 18)
      lines.forEach((line, index) => {
        pdf.text(line, margin + 16, currentY + 20 + (index * 3))
      })
    }

    // Create progress bar
    const addProgressBar = (label, current, target, color = colors.primary, y) => {
      const barWidth = 100
      const barHeight = 6
      const progress = Math.min((current / target) * 100, 100)
      
      // Label
      pdf.setTextColor(...colors.dark)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(label, margin, y)
      
      // Values
      pdf.setTextColor(...colors.gray)
      pdf.setFontSize(8)
      pdf.text(`${Math.round(current)} / ${Math.round(target)}`, margin + barWidth + 10, y)
      
      // Background bar
      pdf.setFillColor(230, 230, 230)
      pdf.roundedRect(margin, y + 2, barWidth, barHeight, 3, 3, 'F')
      
      // Progress bar
      if (progress > 0) {
        pdf.setFillColor(...color)
        pdf.roundedRect(margin, y + 2, (barWidth * progress) / 100, barHeight, 3, 3, 'F')
      }
      
      // Percentage
      pdf.setTextColor(...color)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${Math.round(progress)}%`, margin + barWidth + 35, y)
    }

    // Add header
    addGradientHeader()
    currentY = 45

    // User Profile Card
    addSectionHeader('USER PROFILE', 'U', colors.secondary)
    
    // Profile info in modern card layout
    pdf.setFillColor(...colors.white)
    pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 3, 3, 'F')
    pdf.setDrawColor(...colors.light)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 3, 3, 'S')
    
    currentY += 8
    addText(`Name: ${userData?.name || 'User'}`, margin + 10, currentY, {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.dark
    })
    
    if (userData?.age) {
      addText(`Age: ${userData.age} years`, margin + 100, currentY, {
        fontSize: 10,
        color: colors.gray
      })
    }
    
    addText(`Report Period: Last 30 Days`, pageWidth - margin - 10, currentY, {
      fontSize: 10,
      color: colors.gray,
      align: 'right'
    })
    
    currentY += 8
    if (userData?.height && userData?.weight) {
      addText(`Height: ${userData.height}cm | Weight: ${userData.weight}kg`, margin + 10, currentY, {
        fontSize: 10,
        color: colors.gray
      })
    }
    
    const bmi = userData?.height && userData?.weight ? 
      (userData.weight / ((userData.height / 100) ** 2)).toFixed(1) : null
    
    if (bmi) {
      addText(`BMI: ${bmi}`, pageWidth - margin - 10, currentY, {
        fontSize: 10,
        color: colors.primary,
        align: 'right'
      })
    }
    
    currentY += 25

    // Calculate comprehensive stats
    const totalCalories = mealsData.dailyData?.reduce((sum, day) => sum + (day.calories || 0), 0) || 0
    const totalProtein = mealsData.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0
    const totalCarbs = mealsData.dailyData?.reduce((sum, day) => sum + (day.carbs || 0), 0) || 0
    const totalFat = mealsData.dailyData?.reduce((sum, day) => sum + (day.fat || 0), 0) || 0
    const avgCalories = mealsData.avgCaloriesPerDay || 0
    const totalMeals = mealsData.totalMeals || 0
    const activeDays = mealsData.dailyData?.filter(d => d.calories > 0).length || 0
    const totalActivities = activitiesData?.activities?.length || 0
    const totalCaloriesBurned = activitiesData?.activities?.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0) || 0

    // Key Metrics Dashboard
    addSectionHeader('KEY METRICS DASHBOARD', 'KPI', colors.primary)
    
    // Stats cards in grid layout
    const statsCards = [
      { title: 'Total Calories', value: Math.round(totalCalories/1000) + 'K', unit: 'kcal', icon: 'CAL', color: colors.danger },
      { title: 'Daily Average', value: Math.round(avgCalories), unit: 'kcal/day', icon: 'AVG', color: colors.primary },
      { title: 'Total Protein', value: Math.round(totalProtein/1000) + 'K', unit: 'grams', icon: 'PRO', color: colors.secondary },
      { title: 'Active Days', value: activeDays, unit: 'days', icon: 'DAY', color: colors.accent }
    ]
    
    // First row of cards
    let cardX = margin
    statsCards.slice(0, 2).forEach((card, index) => {
      addStatsCard(card.title, card.value, card.unit, card.icon, card.color, 85)
      if (index === 0) cardX = margin + 90
    })
    
    // Second row of cards
    currentY += 30
    cardX = margin
    statsCards.slice(2, 4).forEach((card, index) => {
      addStatsCard(card.title, card.value, card.unit, card.icon, card.color, 85)
      if (index === 0) cardX = margin + 90
    })
    
    currentY += 35

    // Nutrition Progress Bars
    addSectionHeader('NUTRITION GOALS PROGRESS', 'GOL', colors.accent)
    
    const userGoals = {
      calories: userData?.dailyCalories || 2000,
      protein: userData?.dailyProtein || 150,
      carbs: userData?.dailyCarbs || 250,
      fat: userData?.dailyFat || 65
    }
    
    addProgressBar('Daily Calories Goal', avgCalories, userGoals.calories, colors.danger, currentY)
    currentY += 15
    
    const avgProtein = totalProtein / (activeDays || 1)
    addProgressBar('Daily Protein Goal', avgProtein, userGoals.protein, colors.secondary, currentY)
    currentY += 15
    
    const avgCarbs = totalCarbs / (activeDays || 1)
    addProgressBar('Daily Carbs Goal', avgCarbs, userGoals.carbs, colors.accent, currentY)
    currentY += 15
    
    const avgFat = totalFat / (activeDays || 1)
    addProgressBar('Daily Fat Goal', avgFat, userGoals.fat, colors.primary, currentY)
    currentY += 25

    // Macro Distribution Pie Chart (drawn with PDF)
    addSectionHeader('MACRO DISTRIBUTION ANALYSIS', 'MAC', colors.secondary)
    
    const macroTotal = totalProtein + totalCarbs + totalFat
    if (macroTotal > 0) {
      const proteinPercent = (totalProtein / macroTotal) * 100
      const carbsPercent = (totalCarbs / macroTotal) * 100
      const fatPercent = (totalFat / macroTotal) * 100
      
      // Draw pie chart
      const centerX = pageWidth / 2
      const centerY = currentY + 30
      const radius = 25
      
      let startAngle = 0
      
      // Protein slice
      const proteinAngle = (proteinPercent / 100) * 360
      pdf.setFillColor(...colors.secondary)
      drawPieSlice(pdf, centerX, centerY, radius, startAngle, startAngle + proteinAngle)
      startAngle += proteinAngle
      
      // Carbs slice
      const carbsAngle = (carbsPercent / 100) * 360
      pdf.setFillColor(...colors.accent)
      drawPieSlice(pdf, centerX, centerY, radius, startAngle, startAngle + carbsAngle)
      startAngle += carbsAngle
      
      // Fat slice
      const fatAngle = (fatPercent / 100) * 360
      pdf.setFillColor(...colors.primary)
      drawPieSlice(pdf, centerX, centerY, radius, startAngle, startAngle + fatAngle)
      
      // Legend
      currentY += 70
      const legendItems = [
        { label: `Protein ${proteinPercent.toFixed(1)}%`, color: colors.secondary },
        { label: `Carbs ${carbsPercent.toFixed(1)}%`, color: colors.accent },
        { label: `Fat ${fatPercent.toFixed(1)}%`, color: colors.primary }
      ]
      
      legendItems.forEach((item, index) => {
        const legendX = margin + (index * 60)
        pdf.setFillColor(...item.color)
        pdf.rect(legendX, currentY, 8, 6, 'F')
        
        addText(item.label, legendX + 12, currentY + 4, {
          fontSize: 9,
          color: colors.dark
        })
      })
      
      currentY += 20
    }

    // Helper function for pie chart
    function drawPieSlice(pdf, centerX, centerY, radius, startAngle, endAngle) {
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      
      pdf.moveTo(centerX, centerY)
      pdf.lineTo(centerX + radius * Math.cos(startRad), centerY + radius * Math.sin(startRad))
      
      // Draw arc
      const steps = Math.max(1, Math.abs(endAngle - startAngle) / 5)
      for (let i = 0; i <= steps; i++) {
        const angle = startRad + (endRad - startRad) * (i / steps)
        pdf.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
      }
      
      pdf.lineTo(centerX, centerY)
      pdf.fill()
    }

    // Enhanced Charts Section
    if (chartElements.caloriesChart || chartElements.macrosChart) {
      if (currentY > pageHeight - 100) {
        pdf.addPage()
        currentY = margin
      }
      
      addSectionHeader('DASHBOARD VISUALIZATIONS', 'VIZ', colors.secondary)

      // Calories chart with enhanced styling
      if (chartElements.caloriesChart) {
        try {
          // Capturing enhanced calories chart
          
          // Chart title with background
          pdf.setFillColor(...colors.light)
          pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 12, 2, 2, 'F')
          
          addText('Weekly Calories Trend Analysis', margin + 10, currentY + 8, {
            fontSize: 12,
            fontWeight: 'bold',
            color: colors.dark
          })
          currentY += 20

          const canvas = await html2canvas(chartElements.caloriesChart, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: chartElements.caloriesChart.offsetWidth,
            height: chartElements.caloriesChart.offsetHeight
          })

          const imgData = canvas.toDataURL('image/png', 0.95)
          const imgWidth = pageWidth - 2 * margin
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 90)

          // Add border around chart
          pdf.setDrawColor(...colors.light)
          pdf.setLineWidth(1)
          pdf.roundedRect(margin - 1, currentY - 1, imgWidth + 2, imgHeight + 2, 3, 3, 'S')

          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
          currentY += imgHeight + 20
        } catch (error) {
          console.error('Error capturing calories chart:', error)
          addText('⚠️ Chart capture failed - please visit the dashboard first', margin, currentY, {
            fontSize: 10,
            color: colors.danger
          })
          currentY += 15
        }
      }

      // Macros chart with enhanced styling
      if (chartElements.macrosChart) {
        try {
          // Capturing enhanced macros chart
          
          if (currentY > pageHeight - 120) {
            pdf.addPage()
            currentY = margin
          }
          
          // Chart title with background
          pdf.setFillColor(...colors.light)
          pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 12, 2, 2, 'F')
          
          addText('Macro Distribution Breakdown', margin + 10, currentY + 8, {
            fontSize: 12,
            fontWeight: 'bold',
            color: colors.dark
          })
          currentY += 20

          const canvas = await html2canvas(chartElements.macrosChart, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: chartElements.macrosChart.offsetWidth,
            height: chartElements.macrosChart.offsetHeight
          })

          const imgData = canvas.toDataURL('image/png', 0.95)
          const imgWidth = pageWidth - 2 * margin
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 90)

          // Add border around chart
          pdf.setDrawColor(...colors.light)
          pdf.setLineWidth(1)
          pdf.roundedRect(margin - 1, currentY - 1, imgWidth + 2, imgHeight + 2, 3, 3, 'S')

          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
          currentY += imgHeight + 20
        } catch (error) {
          console.error('Error capturing macros chart:', error)
          addText('⚠️ Chart capture failed - please visit the dashboard first', margin, currentY, {
            fontSize: 10,
            color: colors.danger
          })
          currentY += 15
        }
      }
    }

    // Weekly Trend Analysis (custom bar chart)
    if (mealsData.dailyData && mealsData.dailyData.length > 0) {
      if (currentY > pageHeight - 80) {
        pdf.addPage()
        currentY = margin
      }
      
      addSectionHeader('WEEKLY CALORIE TRENDS', 'TRD', colors.accent)
      
      const last7Days = mealsData.dailyData.slice(-7)
      const maxCalories = Math.max(...last7Days.map(d => d.calories || 0))
      const barWidth = 20
      const barMaxHeight = 40
      const chartWidth = last7Days.length * (barWidth + 5)
      const chartStartX = (pageWidth - chartWidth) / 2
      
      // Draw bars
      last7Days.forEach((day, index) => {
        const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * barMaxHeight : 0
        const barX = chartStartX + index * (barWidth + 5)
        const barY = currentY + barMaxHeight - barHeight
        
        // Bar gradient effect
        pdf.setFillColor(...colors.primary)
        pdf.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F')
        
        // Bar value on top
        addText(Math.round(day.calories || 0).toString(), barX + barWidth/2, barY - 3, {
          fontSize: 8,
          color: colors.dark,
          align: 'center'
        })
        
        // Day label at bottom
        const dayLabel = day.date ? new Date(day.date).toLocaleDateString('en', {weekday: 'short'}) : `Day ${index + 1}`
        addText(dayLabel, barX + barWidth/2, currentY + barMaxHeight + 8, {
          fontSize: 8,
          color: colors.gray,
          align: 'center'
        })
      })
      
      currentY += barMaxHeight + 25
    }

    // Enhanced Daily Breakdown
    if (mealsData.dailyData && mealsData.dailyData.length > 0) {
      if (currentY > pageHeight - 100) {
        pdf.addPage()
        currentY = margin
      }

      addSectionHeader('DAILY NUTRITION BREAKDOWN', 'DAY', colors.secondary)

      // Modern table with enhanced styling
      const recentData = mealsData.dailyData.slice(-7)
      
      // Table header with gradient
      pdf.setFillColor(...colors.primary)
      pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 10, 2, 2, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DATE', margin + 8, currentY + 6)
      pdf.text('CALORIES', margin + 45, currentY + 6)
      pdf.text('PROTEIN', margin + 85, currentY + 6)
      pdf.text('CARBS', margin + 120, currentY + 6)
      pdf.text('FAT', margin + 150, currentY + 6)
      pdf.text('MEALS', pageWidth - margin - 15, currentY + 6, { align: 'right' })
      
      currentY += 12

      recentData.forEach((day, index) => {
        const rowHeight = 8
        
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(...colors.light)
          pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, rowHeight, 1, 1, 'F')
        }
        
        // Row border
        pdf.setDrawColor(230, 230, 230)
        pdf.setLineWidth(0.3)
        pdf.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight)
        
        pdf.setTextColor(...colors.dark)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        
        const formattedDate = day.date ? new Date(day.date).toLocaleDateString('en', {month: 'short', day: 'numeric'}) : 'N/A'
        pdf.text(formattedDate, margin + 8, currentY + 5)
        
        // Color-coded values with proper spacing
        pdf.setTextColor(...colors.danger)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${Math.round(day.calories || 0)}`, margin + 45, currentY + 5)
        
        pdf.setTextColor(...colors.secondary)
        pdf.text(`${Math.round(day.protein || 0)}g`, margin + 85, currentY + 5)
        
        pdf.setTextColor(...colors.accent)
        pdf.text(`${Math.round(day.carbs || 0)}g`, margin + 120, currentY + 5)
        
        pdf.setTextColor(...colors.primary)
        pdf.text(`${Math.round(day.fat || 0)}g`, margin + 150, currentY + 5)
        
        pdf.setTextColor(...colors.dark)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${day.meals || 0}`, pageWidth - margin - 15, currentY + 5, { align: 'right' })
        
        currentY += rowHeight
      })
      
      currentY += 15
    }

    // Health Insights & Recommendations
    if (currentY > pageHeight - 80) {
      pdf.addPage()
      currentY = margin
    }

    addSectionHeader('PERSONALIZED HEALTH INSIGHTS', 'TIP', colors.accent)

    // Insights cards
    const insights = generateHealthInsights(userData, mealsData, avgCalories, totalCalories, activeDays)
    
    insights.forEach((insight, index) => {
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        currentY = margin + 20
      }
      
      // Insight card
      pdf.setFillColor(...colors.white)
      pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 3, 3, 'F')
      pdf.setDrawColor(...insight.color)
      pdf.setLineWidth(2)
      pdf.line(margin, currentY, margin, currentY + 20)
      
      // Icon
      pdf.setFillColor(...insight.color)
      pdf.circle(margin + 12, currentY + 10, 5, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(insight.icon, margin + 12, currentY + 12, { align: 'center' })
      
      // Title
      pdf.setTextColor(...colors.dark)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text(insight.title, margin + 22, currentY + 8)
      
      // Description
      pdf.setTextColor(...colors.gray)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(insight.description, pageWidth - 2 * margin - 25)
      lines.slice(0, 2).forEach((line, lineIndex) => {
        pdf.text(line, margin + 22, currentY + 14 + (lineIndex * 4))
      })
      
      currentY += 25
    })

    // Modern footer with enhanced styling
    const addModernFooter = () => {
      const footerY = pageHeight - 25
      
      // Footer background
      pdf.setFillColor(...colors.primary)
      pdf.rect(0, footerY - 5, pageWidth, 30, 'F')
      
      // Footer content
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('كُل بحساب', margin, footerY + 5)
      pdf.text('NUTRITION ANALYTICS', margin, footerY + 12)
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Advanced Health & Nutrition Tracking Platform', margin, footerY + 18)
      
      // Logo in footer
      drawLogo(pageWidth - margin - 30, footerY, 20)
      
      // Page number
      const pageNum = pdf.internal.getNumberOfPages()
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text(`Page ${pageNum}`, pageWidth / 2, footerY + 12, { align: 'center' })
    }

    // Add footer to all pages
    const totalPages = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      addModernFooter()
    }

    // Generate filename and save
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const filename = `nutrition-analytics_${timestamp}.pdf`
    
    // Saving modern PDF report
    pdf.save(filename)
    
    // Modern PDF generated successfully
    return { success: true, filename }

  } catch (error) {
    console.error('PDF generation error:', error)
    return { success: false, error: error.message }
  }
}

// Generate personalized health insights
function generateHealthInsights(userData, mealsData, avgCalories, totalCalories, activeDays) {
  const insights = []
  const userGoals = userData?.dailyCalories || 2000
  const colors = {
    primary: [16, 185, 129],
    secondary: [59, 130, 246],
    accent: [245, 158, 11],
    danger: [239, 68, 68]
  }
  
  // Calorie Analysis
  if (avgCalories < userGoals * 0.8) {
    insights.push({
      icon: 'LOW',
      title: 'Calorie Intake Below Target',
      description: 'Your daily average is below your goal. Consider adding healthy snacks or increasing portion sizes to meet your nutritional needs.',
      color: colors.accent
    })
  } else if (avgCalories > userGoals * 1.2) {
    insights.push({
      icon: 'HI',
      title: 'Calorie Intake Above Target',
      description: 'Your intake exceeds your goal. Focus on portion control and choose nutrient-dense, lower-calorie foods.',
      color: colors.danger
    })
  } else {
    insights.push({
      icon: 'OK',
      title: 'Excellent Calorie Balance',
      description: 'Your calorie intake aligns perfectly with your goals. Keep up the great work maintaining this consistency!',
      color: colors.primary
    })
  }
  
  // Protein Analysis
  const avgProtein = (mealsData.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0) / (activeDays || 1)
  const proteinGoal = userData?.dailyProtein || 150
  if (avgProtein < proteinGoal * 0.8) {
    insights.push({
      icon: 'PRO',
      title: 'Increase Protein Intake',
      description: 'Add lean meats, fish, eggs, legumes, or protein supplements to reach your daily protein goals for better muscle health.',
      color: colors.secondary
    })
  } else {
    insights.push({
      icon: 'PRO',
      title: 'Great Protein Intake',
      description: 'Your protein consumption supports muscle maintenance and growth. Continue including quality protein sources.',
      color: colors.primary
    })
  }
  
  // Tracking Consistency
  if (activeDays < 20) {
    insights.push({
      icon: 'LOG',
      title: 'Improve Tracking Consistency',
      description: 'Log meals more regularly for better insights. Consistent tracking leads to better results and awareness.',
      color: colors.accent
    })
  } else {
    insights.push({
      icon: 'LOG',
      title: 'Excellent Tracking Habits',
      description: 'Your consistent meal logging provides valuable insights. This dedication will help you achieve your goals.',
      color: colors.primary
    })
  }
  
  // BMI Analysis
  if (userData?.height && userData?.weight) {
    const bmi = userData.weight / ((userData.height / 100) ** 2)
    if (bmi < 18.5) {
      insights.push({
        icon: 'BMI',
        title: 'Consider Weight Gain',
        description: 'Your BMI suggests you may benefit from healthy weight gain. Consult a healthcare provider for personalized advice.',
        color: colors.secondary
      })
    } else if (bmi > 25) {
      insights.push({
        icon: 'BMI',
        title: 'Weight Management Focus',
        description: 'Your BMI indicates potential benefits from weight management. Focus on balanced nutrition and regular exercise.',
        color: colors.accent
      })
    } else {
      insights.push({
        icon: 'BMI',
        title: 'Healthy Weight Range',
        description: 'Your BMI is in the healthy range. Maintain your current lifestyle with balanced nutrition and regular activity.',
        color: colors.primary
      })
    }
  }
  
  // General Health Tips
  insights.push({
    icon: 'H2O',
    title: 'Stay Hydrated',
    description: 'Drink 8-10 glasses of water daily. Proper hydration supports metabolism, digestion, and overall health.',
    color: colors.secondary
  })
  
  insights.push({
    icon: 'FIT',
    title: 'Regular Exercise',
    description: 'Combine your nutrition tracking with regular physical activity for optimal health and fitness results.',
    color: colors.accent
  })
  
  return insights.slice(0, 6) // Limit to 6 insights for space
}

// Generate personalized recommendations (legacy function)
function generateRecommendations(userData, mealsData, avgCalories) {
  const recommendations = []
  const userGoals = userData?.dailyCalories || 2000
  
  if (avgCalories < userGoals * 0.8) {
    recommendations.push('Your average daily calorie intake is below your target. Consider increasing portion sizes or adding healthy snacks.')
  } else if (avgCalories > userGoals * 1.2) {
    recommendations.push('Your average daily calorie intake exceeds your target. Consider reducing portion sizes or choosing lower-calorie foods.')
  } else {
    recommendations.push('Your calorie intake is well-aligned with your goals. Great job maintaining consistency!')
  }
  
  const avgProtein = (mealsData.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0) / (mealsData.dailyData?.length || 1)
  if (avgProtein < (userData?.dailyProtein || 50)) {
    recommendations.push('Consider increasing your protein intake with lean meats, legumes, or dairy products.')
  }
  
  const trackingDays = mealsData.dailyData?.filter(day => day.calories > 0).length || 0
  if (trackingDays < 20) {
    recommendations.push('Try to log your meals more consistently for better insights into your eating patterns.')
  }
  
  recommendations.push('Stay hydrated by drinking 8-10 glasses of water daily.')
  recommendations.push('Incorporate regular physical activity to complement your nutrition goals.')
  recommendations.push('Continue tracking your meals daily for optimal results.')
  
  return recommendations
}
