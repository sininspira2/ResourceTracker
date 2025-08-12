'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PointsCalculation {
  basePoints: number
  resourceMultiplier: number
  statusBonus: number
  finalPoints: number
}

interface CongratulationsPopupProps {
  isVisible: boolean
  onClose: () => void
  pointsEarned: number
  pointsCalculation?: PointsCalculation
  resourceName: string
  actionType: 'ADD' | 'SET' | 'REMOVE'
  quantityChanged: number
  userId?: string
}

export function CongratulationsPopup({
  isVisible,
  onClose,
  pointsEarned,
  pointsCalculation,
  resourceName,
  actionType,
  quantityChanged,
  userId
}: CongratulationsPopupProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }

  const handleViewContributions = () => {
    if (userId) {
      router.push(`/dashboard/contributions/${userId}`)
    }
    handleClose()
  }

  if (!isVisible) return null

  const getActionText = () => {
    switch (actionType) {
      case 'ADD':
        return `Added ${quantityChanged.toLocaleString()}`
      case 'SET':
        return `Set quantity`
      case 'REMOVE':
        return `Removed ${quantityChanged.toLocaleString()}`
      default:
        return 'Updated'
    }
  }

  const getMultiplierDisplay = (multiplier: number) => {
    if (multiplier === 1) return '1x'
    return `${multiplier}x`
  }

  const getBonusDisplay = (bonus: number) => {
    if (bonus === 0) return 'No bonus'
    return `+${(bonus * 100).toFixed(0)}% bonus`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700
          max-w-sm w-full transform transition-all duration-300 pointer-events-auto
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-lg">Congratulations!</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {pointsEarned > 0 ? (
            <>
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{pointsEarned.toFixed(1)} points
                  </span>
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getActionText()} {resourceName}
                </p>
              </div>

              {/* Points Breakdown */}
              {pointsCalculation && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Base points:</span>
                      <span className="text-gray-900 dark:text-gray-100">{pointsCalculation.basePoints.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Multiplier:</span>
                      <span className="text-gray-900 dark:text-gray-100">{getMultiplierDisplay(pointsCalculation.resourceMultiplier)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Status bonus:</span>
                      <span className="text-gray-900 dark:text-gray-100">{getBonusDisplay(pointsCalculation.statusBonus)}</span>
                    </div>
                    <hr className="my-2 border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900 dark:text-gray-100">Total:</span>
                      <span className="text-gray-900 dark:text-gray-100">{pointsCalculation.finalPoints.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleViewContributions}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                View My Contributions
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {getActionText()} {resourceName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No points earned for this action
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 