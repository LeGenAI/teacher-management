/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AAI_API_KEY: process.env.AAI_API_KEY,
  },
  // 파일 업로드 관련 설정 추가
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node']
  },
  // API 라우트 설정
  api: {
    bodyParser: {
      sizeLimit: '100mb', // 파일 크기 제한을 100MB로 증가
    },
    responseLimit: false,
  },
  // 서버 타임아웃 설정
  serverRuntimeConfig: {
    maxDuration: 300, // 5분 타임아웃
  },
}

module.exports = nextConfig 