'use client'

import { useState, useEffect } from 'react'

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

interface HistoryEntry {
  id: string
  resourceId: string
  previousQuantityHagga: number
  newQuantityHagga: number
  changeAmountHagga: number
  previousQuantityDeepDesert: number
  newQuantityDeepDesert: number
  changeAmountDeepDesert: number
  transferAmount?: number
  transferDirection?: 'to_deep_desert' | 'to_hagga'
  changeType: 'absolute' | 'relative' | 'transfer'
  updatedBy: string
  reason?: string
  createdAt: string
}

interface ResourceHistoryChartProps {
  resourceId: string
  resourceName: string
  customButton?: {
    className?: string
    children?: React.ReactNode
  }
}

export function ResourceHistoryChart({ resourceId, resourceName, customButton }: ResourceHistoryChartProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<HistoryEntry | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!isOpen) return
    
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/resources/${resourceId}/history?days=${days}`)
        if (response.ok) {
          const data = await response.json()
          setHistory(data)
        }
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [resourceId, days, isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={customButton?.className || "text-gray-600 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"}
        title="View resource history"
      >
        {customButton?.children || (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">{resourceName} - History</h2>
            <p className="text-gray-600 text-sm">Last {days} days</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No changes in the last {days} days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple line chart visualization */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Quantity Over Time</h3>
                <div className="relative h-32">
                  {history.length > 1 && (
                    <div className="relative">
                      <svg 
                        className="w-full h-full"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMousePosition({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          })
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                      {history.slice().reverse().map((entry, index, arr) => {
                        if (index === arr.length - 1) return null
                        const nextEntry = arr[index + 1]
                        
                        const x1 = (index / (arr.length - 1)) * 100
                        const x2 = ((index + 1) / (arr.length - 1)) * 100
                        
                        const maxQuantity = Math.max(...history.map(h => Math.max(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                        const y1 = 100 - ((entry.newQuantityHagga + entry.newQuantityDeepDesert) / maxQuantity) * 80
                        const y2 = 100 - ((nextEntry.newQuantityHagga + nextEntry.newQuantityDeepDesert) / maxQuantity) * 80
                        
                        return (
                          <line
                            key={entry.id}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                        )
                      })}
                      
                      {/* Data points */}
                      {history.slice().reverse().map((entry, index, arr) => {
                        const x = (index / (arr.length - 1)) * 100
                        const maxQuantity = Math.max(...history.map(h => Math.max(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                        const y = 100 - ((entry.newQuantityHagga + entry.newQuantityDeepDesert) / maxQuantity) * 80
                        
                        return (
                          <circle
                            key={`point-${entry.id}`}
                            cx={`${x}%`}
                            cy={`${y}%`}
                              r="4"
                            fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-pointer hover:r-6 transition-all"
                              onMouseEnter={() => setHoveredPoint(entry)}
                              onMouseLeave={() => setHoveredPoint(null)}
                          />
                        )
                      })}
                    </svg>
                      
                      {/* Tooltip */}
                      {hoveredPoint && (
                        <div 
                          className="absolute bg-black text-white text-xs rounded px-2 py-1 pointer-events-none z-10 whitespace-nowrap"
                          style={{
                            left: mousePosition.x + 10,
                            top: mousePosition.y - 10,
                            transform: mousePosition.x > 200 ? 'translateX(-100%)' : 'none'
                          }}
                        >
                          <div className="font-medium">{formatNumber(hoveredPoint.newQuantityHagga + hoveredPoint.newQuantityDeepDesert)}</div>
                          <div className="text-gray-300">
                            {hoveredPoint.changeAmountHagga + hoveredPoint.changeAmountDeepDesert > 0 ? '+' : ''}{formatNumber(hoveredPoint.changeAmountHagga + hoveredPoint.changeAmountDeepDesert)}
                          </div>
                          <div className="text-gray-300">By: {hoveredPoint.updatedBy}</div>
                          <div className="text-gray-300">
                            {new Date(hoveredPoint.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* History list */}
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Changes</h3>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.changeAmountHagga + entry.changeAmountDeepDesert > 0 ? 'bg-green-500' :
                          entry.changeAmountHagga + entry.changeAmountDeepDesert < 0 ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="font-medium">
                            {entry.changeType === 'transfer' ? (
                              <span>
                                Transfer {entry.transferAmount} {entry.transferDirection === 'to_deep_desert' ? 'to Deep Desert' : 'to Hagga'}
                              </span>
                            ) : (
                              <div>
                                <div>
                                  Hagga: {formatNumber(entry.previousQuantityHagga)} → {formatNumber(entry.newQuantityHagga)} ({entry.changeAmountHagga > 0 ? '+' : ''}{formatNumber(entry.changeAmountHagga)})
                                </div>
                                <div>
                                  Deep Desert: {formatNumber(entry.previousQuantityDeepDesert)} → {formatNumber(entry.newQuantityDeepDesert)} ({entry.changeAmountDeepDesert > 0 ? '+' : ''}{formatNumber(entry.changeAmountDeepDesert)})
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            By {entry.updatedBy}
                            {entry.reason && (
                              <span className="ml-2 text-blue-600">• {entry.reason}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 