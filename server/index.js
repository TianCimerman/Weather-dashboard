const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const next = require('next');
const path = require('path');

const dev = false;
console.log('📁 Next dir:', path.join(__dirname, '..'));
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

const PORT = 3000;

console.log('⏳ Preparing Next.js...');

nextApp.prepare()
  .then(() => {
    console.log('✅ Next.js prepared');
    const app = express();

    app.use(cors());
    app.use(express.json());

    async function autoLogin(password = 'helios') {
      console.log('[AutoLogin] Starting login process...');

//Raspberry Pi version
    const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
      headless: true,
    }); 

//Windows / standard version
//  const browser = await puppeteer.launch({
//    headless: true, // set to false for debugging
//    args: ['--no-sandbox', '--disable-setuid-sandbox']
//  });
    
      const page = await browser.newPage();
      await page.goto('http://192.168.1.180/', { waitUntil: 'networkidle2' });
      await page.type('#v00402', password);
      await page.click('#but0');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
      return { status: 'Login successful (maybe 😄)' };
    }

    let lastLoginTimestamp = 0;

    app.post('/auto-login', async (req, res) => {
      const now = Date.now();
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (now - lastLoginTimestamp < TWO_HOURS) {
        const waitMinutes = Math.ceil((TWO_HOURS - (now - lastLoginTimestamp)) / 60000);
        return res.status(429).json({ error: `Too many requests. Please wait ${waitMinutes} minutes before retrying.` });
      }
      const password = req.body.password || 'helios';
      try {
        const result = await autoLogin(password);
        res.json(result);
        lastLoginTimestamp = Date.now();
      } catch (err) {
        console.error('[AutoLogin] Error:', err.message);
        res.status(500).json({ error: err.message });
      }
    });

    app.all('/{*path}', (req, res) => handle(req, res));

    console.log('⏳ Starting Express on port', PORT);
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });