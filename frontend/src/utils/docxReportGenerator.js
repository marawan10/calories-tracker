import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

// Modern Word Document Report Generator
export async function generateNutritionReport(userData, mealsData, activitiesData, chartElements = {}) {
  try {
    console.log('Starting Word document generation...')

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

    // Create document sections
    const sections = []

    // Header Section
    sections.push(
      new Paragraph({
        text: "NUTRITION ANALYTICS REPORT",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: "كُل بحساب - Advanced Health & Nutrition Analysis",
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Report Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      })
    )

    // User Profile Section
    sections.push(
      new Paragraph({
        text: "USER PROFILE",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    const profileTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Name", run: { bold: true } })],
              width: { size: 30, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ text: userData?.name || 'N/A' })],
              width: { size: 70, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        ...(userData?.age ? [new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Age", run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: `${userData.age} years` })] })
          ]
        })] : []),
        ...(userData?.height && userData?.weight ? [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Height", run: { bold: true } })] }),
              new TableCell({ children: [new Paragraph({ text: `${userData.height} cm` })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Weight", run: { bold: true } })] }),
              new TableCell({ children: [new Paragraph({ text: `${userData.weight} kg` })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "BMI", run: { bold: true } })] }),
              new TableCell({ 
                children: [new Paragraph({ 
                  text: `${(userData.weight / ((userData.height / 100) ** 2)).toFixed(1)}` 
                })] 
              })
            ]
          })
        ] : []),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Report Period", run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "Last 30 Days" })] })
          ]
        })
      ]
    })

    sections.push(profileTable)

    // Key Metrics Section
    sections.push(
      new Paragraph({
        text: "KEY METRICS DASHBOARD",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    const metricsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "METRIC", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "VALUE", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "UNIT", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Calories Consumed" })] }),
            new TableCell({ children: [new Paragraph({ text: totalCalories.toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "kcal" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Average Daily Calories" })] }),
            new TableCell({ children: [new Paragraph({ text: Math.round(avgCalories).toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "kcal/day" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Protein" })] }),
            new TableCell({ children: [new Paragraph({ text: Math.round(totalProtein).toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "grams" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Carbohydrates" })] }),
            new TableCell({ children: [new Paragraph({ text: Math.round(totalCarbs).toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "grams" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Fat" })] }),
            new TableCell({ children: [new Paragraph({ text: Math.round(totalFat).toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "grams" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Meals Logged" })] }),
            new TableCell({ children: [new Paragraph({ text: totalMeals.toString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "meals" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Active Tracking Days" })] }),
            new TableCell({ children: [new Paragraph({ text: activeDays.toString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "days" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Activities" })] }),
            new TableCell({ children: [new Paragraph({ text: totalActivities.toString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "activities" })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Calories Burned" })] }),
            new TableCell({ children: [new Paragraph({ text: totalCaloriesBurned.toLocaleString(), run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: "kcal" })] })
          ]
        })
      ]
    })

    sections.push(metricsTable)

    // Nutrition Goals Progress Section
    sections.push(
      new Paragraph({
        text: "NUTRITION GOALS PROGRESS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    const userGoals = {
      calories: userData?.dailyCalories || 2000,
      protein: userData?.dailyProtein || 150,
      carbs: userData?.dailyCarbs || 250,
      fat: userData?.dailyFat || 65
    }

    const avgProtein = totalProtein / (activeDays || 1)
    const avgCarbs = totalCarbs / (activeDays || 1)
    const avgFat = totalFat / (activeDays || 1)

    const goalsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "NUTRIENT", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "3B82F6" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "CURRENT AVG", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "3B82F6" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "DAILY GOAL", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "3B82F6" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "PROGRESS", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "3B82F6" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Daily Calories" })] }),
            new TableCell({ children: [new Paragraph({ text: `${Math.round(avgCalories)} kcal`, run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: `${userGoals.calories} kcal` })] }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: `${Math.min(Math.round((avgCalories / userGoals.calories) * 100), 100)}%`,
                run: { bold: true, color: avgCalories >= userGoals.calories * 0.8 ? "10B981" : "F59E0B" }
              })] 
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Daily Protein" })] }),
            new TableCell({ children: [new Paragraph({ text: `${Math.round(avgProtein)}g`, run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: `${userGoals.protein}g` })] }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: `${Math.min(Math.round((avgProtein / userGoals.protein) * 100), 100)}%`,
                run: { bold: true, color: avgProtein >= userGoals.protein * 0.8 ? "10B981" : "F59E0B" }
              })] 
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Daily Carbs" })] }),
            new TableCell({ children: [new Paragraph({ text: `${Math.round(avgCarbs)}g`, run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: `${userGoals.carbs}g` })] }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: `${Math.min(Math.round((avgCarbs / userGoals.carbs) * 100), 100)}%`,
                run: { bold: true, color: avgCarbs >= userGoals.carbs * 0.8 ? "10B981" : "F59E0B" }
              })] 
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Daily Fat" })] }),
            new TableCell({ children: [new Paragraph({ text: `${Math.round(avgFat)}g`, run: { bold: true } })] }),
            new TableCell({ children: [new Paragraph({ text: `${userGoals.fat}g` })] }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: `${Math.min(Math.round((avgFat / userGoals.fat) * 100), 100)}%`,
                run: { bold: true, color: avgFat >= userGoals.fat * 0.8 ? "10B981" : "F59E0B" }
              })] 
            })
          ]
        })
      ]
    })

    sections.push(goalsTable)

    // Macro Distribution Analysis
    sections.push(
      new Paragraph({
        text: "MACRO DISTRIBUTION ANALYSIS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    const macroTotal = totalProtein + totalCarbs + totalFat
    if (macroTotal > 0) {
      const proteinPercent = (totalProtein / macroTotal) * 100
      const carbsPercent = (totalCarbs / macroTotal) * 100
      const fatPercent = (totalFat / macroTotal) * 100

      const macroTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "MACRONUTRIENT", run: { bold: true, color: "FFFFFF" } })],
                shading: { fill: "10B981" }
              }),
              new TableCell({
                children: [new Paragraph({ text: "TOTAL GRAMS", run: { bold: true, color: "FFFFFF" } })],
                shading: { fill: "10B981" }
              }),
              new TableCell({
                children: [new Paragraph({ text: "PERCENTAGE", run: { bold: true, color: "FFFFFF" } })],
                shading: { fill: "10B981" }
              }),
              new TableCell({
                children: [new Paragraph({ text: "CALORIES", run: { bold: true, color: "FFFFFF" } })],
                shading: { fill: "10B981" }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ text: "Protein", run: { bold: true } })],
                shading: { fill: "DBEAFE" }
              }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalProtein)}g` })] }),
              new TableCell({ children: [new Paragraph({ text: `${proteinPercent.toFixed(1)}%`, run: { bold: true, color: "3B82F6" } })] }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalProtein * 4)} kcal` })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ text: "Carbohydrates", run: { bold: true } })],
                shading: { fill: "FEF3C7" }
              }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalCarbs)}g` })] }),
              new TableCell({ children: [new Paragraph({ text: `${carbsPercent.toFixed(1)}%`, run: { bold: true, color: "F59E0B" } })] }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalCarbs * 4)} kcal` })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ text: "Fat", run: { bold: true } })],
                shading: { fill: "D1FAE5" }
              }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalFat)}g` })] }),
              new TableCell({ children: [new Paragraph({ text: `${fatPercent.toFixed(1)}%`, run: { bold: true, color: "10B981" } })] }),
              new TableCell({ children: [new Paragraph({ text: `${Math.round(totalFat * 9)} kcal` })] })
            ]
          })
        ]
      })

      sections.push(macroTable)
    }

    // Daily Breakdown Section
    if (mealsData.dailyData && mealsData.dailyData.length > 0) {
      sections.push(
        new Paragraph({
          text: "DAILY NUTRITION BREAKDOWN (Last 7 Days)",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 }
        })
      )

      const recentData = mealsData.dailyData.slice(-7)
      const dailyRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "DATE", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "CALORIES", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "PROTEIN", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "CARBS", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "FAT", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "MEALS", run: { bold: true, color: "FFFFFF" } })],
              shading: { fill: "10B981" }
            })
          ]
        })
      ]

      recentData.forEach((day, index) => {
        const formattedDate = day.date ? new Date(day.date).toLocaleDateString('en', {month: 'short', day: 'numeric'}) : 'N/A'
        dailyRows.push(
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ text: formattedDate })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph({ text: Math.round(day.calories || 0).toString(), run: { bold: true, color: "EF4444" } })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph({ text: `${Math.round(day.protein || 0)}g`, run: { color: "3B82F6" } })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph({ text: `${Math.round(day.carbs || 0)}g`, run: { color: "F59E0B" } })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph({ text: `${Math.round(day.fat || 0)}g`, run: { color: "10B981" } })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph({ text: (day.meals || 0).toString() })],
                shading: index % 2 === 0 ? { fill: "F8FAFC" } : undefined
              })
            ]
          })
        )
      })

      const dailyTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: dailyRows
      })

      sections.push(dailyTable)
    }

    // Health Insights Section
    sections.push(
      new Paragraph({
        text: "PERSONALIZED HEALTH INSIGHTS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    const insights = generateHealthInsights(userData, mealsData, avgCalories, totalCalories, activeDays)
    
    insights.forEach((insight, index) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${insight.title}`,
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: insight.description,
          spacing: { after: 200 }
        })
      )
    })

    // Footer
    sections.push(
      new Paragraph({
        text: "Generated by كُل بحساب - Advanced Nutrition Tracker",
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        run: { italics: true, size: 20 }
      })
    )

    // Create the document
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    })

    // Generate and save the document
    const buffer = await Packer.toBuffer(doc)
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const filename = `nutrition-report_${timestamp}.docx`
    
    console.log('Saving Word document...')
    saveAs(new Blob([buffer]), filename)
    
    console.log('Word document generated successfully!')
    return { success: true, filename }

  } catch (error) {
    console.error('Word document generation error:', error)
    return { success: false, error: error.message }
  }
}

// Generate personalized health insights
function generateHealthInsights(userData, mealsData, avgCalories, totalCalories, activeDays) {
  const insights = []
  const userGoals = userData?.dailyCalories || 2000
  
  // Calorie Analysis
  if (avgCalories < userGoals * 0.8) {
    insights.push({
      title: 'Calorie Intake Below Target',
      description: 'Your daily average is below your goal. Consider adding healthy snacks or increasing portion sizes to meet your nutritional needs.'
    })
  } else if (avgCalories > userGoals * 1.2) {
    insights.push({
      title: 'Calorie Intake Above Target',
      description: 'Your intake exceeds your goal. Focus on portion control and choose nutrient-dense, lower-calorie foods.'
    })
  } else {
    insights.push({
      title: 'Excellent Calorie Balance',
      description: 'Your calorie intake aligns perfectly with your goals. Keep up the great work maintaining this consistency!'
    })
  }
  
  // Protein Analysis
  const avgProtein = (mealsData.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0) / (activeDays || 1)
  const proteinGoal = userData?.dailyProtein || 150
  if (avgProtein < proteinGoal * 0.8) {
    insights.push({
      title: 'Increase Protein Intake',
      description: 'Add lean meats, fish, eggs, legumes, or protein supplements to reach your daily protein goals for better muscle health.'
    })
  } else {
    insights.push({
      title: 'Great Protein Intake',
      description: 'Your protein consumption supports muscle maintenance and growth. Continue including quality protein sources.'
    })
  }
  
  // Tracking Consistency
  if (activeDays < 20) {
    insights.push({
      title: 'Improve Tracking Consistency',
      description: 'Log meals more regularly for better insights. Consistent tracking leads to better results and awareness.'
    })
  } else {
    insights.push({
      title: 'Excellent Tracking Habits',
      description: 'Your consistent meal logging provides valuable insights. This dedication will help you achieve your goals.'
    })
  }
  
  // BMI Analysis
  if (userData?.height && userData?.weight) {
    const bmi = userData.weight / ((userData.height / 100) ** 2)
    if (bmi < 18.5) {
      insights.push({
        title: 'Consider Weight Gain',
        description: 'Your BMI suggests you may benefit from healthy weight gain. Consult a healthcare provider for personalized advice.'
      })
    } else if (bmi > 25) {
      insights.push({
        title: 'Weight Management Focus',
        description: 'Your BMI indicates potential benefits from weight management. Focus on balanced nutrition and regular exercise.'
      })
    } else {
      insights.push({
        title: 'Healthy Weight Range',
        description: 'Your BMI is in the healthy range. Maintain your current lifestyle with balanced nutrition and regular activity.'
      })
    }
  }
  
  // General Health Tips
  insights.push({
    title: 'Stay Hydrated',
    description: 'Drink 8-10 glasses of water daily. Proper hydration supports metabolism, digestion, and overall health.'
  })
  
  insights.push({
    title: 'Regular Exercise',
    description: 'Combine your nutrition tracking with regular physical activity for optimal health and fitness results.'
  })
  
  return insights.slice(0, 6) // Limit to 6 insights for space
}
