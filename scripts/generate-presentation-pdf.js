const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  console.log('🎨 Generando presentación PDF para TFM...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const mdContent = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'TFM-PRESENTACION.md'), 
    'utf-8'
  );
  
  // Split by --- but ignore --- inside tables
  const lines = mdContent.split('\n');
  let inTable = false;
  let currentSlide = [];
  const slides = [];
  
  for (const line of lines) {
    // Check if we're entering/leaving a table
    if (line.trim().startsWith('|')) {
      inTable = true;
    } else if (inTable && !line.trim().startsWith('|') && line.trim() !== '') {
      inTable = false;
    }
    
    // Only split on --- when not in a table
    if (line.trim() === '---' && !inTable) {
      if (currentSlide.length > 0) {
        const slideContent = currentSlide.join('\n').trim();
        // Only include slides that have "Slide X:" in the content (valid presentation slides)
        if (slideContent.length > 10 && slideContent.includes('Slide')) {
          slides.push(slideContent);
        }
        currentSlide = [];
      }
    } else {
      currentSlide.push(line);
    }
  }
  
  // Don't forget the last slide - only if it has Slide X: header
  if (currentSlide.length > 0) {
    const slideContent = currentSlide.join('\n').trim();
    // Only include slides that have "Slide X:" in the content
    if (slideContent.length > 10 && slideContent.includes('Slide')) {
      slides.push(slideContent);
    }
  }
  
  console.log(`📄 Procesando ${slides.length} slides...`);
  
  const slidesHtml = slides.map((slide, index) => {
    const content = slide.trim();
    const isCover = index === 0 || content.includes('# 3D Print TFM') || content.includes('## Slide 1');
    
    if (content.length < 20) return '';
    
    // Check if slide has table or pre (code) - might need smaller font
    const hasTable = content.includes('|');
    const hasCode = content.includes('```');
    
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/✅/g, '<span style="color:#48bb78;font-weight:bold;">✓</span>')
      .replace(/```([\s\S]*?)```/g, (match, code) => {
        // MAXIMUM CONTRAST: Dark blue background with pure white text
        const lines = code.split('\n');
        const fontSize = lines.length > 8 ? '14px' : '16px';
        if (lines.length > 12) {
          return '<pre style="background:#1a365d;color:#ffffff;padding:20px;border-radius:10px;overflow-x:auto;font-size:' + fontSize + ';margin:15px 0;max-height:200px;overflow-y:auto;border:2px solid #2b6cb0;line-height:1.5;font-weight:600;">' + lines.slice(0, 12).join('\n') + '\n...</pre>';
        }
        return '<pre style="background:#1a365d;color:#ffffff;padding:20px;border-radius:10px;overflow-x:auto;font-size:' + fontSize + ';margin:15px 0;border:2px solid #2b6cb0;line-height:1.5;font-weight:600;">' + code + '</pre>';
      })
      .replace(/`([^`]+)`/g, '<code style="background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:13px;color:#e53e3e;">$1</code>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/^- (.*$)/gm, '<li>$1</li>');
    
    html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul style="margin:10px 0;padding-left:25px;">$&</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    
    const lines = html.split('\n');
    let processedLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || 
          trimmed.startsWith('</ul') || trimmed.startsWith('<pre') ||
          trimmed.startsWith('<li')) {
        processedLines.push(line);
      } else if (trimmed.startsWith('|')) {
        processedLines.push(line);
      } else if (trimmed && !trimmed.startsWith('<')) {
        processedLines.push('<p style="font-size:16px;margin-bottom:10px;line-height:1.6;">' + line + '</p>');
      } else {
        processedLines.push(line);
      }
    }
    
    html = processedLines.join('\n');
    
    // Convert tables with proper sizing
    const tableRegex = /(\|[^\n]+\|\n)+/g;
    const tables = html.match(tableRegex);
    if (tables) {
      tables.forEach(table => {
        const rows = table.trim().split('\n').filter(r => r.trim());
        if (rows.length < 2) return;
        
        let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:14px;background:#fff;">';
        rows.forEach((row, i) => {
          const cells = row.split('|').filter(c => c.trim());
          const tag = i === 0 ? 'th' : 'td';
          const style = i === 0 ? 'background:#4c51bf;color:white;font-weight:600;padding:10px;border:1px solid #ddd;text-align:left;font-size:13px;' : 'padding:10px;border:1px solid #ddd;text-align:left;font-size:13px;';
          const bgStyle = i % 2 === 0 ? 'background:#f8f9fa;' : '';
          tableHtml += '<tr>' + cells.map(c => '<' + tag + ' style="' + style + bgStyle + '">' + c.trim() + '</' + tag + '>').join('') + '</tr>';
        });
        tableHtml += '</table>';
        
        html = html.replace(table, tableHtml);
      });
    }
    
    const slideClass = isCover ? 'cover' : '';
    
    return '<div class="slide ' + slideClass + '" style="width:297mm;height:210mm;padding:30px;page-break-after:always;display:flex;flex-direction:column;position:relative;overflow:hidden;background:' + (isCover ? 'linear-gradient(135deg, #4c51bf 0%, #553c9a 50%, #44337a 100%);justify-content:center;align-items:center;text-align:center;color:white;' : '#667eea;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;') + '">' +
      '<div class="slide-content" style="' + (isCover ? 'background:transparent !important;box-shadow:none !important;color:white !important;padding:40px;' : 'background:#ffffff;color:#1a1a1a;padding:30px;border-radius:15px;flex:1;box-shadow:0 10px 40px rgba(0,0,0,0.2);overflow-y:auto;') + '">' +
        html +
      '</div>' +
      '<div class="footer" style="position:absolute;bottom:15px;right:30px;color:rgba(255,255,255,0.9);font-size:12px;text-shadow:1px 1px 2px rgba(0,0,0,0.3);">TFM - Rejane Rodrigues | ' + (index + 1) + '/' + slides.length + '</div>' +
    '</div>';
  }).filter(s => s).join('\n');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
    
    /* Cover slides - HIGH CONTRAST */
    .slide.cover h1 { font-size: 60px; color: #ffffff; margin-bottom: 20px; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); font-weight: 800; letter-spacing: -1px; }
    .slide.cover h2 { font-size: 32px; color: #ffffff; border: none; text-align: center; margin-bottom: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.4); font-weight: 600; }
    .slide.cover h3 { font-size: 24px; color: #ffffff; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); margin: 10px 0; }
    .slide.cover p { font-size: 20px; color: #ffffff; margin-top: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
    .slide.cover strong { color: #ffffff; font-weight: 700; }
    .slide.cover li { color: #ffffff; font-size: 18px; }
    
    /* Regular slides - WHITE BACKGROUND BOX */
    .slide:not(.cover) h1 { font-size: 36px; color: #4c51bf; margin-bottom: 15px; text-align: center; font-weight: 700; }
    .slide:not(.cover) h2 { font-size: 28px; color: #553c9a; margin-bottom: 20px; border-bottom: 3px solid #667eea; padding-bottom: 8px; font-weight: 600; }
    .slide:not(.cover) h3 { font-size: 22px; color: #333; margin: 12px 0; font-weight: 600; }
    .slide:not(.cover) p { font-size: 16px; color: #333; margin-bottom: 10px; }
    .slide:not(.cover) li { font-size: 15px; color: #333; margin-bottom: 8px; }
    .slide:not(.cover) strong { color: #4c51bf; }
    
    /* Ensure no black backgrounds */
    body { background: white; }
    .slide { background-color: #667eea !important; }
    .slide.cover { background: linear-gradient(135deg, #4c51bf 0%, #553c9a 50%, #44337a 100%) !important; }
    .slide:not(.cover) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; }
    
    /* Content box always white */
    .slide-content { background: #ffffff !important; }
    .slide.cover .slide-content { background: transparent !important; }
    
    /* PRE blocks - MAXIMUM CONTRAST - Dark blue bg with white text */
    pre {
      background: #1a365d !important;
      color: #ffffff !important;
      border: 2px solid #2b6cb0 !important;
      padding: 20px !important;
      border-radius: 10px !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      line-height: 1.5 !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    }
    pre * { color: #ffffff !important; }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  
  const outputPath = path.join(__dirname, '..', 'docs', 'TFM-PRESENTACION.pdf');
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  
  await browser.close();
  
  console.log('✅ PDF generado exitosamente!');
  console.log(`📄 Ubicación: ${outputPath}`);
  console.log(`📊 Total de slides: ${slides.length}`);
}

generatePDF().catch(err => {
  console.error('❌ Error generando PDF:', err);
  process.exit(1);
});
