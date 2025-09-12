// Teste simples para verificar se o componente está sendo renderizado
const puppeteer = require('puppeteer');

async function testComponent() {
  console.log('=== TESTE DO COMPONENTE ===');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Acessar a página
    console.log('1. Acessando http://localhost:3000/app/students');
    await page.goto('http://localhost:3000/app/students', { waitUntil: 'networkidle0' });
    
    // Aguardar carregamento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar se há algum elemento da página de alunos
    const elements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const elementsWithText = Array.from(allElements)
        .filter(el => el.textContent && el.textContent.includes('Alunos'))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim(),
          className: el.className
        }));
      
      return elementsWithText;
    });
    
    console.log('Elementos com texto "Alunos":', elements);
    
    // Verificar se há algum erro de JavaScript
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      window.addEventListener('error', (e) => {
        errors.push({
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno
        });
      });
      return errors;
    });
    
    console.log('Erros de JavaScript:', jsErrors);
    
    // Aguardar um pouco para visualizar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testComponent();
