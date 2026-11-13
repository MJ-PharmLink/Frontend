import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  // 운영 빌드에 API 주소가 빠지면 화면이 샘플 데이터로 배포되므로 빌드를 멈춘다
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, '.', 'VITE_')
    if (!env.VITE_API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL이 비어 있습니다. .env.production을 확인하세요.')
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})