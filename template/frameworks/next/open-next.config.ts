import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// OpenNext's Cloudflare settings. Pages that revalidate (ISR) need an incremental cache, such as R2 (OpenNext's
// caching guide).
export default defineCloudflareConfig()
