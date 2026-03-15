/**
 * utils/audioUpload.ts
 * Upload audio qua backend API
 */

export interface UploadProgress {
  percent: number
  bytesTransferred: number
  totalBytes: number
}

interface UploadResult {
  downloadUrl: string
  storagePath: string
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): string | null {
  const allowed = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/m4a",
    "audio/x-m4a",
  ]

  if (!allowed.includes(file.type)) {
    return "File audio không hợp lệ"
  }

  if (file.size > 10 * 1024 * 1024) {
    return "File tối đa 10MB"
  }

  return null
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Upload audio
 */
export async function uploadAudioFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

  const formData = new FormData()
  formData.append("audio", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("POST", `${baseUrl}/audio/upload`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((event.loaded / event.total) * 100),
          bytesTransferred: event.loaded,
          totalBytes: event.total,
        })
      }
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)

        resolve({
          downloadUrl: res.url,
          storagePath: res.filename,
        })
      } catch (err) {
        reject(err)
      }
    }

    xhr.onerror = () => reject("Upload failed")

    xhr.send(formData)
  })
}