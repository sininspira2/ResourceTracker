'use client'

import { useState, useEffect } from 'react'

interface UpdateQuantityModalProps {
  resource: {
    id: string
    name: string
    quantityHagga: number
    quantityDeepDesert: number
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (resourceId: string, amount: number, quantityField: 'quantityHagga' | 'quantityDeepDesert', updateType: 'absolute' | 'relative') => Promise<void>
  updateType: 'absolute' | 'relative'
}

export function UpdateQuantityModal({ resource, isOpen, onClose, onUpdate, updateType }: UpdateQuantityModalProps) {
  const [amount, setAmount] = useState(0)
  const [quantityField, setQuantityField] = useState<'quantityHagga' | 'quantityDeepDesert'>('quantityHagga')
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

  useEffect(() => {
    if (isOpen) {
      setAmount(0)
      setError(null)
    }
  }, [isOpen])

  const handleUpdate = async () => {
    setError(null)
    if (updateType === 'relative' && amount === 0) {
      setError('Amount cannot be zero for relative updates.')
      return
    }
    if (updateType === 'absolute' && amount < 0) {
        setError('Amount must be positive for absolute updates.')
        return
    }

    try {
      await onUpdate(resource.id, amount, quantityField, updateType)
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    }
  }

  if (!showModal) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ease-in-out ${
        isAnimating ? 'bg-black/50' : 'bg-black/0'
      }`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{updateType === 'absolute' ? 'Set' : 'Add/Remove'} {resource.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {updateType === 'absolute' ? 'New Quantity' : 'Amount to Add/Remove'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base</label>
            <select
              value={quantityField}
              onChange={(e) => setQuantityField(e.target.value as 'quantityHagga' | 'quantityDeepDesert')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="quantityHagga">Hagga</option>
              <option value="quantityDeepDesert">Deep Desert</option>
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
            onClick={handleUpdate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
          >
            {updateType === 'absolute' ? 'Set' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
