SMART MEDIA AWARENESS HUB — PHONE-ONLY SETUP

Files:
- index.html: the website
- server.js: backend; keeps API keys on the server
- package.json: dependencies and start command

IMPORTANT:
Never paste your OpenAI key into index.html or any browser-side JavaScript.
Use your hosting provider's Secrets / Environment Variables panel.

Required secret:
OPENAI_API_KEY = your OpenAI API key

Optional separate secret for live fact-check search:
GOOGLE_FACT_CHECK_API_KEY = a Google Fact Check Tools API key
An OpenAI key does NOT work for Google Fact Check Tools.

Optional:
OPENAI_MODEL = gpt-4o-mini

After adding secrets, run/deploy the Node.js app. The website and /api/chat route must be served from the same server/domain.
Check /api/health to see whether OPENAI_API_KEY is configured (it does not reveal the key).

API usage can incur charges. Set usage/spend limits in the provider dashboards and do not publish the server without reasonable protections.
