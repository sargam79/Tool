// Related Tools Sidebar - Dynamic tool link generator
// This file loads random related tools on every page for better internal linking and SEO

const allTools = [
    { name: 'Word Counter', href: 'word-counter-tool.html', icon: '📝' },
    { name: 'Password Generator', href: 'password-generator.html', icon: '🔐' },
    { name: 'QR Code Generator', href: 'qr-code-generator.html', icon: '🎯' },
    { name: 'AI Writing Assistant', href: 'ai-writing-assistant.html', icon: '✍️' },
    { name: 'Hashtag Generator', href: 'hashtag-generator.html', icon: '#️⃣' },
    { name: 'Color Palette Generator', href: 'color-palette-generator.html', icon: '🎨' },
    { name: 'Unit Converter', href: 'converter.html', icon: '🔄' },
    { name: 'PNG Converter', href: 'converter-png.html', icon: '🖼️' },
    { name: 'Resume Score AI', href: 'resume-score-ai.html', icon: '📊' },
    { name: 'Content Calendar', href: 'content-calendar-generator.html', icon: '📅' },
    { name: 'Nutrition Calculator', href: 'nutrition-calculator.html', icon: '🥗' },
    { name: 'Meal Planner', href: 'meal-planner.html', icon: '🍽️' },
    { name: 'JSON Schema Generator', href: 'json-schema-generator-pro.html', icon: '{}' },
    { name: 'Background Remover', href: 'background-remover.html', icon: '🎭' }
];

function getRandomTools(exclude = [], count = 5) {
    const available = allTools.filter(tool => !exclude.includes(tool.href));
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function loadRelatedTools(container = 'relatedTools', exclude = [], count = 5) {
    const tools = getRandomTools(exclude, count);
    const toolsHtml = tools.map(tool => `
        <a href="${tool.href}" class="related-tool">
            <div style="font-size:1.5rem;margin-bottom:0.5rem">${tool.icon}</div>
            <h4 style="color:var(--dark);margin-bottom:0.25rem;font-size:0.9rem">${tool.name}</h4>
        </a>
    `).join('');

    const element = document.getElementById(container);
    if (element) {
        element.innerHTML = toolsHtml;
    }
}

// Auto-load related tools on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    loadRelatedTools('relatedTools', [currentPage], 5);
});
