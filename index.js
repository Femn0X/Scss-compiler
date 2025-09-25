// SCSS Compiler (simple, non-exhaustive)
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

// Simple linter: basic checks for unmatched braces and missing colons
function lintSCSS(scss) {
    const errors = [];
    const lines = scss.split('\n');
    const stack = [];
    lines.forEach((raw, i) => {
        const line = raw.trim();
        if (!line) return;
        if (line.endsWith('{')) {
            stack.push({ line: i + 1, text: line });
        } else if (line === '}') {
            if (stack.length === 0) {
                errors.push({ line: i + 1, msg: 'Unmatched closing brace' });
            } else {
                stack.pop();
            }
        } else if (line.includes(':')) {
            // ensure property has a value
            const parts = line.split(':');
            if (parts.length < 2 || parts[1].trim().length === 0) {
                errors.push({ line: i + 1, msg: 'Property missing value after :'});
            }
        } else if (line.startsWith('$') && !line.includes(':')) {
            errors.push({ line: i + 1, msg: 'Variable declaration missing :'});
        }
    });
    stack.forEach(s => errors.push({ line: s.line, msg: 'Unclosed block starting here' }));
    return errors;
}

function showErrors(errors) {
    const panel = document.getElementById('error-panel');
    if (!errors || errors.length === 0) {
        panel.classList.add('hidden');
        panel.innerText = '';
        return;
    }
    panel.classList.remove('hidden');
    panel.innerHTML = errors.map(e => `<div><strong>Line ${e.line}:</strong> ${e.msg}</div>`).join('');
}

function updateHighlighting() {
    const input = document.getElementById('input-1').value;
    const codeEl = document.getElementById('code-1');
    // escape HTML
    codeEl.textContent = input;
    if (window.Prism) Prism.highlightElement(codeEl);
}

function updateOutputHighlight(css) {
    const codeEl = document.getElementById('code-2');
    codeEl.textContent = css;
    if (window.Prism) Prism.highlightElement(codeEl);
}

// wire buttons and live events
document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('input-1');
    const outputEl = document.getElementById('output-1');
    const compileBtn = document.getElementById('button-1');
    const downloadBtn = document.getElementById('download-1');

    // live highlight on input
    inputEl.addEventListener('input', () => {
        updateHighlighting();
        const errors = lintSCSS(inputEl.value);
        showErrors(errors);
    });

    compileBtn.addEventListener('click', () => {
        const scss = inputEl.value;
        const errors = lintSCSS(scss);
        showErrors(errors);
        if (errors.length > 0) return;
        const css = compileSCSS(scss);
        outputEl.value = css;
        updateOutputHighlight(css);
    });

    downloadBtn.addEventListener('click', () => {
        const css = outputEl.value;
        if (!css) {
            // try compiling if empty
            const scss = inputEl.value;
            const errors = lintSCSS(scss);
            showErrors(errors);
            if (errors.length > 0) return;
            const compiled = compileSCSS(scss);
            outputEl.value = compiled;
        }
        const blob = new Blob([outputEl.value], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'styles.css';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    // initial highlight
    updateHighlighting();
});
