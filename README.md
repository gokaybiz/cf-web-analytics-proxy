## **Cloudflare Web Analytics Proxy**
### Bypasses ad blockers by proxying CWA requests through your own domain.

It routes:
- `/beacon.min.js` -> JS file with 24h caching
- `/beacon/performance` -> Performance data
- `/rum/*` -> Analytics API

It also forwards ip address, user agent, and referrer to Cloudflare's API.
