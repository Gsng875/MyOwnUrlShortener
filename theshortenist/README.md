# theshortenist 🔗

A high-performance, serverless URL shortener built on Cloudflare Workers and Cloudflare D1.

🌐 **Live Demo:** `https://theshortenist..workers.dev`

## Features
- **Serverless Edge Execution:** Ultra-low latency worldwide via Cloudflare Workers.
- **Serverless SQL:** Powered by Cloudflare D1 (SQLite at the edge).
- **Zero Idle Costs:** Built to handle high throughput with minimal resource usage.

## API Usage

### Shorten a Link
```bash
curl -X POST https://theshortenist..workers.dev/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "[https://github.com](https://github.com)"}'