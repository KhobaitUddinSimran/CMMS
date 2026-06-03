const { chromium } = require('playwright');
const fs = require('fs');
const markdown = require('markdown-it')();

async function generatePDF() {
  const mdContent = fs.readFileSync('USER_STORIES_TESTING.md', 'utf8');
  const htmlContent = markdown.render(mdContent);
  
  const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CMMS User Stories Testing</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #1a365d; border-bottom: 3px solid #3182ce; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; page-break-after: avoid; }
    h3 { color: #4a5568; margin-top: 30px; page-break-after: avoid; }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      margin: 20px 0; 
      font-size: 14px;
      page-break-inside: auto;
    }
    th { 
      background: #4a5568; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      font-weight: 600;
    }
    td { 
      padding: 10px 12px; 
      border-bottom: 1px solid #e2e8f0; 
    }
    tr:nth-child(even) { background: #f7fafc; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    code {
      background: #edf2f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 90%;
    }
    hr { border: none; border-top: 2px solid #e2e8f0; margin: 30px 0; }
    ul, ol { margin: 15px 0; padding-left: 30px; }
    li { margin: 5px 0; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(fullHTML);
  await page.pdf({
    path: 'CMMS_User_Stories_Testing.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });
  await browser.close();
  console.log('PDF generated: CMMS_User_Stories_Testing.pdf');
}

generatePDF().catch(console.error);
