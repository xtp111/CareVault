import { formatFileSize } from '@/lib/utils'

describe('Utils - formatFileSize', () => {
  test('should format bytes correctly', () => {
    expect(formatFileSize(undefined)).toBe('')
    expect(formatFileSize(500)).toBe('500 B')
  })

  test('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(5120)).toBe('5.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  test('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
    expect(formatFileSize(5242880)).toBe('5.0 MB')
    expect(formatFileSize(1572864)).toBe('1.5 MB')
  })
})
