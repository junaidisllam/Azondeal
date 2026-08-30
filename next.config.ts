import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-eu.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'ir-na.amazon-adsystem.com',
      },
      {
        protocol: 'https',
        hostname: 'ecx.images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'genty-potentiometric-braylon.ngrok-free.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'azondeal.com',
      },
      {
        protocol: 'https',
        hostname: 'www.azondeal.com',
      },
      {
        protocol: 'http',
        hostname: '192.168.56.1',
        port: '3000',
      },
    ],
  },
  allowedDevOrigins: [
    'http://192.168.56.1:3000',
    'https://192.168.56.1:3000',
    '192.168.56.1',
    'http://192.168.0.102:3000',
    'https://192.168.0.102:3000',
    '192.168.0.102',
    'localhost:3000',
    '127.0.0.1:3000',
    '127.0.0.1',
    '0.0.0.0',
    '0.0.0.0:3000',
    'genty-potentiometric-braylon.ngrok-free.dev',
    'https://genty-potentiometric-braylon.ngrok-free.dev',
    'http://genty-potentiometric-braylon.ngrok-free.dev',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    proxyClientMaxBodySize: '100mb',
  },
  turbopack: {}, 
};

export default withPWA(nextConfig);
