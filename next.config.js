/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AAI_API_KEY: process.env.AAI_API_KEY,
  },
}

module.exports = nextConfig 