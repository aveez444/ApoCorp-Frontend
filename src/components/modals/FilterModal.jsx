// components/modals/FilterModal.jsx

import { useState, useEffect } from 'react'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const FONT = "'Inter', 'Segoe UI', sans-serif"

export default function FilterModal({ isOpen, onClose, onApply, currentFilters, userRole }) {
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    date: '',
    date_from: '',
    date_to: '',
    statuses: [],
    created_by: [],
    assigned_to: [],
    region: '',
    enquiry_type: '',
    priority: '',
    ordering: '-created_at'
  })
  
  const [options, setOptions] = useState({
    statuses: [],
    regions: [],
    enquiry_types: [],
    priorities: [],
    created_by_users: [],
    assigned_to_users: []
  })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
      // Initialize with current filters if provided
      if (currentFilters) {
        setFilters(prev => ({
          ...prev,
          ...currentFilters,
          statuses: currentFilters.status || [],
          created_by: currentFilters.created_by || [],
          assigned_to: currentFilters.assigned_to || []
        }))
      }
    }
  }, [isOpen, currentFilters])

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/enquiries/filter_options/')
      setOptions(response.data)
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    // Convert filters to query params format
    const appliedFilters = {}
    
    if (filters.search) appliedFilters.search = filters.search
    if (filters.location) appliedFilters.location = filters.location
    if (filters.date) appliedFilters.date = filters.date
    if (filters.date_from) appliedFilters.date_from = filters.date_from
    if (filters.date_to) appliedFilters.date_to = filters.date_to
    if (filters.statuses.length) appliedFilters.status = filters.statuses
    if (filters.created_by.length) appliedFilters.created_by = filters.created_by
    if (filters.assigned_to.length) appliedFilters.assigned_to = filters.assigned_to
    if (filters.region) appliedFilters.region = filters.region
    if (filters.enquiry_type) appliedFilters.enquiry_type = filters.enquiry_type
    if (filters.priority) appliedFilters.priority = filters.priority
    if (filters.ordering) appliedFilters.ordering = filters.ordering
    
    onApply(appliedFilters)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      search: '',
      location: '',
      date: '',
      date_from: '',
      date_to: '',
      statuses: [],
      created_by: [],
      assigned_to: [],
      region: '',
      enquiry_type: '',
      priority: '',
      ordering: '-created_at'
    })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: FONT
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: PRIMARY }}>
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Basic Filters */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Basic Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  Search Enquiry
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  placeholder="Number, company, phone..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={e => handleFilterChange('location', e.target.value)}
                  placeholder="City or country..."
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Date Range</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  From
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={e => handleFilterChange('date_from', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  To
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={e => handleFilterChange('date_to', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Status</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {options.statuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => {
                    const newStatuses = filters.statuses.includes(status.value)
                      ? filters.statuses.filter(s => s !== status.value)
                      : [...filters.statuses, status.value]
                    handleFilterChange('statuses', newStatuses)
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1.5px solid ${filters.statuses.includes(status.value) ? PRIMARY : '#e5e7eb'}`,
                    background: filters.statuses.includes(status.value) ? `${PRIMARY}10` : '#fff',
                    color: filters.statuses.includes(status.value) ? PRIMARY : '#6b7280',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: FONT
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Created By Filter - Only for managers */}
          {userRole === 'manager' && options.created_by_users.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                Created By (Sales Representative)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {options.created_by_users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      const newUsers = filters.created_by.includes(user.id)
                        ? filters.created_by.filter(uid => uid !== user.id)
                        : [...filters.created_by, user.id]
                      handleFilterChange('created_by', newUsers)
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: `1.5px solid ${filters.created_by.includes(user.id) ? PRIMARY : '#e5e7eb'}`,
                      background: filters.created_by.includes(user.id) ? `${PRIMARY}10` : '#fff',
                      color: filters.created_by.includes(user.id) ? PRIMARY : '#6b7280',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: FONT
                    }}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assigned To Filter */}
          {options.assigned_to_users.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                Assigned To
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {options.assigned_to_users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      const newUsers = filters.assigned_to.includes(user.id)
                        ? filters.assigned_to.filter(uid => uid !== user.id)
                        : [...filters.assigned_to, user.id]
                      handleFilterChange('assigned_to', newUsers)
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: `1.5px solid ${filters.assigned_to.includes(user.id) ? PRIMARY : '#e5e7eb'}`,
                      background: filters.assigned_to.includes(user.id) ? `${PRIMARY}10` : '#fff',
                      color: filters.assigned_to.includes(user.id) ? PRIMARY : '#6b7280',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: FONT
                    }}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Filters */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Additional Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  Region
                </label>
                <select
                  value={filters.region}
                  onChange={e => handleFilterChange('region', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Regions</option>
                  {options.regions.map(region => (
                    <option key={region.value} value={region.value}>{region.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  Enquiry Type
                </label>
                <select
                  value={filters.enquiry_type}
                  onChange={e => handleFilterChange('enquiry_type', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Types</option>
                  {options.enquiry_types.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={e => handleFilterChange('priority', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Priorities</option>
                  {options.priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Sort By</h3>
            <select
              value={filters.ordering}
              onChange={e => handleFilterChange('ordering', e.target.value)}
              style={selectStyle}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="-enquiry_date">Enquiry Date: Newest First</option>
              <option value="enquiry_date">Enquiry Date: Oldest First</option>
              <option value="-prospective_value">Value: Highest First</option>
              <option value="prospective_value">Value: Lowest First</option>
              <option value="enquiry_number">Enquiry Number: A-Z</option>
              <option value="-enquiry_number">Enquiry Number: Z-A</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1.5px solid #e5e7eb',
              background: '#fff',
              color: '#6b7280',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: FONT
            }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: PRIMARY,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: FONT,
  boxSizing: 'border-box'
}

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: FONT,
  background: '#fff',
  cursor: 'pointer'
}