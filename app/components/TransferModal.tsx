'use client'

import { useState, useEffect } from 'react'

interface TransferModalProps {
  resource: {
    id: string
    name: string
    quantityHagga: number
    quantityDeepDesert: number
  }
  isOpen: boolean
  onClose: () => void
  onTransfer: (resourceId: string, amount: number, direction: 'to_deep_desert' | 'to_hagga') => Promise<void>
}

export function TransferModal({ resource, isOpen, onClose, onTransfer }: TransferModalProps) {
  const [amount, setAmount] = useState(0)
  const [direction, setDirection] = useState<'to_deep_desert' | 'to_hagga'>('to_deep_desert')
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowModal(true)
      const timer = setTimeout(() => setIsAnimating(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShowModal(false), 300) // Animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleTransfer = async () => {
    setError(null)
    if (amount <= 0) {
      setError('Amount must be positive.')
      return
    }
    if (direction === 'to_deep_desert' && amount > resource.quantityHagga) {
      setError('Insufficient quantity in Hagga base.')
      return
    }
    if (direction === 'to_hagga' && amount > resource.quantityDeepDesert) {
      setError('Insufficient quantity in Deep Desert base.')
      return
    }

    try {
      await onTransfer(resource.id, amount, direction)
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    }
  }

  if (!showModal) return null

  return (
    <div
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out ${
        isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Transfer {resource.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'to_deep_desert' | 'to_hagga')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="to_deep_desert">Hagga to Deep Desert</option>
              <option value="to_hagga">Deep Desert to Hagga</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  )
}
