import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import UploadPage from './Upload'
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { addDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'

// Mock data
const mockCategories = [
  {
    id: 'living-room',
    name: 'Living Room',
    emoji: '🛋️',
    subCategories: [
      { id: 'sofas', name: 'Sofas', imageCount: 0, videoCount: 0 },
      { id: 'tables', name: 'Tables', imageCount: 0, videoCount: 0 }
    ]
  }
]

describe('Upload Component - Single File Upload Flow', () => {
  let mockUploadTask
  let user

  beforeEach(() => {
    user = userEvent.setup()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock upload task
    mockUploadTask = {
      on: vi.fn(),
      cancel: vi.fn(),
      snapshot: {
        ref: 'mock-ref'
      }
    }
    
    // Mock Firebase functions
    uploadBytesResumable.mockReturnValue(mockUploadTask)
    getDownloadURL.mockResolvedValue('https://mock-download-url.com/image.jpg')
    addDoc.mockResolvedValue({ id: 'mock-doc-id' })
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCategories[0]
    })
    updateDoc.mockResolvedValue()
    
    // Mock onSnapshot to return categories
    onSnapshot.mockImplementation((collection, callback) => {
      // Simulate async behavior
      setTimeout(() => {
        callback({
          empty: false,
          docs: mockCategories.map(cat => ({
            id: cat.id,
            data: () => cat
          }))
        })
      }, 0)
      return vi.fn() // unsubscribe function
    })
  })

  test('should start upload correctly when file is selected', async () => {
    render(<UploadPage />)
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    // Select category and subcategory
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    // Create a mock file
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    // Upload file
    await user.upload(fileInput, file)
    
    // Verify file appears in preview
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('Selected Files (1)')).toBeInTheDocument()
    
    // Click upload button
    const uploadButton = screen.getByRole('button', { name: /upload 1 file/i })
    expect(uploadButton).not.toBeDisabled()
    
    await user.click(uploadButton)
    
    // Verify upload starts
    expect(uploadBytesResumable).toHaveBeenCalledWith(
      expect.anything(),
      file
    )
    expect(screen.getByText('Starting upload...')).toBeInTheDocument()
  })

  test('should display progress updates during upload', async () => {
    render(<UploadPage />)
    
    // Wait for categories to load and set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: /upload 1 file/i }))
    
    // Simulate progress updates
    const progressCallback = mockUploadTask.on.mock.calls[0][1]
    
    // Simulate 50% progress
    progressCallback({
      bytesTransferred: 500,
      totalBytes: 1000,
      state: 'running'
    })
    
    await waitFor(() => {
      expect(screen.getByText('Uploading file 1 of 1')).toBeInTheDocument()
      expect(screen.getByText('📁 test-image.jpg')).toBeInTheDocument()
    })
    
    // Verify progress bar is displayed (check for progress bar element)
    const progressBars = document.querySelectorAll('.progress-bar, .upload-progress')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  test('should update completion status when upload finishes', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: /upload 1 file/i }))
    
    // Simulate successful completion
    const completionCallback = mockUploadTask.on.mock.calls[0][3]
    await completionCallback()
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'test-image.jpg',
          url: 'https://mock-download-url.com/image.jpg',
          type: 'image',
          categoryId: 'living-room',
          subCategoryId: 'sofas'
        })
      )
    })
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Verify alert was called
    expect(global.alert).toHaveBeenCalledWith('Upload complete!')
  })

  test('should handle upload errors gracefully', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: /upload 1 file/i }))
    
    // Simulate upload error
    const errorCallback = mockUploadTask.on.mock.calls[0][2]
    const mockError = new Error('Upload failed')
    mockError.code = 'storage/unknown'
    
    errorCallback(mockError)
    
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })
    
    // Verify error alert was shown
    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining('Firebase Storage Not Enabled')
    )
  })

  test('should handle timeout scenarios', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: /upload 1 file/i }))
    
    // Fast-forward time to trigger timeout (5 minutes)
    vi.useFakeTimers()
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000) // 5 minutes + 1 second
    
    await waitFor(() => {
      expect(mockUploadTask.cancel).toHaveBeenCalled()
    })
    
    vi.useRealTimers()
  })
})

describe('Upload Component - Multiple File Upload Scenarios', () => {
  let mockUploadTask
  let user

  beforeEach(() => {
    user = userEvent.setup()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock upload task
    mockUploadTask = {
      on: vi.fn(),
      cancel: vi.fn(),
      snapshot: {
        ref: 'mock-ref'
      }
    }
    
    // Mock Firebase functions
    uploadBytesResumable.mockReturnValue(mockUploadTask)
    getDownloadURL.mockResolvedValue('https://mock-download-url.com/image.jpg')
    addDoc.mockResolvedValue({ id: 'mock-doc-id' })
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCategories[0]
    })
    updateDoc.mockResolvedValue()
    
    // Mock onSnapshot to return categories
    onSnapshot.mockImplementation((collection, callback) => {
      // Simulate async behavior
      setTimeout(() => {
        callback({
          empty: false,
          docs: mockCategories.map(cat => ({
            id: cat.id,
            data: () => cat
          }))
        })
      }, 0)
      return vi.fn() // unsubscribe function
    })
  })

  test('should process multiple files sequentially', async () => {
    render(<UploadPage />)
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    // Select category and subcategory
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    // Create multiple mock files
    const files = [
      new File(['test content 1'], 'test-image-1.jpg', { type: 'image/jpeg' }),
      new File(['test content 2'], 'test-image-2.jpg', { type: 'image/jpeg' }),
      new File(['test content 3'], 'test-image-3.jpg', { type: 'image/jpeg' })
    ]
    
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    // Upload multiple files
    await user.upload(fileInput, files)
    
    // Verify all files appear in preview
    expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument()
    expect(screen.getByText('test-image-2.jpg')).toBeInTheDocument()
    expect(screen.getByText('test-image-3.jpg')).toBeInTheDocument()
    expect(screen.getByText('Selected Files (3)')).toBeInTheDocument()
    
    // Click upload button
    const uploadButton = screen.getByRole('button', { name: /upload 3 files/i })
    expect(uploadButton).not.toBeDisabled()
    
    await user.click(uploadButton)
    
    // Verify sequential processing starts
    expect(uploadBytesResumable).toHaveBeenCalledTimes(1) // First file starts immediately
    expect(screen.getByText('Uploading file 1 of 3')).toBeInTheDocument()
  })

  test('should track individual file status during multiple uploads', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const files = [
      new File(['test content 1'], 'test-image-1.jpg', { type: 'image/jpeg' }),
      new File(['test content 2'], 'test-image-2.jpg', { type: 'image/jpeg' })
    ]
    
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, files)
    await user.click(screen.getByRole('button', { name: /upload 2 files/i }))
    
    // Simulate progress for first file
    const progressCallback = mockUploadTask.on.mock.calls[0][1]
    progressCallback({
      bytesTransferred: 500,
      totalBytes: 1000,
      state: 'running'
    })
    
    await waitFor(() => {
      expect(screen.getByText('Uploading file 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('📁 test-image-1.jpg')).toBeInTheDocument()
    })
    
    // Verify individual progress tracking
    const progressBars = document.querySelectorAll('.progress-bar, .upload-progress')
    expect(progressBars.length).toBeGreaterThan(0)
    
    // Complete first file
    const completionCallback = mockUploadTask.on.mock.calls[0][3]
    await completionCallback()
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'test-image-1.jpg'
        })
      )
    })
  })

  test('should update overall upload completion status', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const files = [
      new File(['test content 1'], 'test-image-1.jpg', { type: 'image/jpeg' }),
      new File(['test content 2'], 'test-image-2.jpg', { type: 'image/jpeg' })
    ]
    
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, files)
    await user.click(screen.getByRole('button', { name: /upload 2 files/i }))
    
    // Mock multiple upload completions
    const completionCallback = mockUploadTask.on.mock.calls[0][3]
    
    // Complete first file
    await completionCallback()
    
    await waitFor(() => {
      expect(screen.getByText(/uploading file 2 of 2/i)).toBeInTheDocument()
    })
    
    // Complete second file (simulate second upload task)
    uploadBytesResumable.mockReturnValue({
      ...mockUploadTask,
      on: vi.fn((event, progress, error, complete) => {
        // Immediately call complete for second file
        setTimeout(() => complete(), 100)
        return vi.fn()
      })
    })
    
    // Wait for overall completion
    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Verify final success message
    expect(global.alert).toHaveBeenCalledWith('Upload complete!')
  })

  test('should handle mixed success and failure in multiple uploads', async () => {
    render(<UploadPage />)
    
    // Set up upload
    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
    
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'living-room')
    await user.selectOptions(screen.getByDisplayValue('Select a sub-category'), 'sofas')
    
    const files = [
      new File(['test content 1'], 'test-image-1.jpg', { type: 'image/jpeg' }),
      new File(['test content 2'], 'test-image-2.jpg', { type: 'image/jpeg' })
    ]
    
    const fileInput = screen.getByRole('button', { name: /drop files here/i }).querySelector('input[type="file"]')
    
    await user.upload(fileInput, files)
    await user.click(screen.getByRole('button', { name: /upload 2 files/i }))
    
    // Complete first file successfully
    const completionCallback = mockUploadTask.on.mock.calls[0][3]
    await completionCallback()
    
    // Simulate error on second file
    const errorCallback = mockUploadTask.on.mock.calls[0][2]
    const mockError = new Error('Upload failed')
    mockError.code = 'storage/unknown'
    
    errorCallback(mockError)
    
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })
    
    // Verify error handling
    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining('Firebase Storage Not Enabled')
    )
  })
})