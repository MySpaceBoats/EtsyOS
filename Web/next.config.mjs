/** @type {import('next').NextConfig} */
const nextConfig = {
  // R2 images are already served through Cloudflare's edge CDN. A second Next.js
  // optimization layer needs an image-optimization server that does not exist on
  // Cloudflare Pages' edge runtime — so we skip it and let R2/CF cache the images.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
