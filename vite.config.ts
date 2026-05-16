import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // 코드 스플리팅 최적화: 라이브러리를 별도 청크로 분리하여 캐싱 효율 극대화
    rollupOptions: {
      output: {
        // Vite 8 (rolldown)에서는 manualChunks를 함수 형태로 제공해야 함
        manualChunks(id: string) {
          // React 코어: 거의 변경되지 않으므로 별도 캐싱 → 재방문 시 즉시 로드
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Firebase SDK: 무거운 라이브러리를 별도 청크로 분리
          if (id.includes('node_modules/firebase/') || 
              id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          // 애니메이션/UI 라이브러리
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // 아이콘 라이브러리
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
    // 청크 크기 경고 임계값 (kB)
    chunkSizeWarningLimit: 500,
    // 프로덕션 빌드 시 소스맵 제거 → 번들 크기 감소
    sourcemap: false,
    // CSS 코드 분리 활성화
    cssCodeSplit: true,
    // minify: Vite 8 기본 minifier (oxc) 사용 — 별도 설정 불필요
    // 타겟 브라우저 설정: 최신 브라우저 타겟으로 폴리필 최소화
    target: 'es2020',
  },
})
