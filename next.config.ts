
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://www.gstatic.com https://apis.google.com blob:;
              worker-src 'self' blob: data:;
              img-src 'self' blob: data: https://*;
              connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://*.google.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.gstatic.com blob:;
              frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://*.firebaseapp.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com data:;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@genkit-ai/google-genai',
      'firebase-admin',
      'long',
    ],
  },
};

export default pwaConfig(nextConfig);
