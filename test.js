// Minimal test for SCSS compiler
const fs = require('fs');
const path = require('path');

// Inline the compileSCSS function (copied from index.js)
function compileSCSS(scss) {
    const variables = {};
    const selectorStack = [];
    const cssBlocks = [];
    const lines = scss.split('\n');
    for (let rawLine of lines) {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) continue;
        if (trimmedLine.startsWith('$')) {
            const idx = trimmedLine.indexOf(':');
            if (idx === -1) continue;
            const key = trimmedLine.slice(0, idx).trim();
            const val = trimmedLine.slice(idx + 1).replace(';', '').trim();
            variables[key] = val;
            continue;
        }
        if (trimmedLine.endsWith('{')) {
            const selector = trimmedLine.slice(0, -1).trim();
            selectorStack.push(selector);
            continue;
        }
        if (trimmedLine === '}') {
            selectorStack.pop();
            continue;
        }
        if (trimmedLine.includes(':')) {
            const fullSelector = selectorStack.join(' ').trim() || '&';
            let rule = trimmedLine;
            for (const [key, val] of Object.entries(variables)) {
                const regex = new RegExp(`\\${key}\\b`, 'g');
                rule = rule.replace(regex, val);
            }
            cssBlocks.push({ selector: fullSelector, rule });
        }
    }
    // Group and output CSS after parsing all lines
    const groupedBlocks = {};
    cssBlocks.forEach(({ selector, rule }) => {
        if (!groupedBlocks[selector]) groupedBlocks[selector] = [];
        const formattedRule = rule.trim().endsWith(';') ? `  ${rule.trim()}` : `  ${rule.trim()};`;
        groupedBlocks[selector].push(formattedRule);
    });
    let finalCSS = '';
    for (const [selector, rules] of Object.entries(groupedBlocks)) {
        finalCSS += `${selector} {\n${rules.join('\n')}\n}\n`;
    }
    return finalCSS.trim();
}

// Test case
const input = `$primary: #3490dc;\n.card {\n  background: $primary;\n}`;
const expected = `.card {\n  background: #3490dc;\n}`;
const output = compileSCSS(input);
if (output.replace(/\s+/g, '') === expected.replace(/\s+/g, '')) {
    console.log('Test passed!');
    process.exit(0);
} else {
    console.error('Test failed!');
    console.error('Expected:', expected);
    console.error('Got:', output);
    process.exit(1);
}
