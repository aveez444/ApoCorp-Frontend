// utils/excelExport.js - Create this new file

import api from '../api/axios'

/**
 * Download report data as Excel file
 * @param {Object} config - Report configuration
 * @param {string} filename - Optional filename
 * @returns {Promise<void>}
 */
export const downloadReportAsExcel = async (config, filename = 'report') => {
  const response = await api.post('/custom-reports/run-excel/', 
    { 
      config, 
      filename: `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
      sheet_title: filename
    },
    { 
      responseType: 'blob',
      headers: { 
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
  )
  
  const blob = new Blob([response.data], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export any data array to Excel
 * @param {Array} columns - Column definitions [{key, label, type}]
 * @param {Array} data - Data rows
 * @param {string} filename - Filename
 * @returns {Promise<void>}
 */
export const exportDataToExcel = async (columns, data, filename = 'export') => {
  const response = await api.post('/custom-reports/export-excel/',
    { columns, data, filename },
    { responseType: 'blob' }
  )
  
  const blob = new Blob([response.data], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}