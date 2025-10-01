import React, { useState } from 'react'
import { Upload, Database, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import foodsData from '../../../Data/comprehensive_egyptian_foods.json'

export default function AdminImport() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const handleImport = async () => {
    if (!confirm(`Import ${foodsData.length} foods? This will clear existing foods.`)) {
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const { data } = await api.post('/admin/bulk-import-foods', {
        foods: foodsData,
        clearExisting: true
      })

      setImportResult(data)
      toast.success(`Successfully imported ${data.imported} foods!`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error?.response?.data?.message || 'Failed to import foods')
    } finally {
      setImporting(false)
    }
  }

  const egyptianBreadItems = foodsData.filter(f => f.nameAr && f.nameAr.includes('عيش'))

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Import Foods Database</h1>
        </div>

        <div className="space-y-6">
          {/* Import Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{foodsData.length}</div>
              <div className="text-sm text-blue-700">Total Foods</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{egyptianBreadItems.length}</div>
              <div className="text-sm text-green-700">Egyptian Bread Items</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(foodsData.map(f => f.category)).size}
              </div>
              <div className="text-sm text-purple-700">Categories</div>
            </div>
          </div>

          {/* Egyptian Bread Preview */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🍞 Egyptian Bread Items Preview
            </h3>
            <div className="space-y-2">
              {egyptianBreadItems.slice(0, 5).map((food, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{food.nameAr}</span>
                  <span className="text-slate-600">
                    {food.name} - {food.servingSize.amount} {food.servingSize.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Import Button */}
          <div className="flex justify-center">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary px-8 py-3 flex items-center gap-3 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import All Foods
                </>
              )}
            </button>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Import Successful!</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Imported:</strong> {importResult.imported} foods</p>
                
                <div>
                  <strong>Categories:</strong>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {Object.entries(importResult.categoryCounts).map(([category, count]) => (
                      <div key={category} className="bg-white px-2 py-1 rounded text-xs">
                        {category}: {count}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Sample Foods:</strong>
                  <ul className="mt-2 space-y-1">
                    {importResult.sampleFoods.map((food, idx) => (
                      <li key={idx} className="text-xs">
                        • {food.nameAr || food.name} ({food.category})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Warning:</p>
                <p>This will delete all existing foods and import new ones. Make sure you have admin privileges.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
