'use client'

import { useState, useEffect } from 'react'
import { CATEGORY_OPTIONS } from '@/lib/constants'

interface Resource {
  id: string
  name: string
  category?: string
  description?: string
  imageUrl?: string
  multiplier?: number
  isPriority?: boolean
}

interface EditResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (resourceId: string, data: any) => Promise<void>
  resource: Resource | null
}

export function EditResourceModal({ isOpen, onClose, onSave, resource }: EditResourceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Raw',
    description: '',
    imageUrl: '',
    multiplier: 1.0,
    isPriority: false
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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
    if (isOpen && resource) {
      setFormData({
        name: resource.name,
        category: resource.category || 'Raw',
        description: resource.description || '',
        imageUrl: resource.imageUrl || '',
        multiplier: resource.multiplier || 1.0,
        isPriority: resource.isPriority || false,
      })
      setError(null)
      setSaving(false)
    }
  }, [isOpen, resource])

  const handleSave = async () => {
    if (!resource) return

    if (!formData.name) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(resource.id, formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  if (!showModal || !resource) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ease-in-out ${
        isAnimating ? 'bg-black/50' : 'bg-black/0'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-resource-modal-title"
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 max-w-lg lg:max-w-xl w-full mx-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="edit-resource-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit {resource.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points Multiplier</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.multiplier}
              onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1.0 })}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPriority"
              type="checkbox"
              checked={formData.isPriority}
              onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPriority" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Priority Resource
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
