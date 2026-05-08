// ============================================================
// GOALZONE - Supabase Image Upload Helper
// ============================================================
// Fungsi untuk mengupload gambar dari admin dashboard
// ke Supabase Storage bucket "news-images"
// ============================================================

import { supabase } from './client'

/**
 * Upload gambar berita ke Supabase Storage
 *
 * @param file - File gambar yang akan diupload (dari input type="file")
 * @param slug - Slug artikel (digunakan untuk penamaan file)
 * @param folder - Subfolder: 'articles' | 'heroes' | 'logos'
 * @returns URL publik gambar yang sudah diupload
 *
 * @example
 * ```tsx
 * const input = e.target as HTMLInputElement
 * const file = input.files?.[0]
 * if (!file) return
 *
 * const imageUrl = await uploadNewsImage(file, 'ronaldo-resmi-ke-al-nassr', 'articles')
 * console.log(imageUrl) // https://xxx.supabase.co/storage/v1/object/public/news-images/articles/2025/01/...
 * ```
 */
export async function uploadNewsImage(
  file: File,
  slug: string,
  folder: 'articles' | 'heroes' | 'logos' = 'articles'
): Promise<{ url: string; path: string }> {
  // Validasi tipe file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`)
  }

  // Validasi ukuran file (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error(`Ukuran file terlalu besar. Maksimal 5MB, file Anda ${(file.size / 1024 / 1024).toFixed(1)}MB`)
  }

  // Generate nama file unik
  const timestamp = Date.now()
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  // Determine file extension
  const ext = file.name.split('.').pop() || 'jpg'
  // Prefer webp if possible
  const finalExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg+xml'].includes(ext) ? ext : 'jpg'

  const fileName = `${timestamp}-${slug}.${finalExt}`
  const filePath = `${folder}/${year}/${month}/${fileName}`

  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Upload ke Supabase Storage
  const { data, error } = await supabase.storage
    .from('news-images')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year cache (immutable)
      upsert: false,
    })

  if (error) {
    throw new Error(`Gagal upload gambar: ${error.message}`)
  }

  // Dapatkan URL publik
  const { data: urlData } = supabase.storage
    .from('news-images')
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Upload gambar dari URL (untuk mengimport gambar dari sumber lain)
 *
 * @param imageUrl - URL gambar sumber
 * @param slug - Slug artikel
 * @param folder - Subfolder
 * @returns URL publik gambar yang sudah diupload
 */
export async function uploadNewsImageFromUrl(
  imageUrl: string,
  slug: string,
  folder: 'articles' | 'heroes' | 'logos' = 'articles'
): Promise<{ url: string; path: string }> {
  // Fetch gambar dari URL
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Gagal mengambil gambar dari URL: HTTP ${response.status}`)
  }

  const blob = await response.blob()

  // Validasi tipe
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(blob.type)) {
    throw new Error(`Tipe file tidak didukung: ${blob.type}`)
  }

  const file = new File([blob], `${slug}.jpg`, { type: blob.type })
  return uploadNewsImage(file, slug, folder)
}

/**
 * Hapus gambar dari Supabase Storage
 *
 * @param path - Path file relatif terhadap bucket
 *
 * @example
 * ```tsx
 * await deleteNewsImage('articles/2025/01/1706200000-ronaldo-resmi-ke-al-nassr.jpg')
 * ```
 */
export async function deleteNewsImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('news-images')
    .remove([path])

  if (error) {
    throw new Error(`Gagal menghapus gambar: ${error.message}`)
  }
}

/**
 * Upload avatar user
 *
 * @param file - File gambar avatar
 * @param userId - UUID user
 * @returns URL publik avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  // Validasi
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Avatar harus berupa JPG, PNG, atau WebP')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran avatar maksimal 2MB')
  }

  // Generate path: avatars/{userId}/avatar.webp
  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `${userId}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '86400', // 1 day cache
      upsert: true, // Overwrite if exists
    })

  if (error) {
    throw new Error(`Gagal upload avatar: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update user profile with new avatar
  await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Optimasi gambar sebelum upload (resize + compress)
 * Menggunakan canvas API di browser
 *
 * @param file - File gambar asli
 * @param maxWidth - Lebar maksimal (default 1200px)
 * @param quality - Kualitas JPEG (0-1, default 0.85)
 * @returns File yang sudah dioptimasi
 */
export async function optimizeImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Resize if larger than maxWidth
        if (width > maxWidth) {
          const ratio = maxWidth / width
          width = maxWidth
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengkonversi gambar'))
              return
            }
            const optimized = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            resolve(optimized)
          },
          'image/webp',
          quality
        )
      }
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}
