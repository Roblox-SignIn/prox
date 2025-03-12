const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

// Start a browser instance using Puppeteer
async function startBrowser() {
  return await puppeteer.launch({
    headless: true, // set to false if you want to see the browser actions
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // add sandboxing for security reasons
  });
}

app.use(express.static('public')); // serve static files (like CSS, JS for frontend)

app.all('*', async (req, res) => {
  const browser = await startBrowser();
  const page = await browser.newPage();

  // Intercept requests and modify them if necessary
  page.on('response', async (response) => {
    if (response.url().includes('google.com')) {
      try {
        const responseBody = await response.text();

        // Modify the links so they stay within the proxy
        const modifiedResponse = responseBody.replace(/href="(http[s]?:\/\/[^"]+)"/g, 'href="http://localhost:3000$1"');

        // Ensure we send the response only once
        if (!res.headersSent) {
          res.send(modifiedResponse);
        }
      } catch (error) {
        console.error("Error processing response:", error);
      }
    }
  });

  try {
    // Navigate to the target URL (Google or search result pages)
    await page.goto('https://www.google.com' + req.url, { waitUntil: 'domcontentloaded' });

    // Extract the content of the page and send it back to the user
    const content = await page.content();

    // Ensure we send the response only once
    if (!res.headersSent) {
      res.send(content);
    }

  } catch (error) {
    console.error("Error navigating to page:", error);
    res.status(500).send("Internal Server Error");
  }

  await browser.close();
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
