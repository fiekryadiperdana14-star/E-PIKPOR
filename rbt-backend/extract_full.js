const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docxPath = 'c:\\Users\\kresnamukti\\Documents\\contoh saja\\Template Sample RBT.docx';
const zipPath = 'c:\\Users\\kresnamukti\\Documents\\contoh saja\\Template Sample RBT.zip';
const tempDir = path.join(__dirname, 'temp_docx_new');

fs.copyFileSync(docxPath, zipPath);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(xmlPath)) {
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const text = xmlContent.replace(/<w:p [^>]*>/g, '\n').replace(/<[^>]+>/g, '');
        fs.writeFileSync('full_template_text.txt', text);
        console.log('EXTRACTED TO full_template_text.txt');
    }
} catch (err) {
    console.error('Error:', err.message);
}
