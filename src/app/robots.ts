import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/settings', '/my-deals', '/auth/'],
    },
    sitemap: 'https://azondeal.com/sitemap.xml',
  }
}
