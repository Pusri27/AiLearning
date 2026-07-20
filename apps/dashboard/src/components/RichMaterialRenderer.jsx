import React, { useState } from 'react';
import Icon from './Icon';

/**
 * Custom light-weight syntax highlighter for code blocks
 */
const highlightCode = (code, language) => {
  if (!code) return '';
  
  const escapeHtml = (str) => 
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const escaped = escapeHtml(code);
  const lang = language ? language.toLowerCase() : '';
  
  if (!lang || !['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx', 'html', 'css', 'python', 'py'].includes(lang)) {
    return escaped;
  }
  
  if (lang === 'html') {
    return escaped
      // Comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500 font-medium italic">$1</span>')
      // Attributes: name="value" or name='value'
      .replace(/(\s[a-zA-Z0-9_-]+=)(["'].*?["'])/g, '$1<span class="text-emerald-400 font-medium">$2</span>')
      // Tags: &lt;tag or &lt;/tag or &gt;
      .replace(/(&lt;\/?[a-zA-Z0-9:-]+)/g, '<span class="text-rose-400 font-bold">$1</span>')
      .replace(/(\/?&gt;)/g, '<span class="text-rose-400 font-bold">$1</span>');
  }
  
  if (lang === 'css') {
    return escaped
      // Comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 font-medium italic">$1</span>')
      // Selectors & curly braces
      .replace(/([a-zA-Z0-9_.-]+)\s*\{/g, '<span class="text-rose-400 font-bold">$1</span> {')
      // Property names: property:
      .replace(/([a-zA-Z0-9_-]+)\s*:/g, '<span class="text-sky-400">$1</span>:')
      // Property values: : value;
      .replace(/:\s*([^;]+);/g, ': <span class="text-emerald-400 font-medium">$1</span>;');
  }

  // JS, TS, Python and other programming languages
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'default',
    'class', 'extends', 'async', 'await', 'try', 'catch', 'finally', 'new',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'from', 'as', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined',
    'true', 'false', 'def', 'elif', 'print'
  ];
  
  keywords.sort((a, b) => b.length - a.length);
  
  let highlighted = escaped;
  
  // Temporarily store strings to avoid matching keywords inside them
  const stringMap = [];
  highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1|`[\s\S]*?`/g, (match) => {
    const id = `___STR_${stringMap.length}___`;
    stringMap.push(match);
    return id;
  });
  
  // Temporarily store comments
  const commentMap = [];
  highlighted = highlighted.replace(/(\/\/.*$|#.*$)/gm, (match) => {
    const id = `___COMMENT_${commentMap.length}___`;
    commentMap.push(match);
    return id;
  });

  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
    const id = `___COMMENT_${commentMap.length}___`;
    commentMap.push(match);
    return id;
  });
  
  // Highlight Keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-[#f472b6] font-bold">${keyword}</span>`);
  });
  
  // Highlight Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-[#fb923c] font-black">$1</span>');
  
  // Highlight Function calls
  highlighted = highlighted.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="text-[#38bdf8] font-semibold">$1</span>');
  
  // Highlight system globals
  highlighted = highlighted.replace(/\b(console|window|document|process|globalThis)\b/g, '<span class="text-[#2dd4bf] font-black">$1</span>');
  
  // Restore Strings
  stringMap.forEach((str, idx) => {
    const styledStr = `<span class="text-[#a7f3d0] font-medium">${str}</span>`;
    highlighted = highlighted.replace(new RegExp(`___STR_${idx}___`, 'g'), styledStr);
  });
  
  // Restore Comments
  commentMap.forEach((comment, idx) => {
    const styledComment = `<span class="text-slate-500 font-medium italic">${comment}</span>`;
    highlighted = highlighted.replace(new RegExp(`___COMMENT_${idx}___`, 'g'), styledComment);
  });
  
  return highlighted;
};

/**
 * Individual CodeBlock component with Copy feature and macOS styling
 */
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageLabel = (lang) => {
    if (!lang) return 'Code';
    const l = lang.toLowerCase();
    if (l === 'javascript' || l === 'js') return 'JavaScript';
    if (l === 'typescript' || l === 'ts') return 'TypeScript';
    if (l === 'html') return 'HTML';
    if (l === 'css') return 'CSS';
    if (l === 'python' || l === 'py') return 'Python';
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const highlightedHtml = highlightCode(code, language);

  return (
    <div className="border-4 border-on-surface rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-6">
      {/* Top Header/Window Control Bar */}
      <div className="bg-[#1e1e2e] border-b-4 border-on-surface px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
          <span className="text-slate-400 font-mono text-xs font-bold ml-2">
            {getLanguageLabel(language)}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border-2 border-transparent hover:border-white/30 rounded-lg text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer"
        >
          <Icon name={copied ? 'check' : 'content_copy'} className={`w-3.5 h-3.5 ${copied ? 'text-green-400' : ''}`} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code Container */}
      <div className="bg-[#0f172a] p-5 overflow-x-auto font-mono text-sm leading-relaxed text-slate-100 custom-scrollbar">
        <pre className="m-0">
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml || code }} />
        </pre>
      </div>
    </div>
  );
};

/**
 * Renders inline styles like bold (**), italic (*), and inline code (`)
 */
const parseInlineStyles = (text) => {
  if (!text) return '';
  
  const inlineCodeRegex = /(`[^`\n]+`)/g;
  const parts = text.split(inlineCodeRegex);
  
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={`code-${index}`} 
          className="font-mono text-sm px-1.5 py-0.5 rounded bg-surface-container-high border border-on-surface/15 text-rose-600 dark:text-rose-400 font-black"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    
    const boldItalicRegex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const subParts = part.split(boldItalicRegex);
    
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={`bold-${index}-${subIndex}`} className="font-black text-on-surface">
            {subPart.slice(2, -2)}
          </strong>
        );
      }
      if (subPart.startsWith('*') && subPart.endsWith('*')) {
        return (
          <em key={`italic-${index}-${subIndex}`} className="italic font-bold text-on-surface-variant">
            {subPart.slice(1, -1)}
          </em>
        );
      }
      return subPart;
    });
  });
};

/**
 * Parses and returns formatted block structures
 */
const parseMaterialContent = (content) => {
  if (!content) return [];
  
  const lines = content.split('\n');
  const elements = [];
  
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (inCodeBlock) {
      if (line.trim().startsWith('```')) {
        elements.push({
          type: 'code_block',
          language: codeLang,
          content: codeLines.join('\n')
        });
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      } else {
        codeLines.push(line);
      }
      continue;
    }
    
    if (line.trim().startsWith('```')) {
      inCodeBlock = true;
      codeLang = line.trim().replace('```', '').trim().toLowerCase();
      continue;
    }
    
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push({ type: 'empty_line' });
      continue;
    }
    
    if (trimmed.startsWith('#### ')) {
      elements.push({ type: 'h4', text: trimmed.replace(/^####\s+/, '') });
    } else if (trimmed.startsWith('### ')) {
      elements.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
    } else if (trimmed.startsWith('## ')) {
      elements.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
    } else if (trimmed.startsWith('# ')) {
      elements.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
    } else if (trimmed.startsWith('•') || (trimmed.startsWith('*') && !trimmed.startsWith('**')) || trimmed.startsWith('-')) {
      const match = line.match(/^(\s*)([•*\-])\s*(.*)/);
      const indent = match ? match[1].length : 0;
      const cleanText = match ? match[3] : trimmed.replace(/^[•*\-]\s*/, '');
      elements.push({ type: 'bullet', text: cleanText, indent });
    } else {
      const numMatch = line.match(/^(\s*)(\d+)[.)]\s*(.*)/);
      if (numMatch) {
        const indent = numMatch[1].length;
        const num = numMatch[2];
        const cleanText = numMatch[3];
        elements.push({ type: 'numbered', num, text: cleanText, indent });
      } else {
        elements.push({ type: 'paragraph', text: line });
      }
    }
  }
  
  if (inCodeBlock && codeLines.length > 0) {
    elements.push({
      type: 'code_block',
      language: codeLang,
      content: codeLines.join('\n')
    });
  }
  
  return elements;
};

/**
 * Premium Material Renderer Component supporting neobrutalist UI
 */
const RichMaterialRenderer = ({ content }) => {
  if (!content) {
    return <p className="italic text-on-surface-variant/70">Tidak ada materi tersedia.</p>;
  }

  const elements = parseMaterialContent(content);

  // Group elements where needed (e.g. list groups for proper spacing)
  return (
    <div className="space-y-4 text-on-surface text-lg leading-relaxed select-text font-body-md">
      {elements.map((el, idx) => {
        switch (el.type) {
          case 'h1':
            return (
              <h2 key={idx} className="text-3xl font-black text-on-surface border-b-4 border-on-surface pb-3 pt-6 mt-8 mb-4">
                {parseInlineStyles(el.text)}
              </h2>
            );
          case 'h2':
            return (
              <h3 key={idx} className="text-2xl font-black text-on-surface pt-5 mt-6 mb-3">
                {parseInlineStyles(el.text)}
              </h3>
            );
          case 'h3':
            return (
              <h4 key={idx} className="text-xl font-black text-on-surface pt-4 mt-5 mb-2">
                {parseInlineStyles(el.text)}
              </h4>
            );
          case 'h4':
            return (
              <h5 key={idx} className="text-lg font-black text-on-surface pt-3 mt-4 mb-2">
                {parseInlineStyles(el.text)}
              </h5>
            );
          case 'bullet':
            return (
              <div 
                key={idx} 
                className="flex gap-3 items-start pl-2"
                style={{ marginLeft: `${Math.max(0, el.indent * 8)}px` }}
              >
                <span className="text-primary font-black mt-1 text-base select-none">•</span>
                <span className="flex-1 text-on-surface-variant font-medium">
                  {parseInlineStyles(el.text)}
                </span>
              </div>
            );
          case 'numbered':
            return (
              <div 
                key={idx} 
                className="flex gap-3 items-start pl-2"
                style={{ marginLeft: `${Math.max(0, el.indent * 8)}px` }}
              >
                <span className="text-primary font-black min-w-[20px] text-right text-base select-none">
                  {el.num}.
                </span>
                <span className="flex-1 text-on-surface-variant font-medium">
                  {parseInlineStyles(el.text)}
                </span>
              </div>
            );
          case 'code_block':
            return (
              <CodeBlock 
                key={idx} 
                code={el.content} 
                language={el.language} 
              />
            );
          case 'empty_line':
            return <div key={idx} className="h-3" />;
          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-on-surface-variant font-medium leading-relaxed my-3">
                {parseInlineStyles(el.text)}
              </p>
            );
        }
      })}
    </div>
  );
};

export default RichMaterialRenderer;
