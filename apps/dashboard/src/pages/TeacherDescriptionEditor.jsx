import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { showToast, showConfirm } from '../lib/toast';

const TeacherDescriptionEditor = () => {
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview' for mobile view

  useEffect(() => {
    const initialText = localStorage.getItem('temp_course_description') || '';
    setDescription(initialText);
  }, []);

  const handleSave = () => {
    localStorage.setItem('temp_course_description', description);
    showToast('Deskripsi berhasil disimpan! Menutup halaman...', 'success');
    setTimeout(() => {
      window.close();
    }, 800);
  };

  const handleCancel = async () => {
    if (await showConfirm('Apakah Anda yakin ingin membatalkan perubahan? Halaman ini akan ditutup.')) {
      window.close();
    }
  };

  const applyFormatting = (type) => {
    const textarea = document.getElementById('fullscreen-description');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    // Find the start index of the first line containing the selection
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }

    // Find the end index of the last line containing the selection
    let lineEnd = end;
    while (lineEnd < text.length && text[lineEnd] !== '\n') {
      lineEnd++;
    }

    const selectedLines = text.substring(lineStart, lineEnd);

    if (type === 'bold' || type === 'italic') {
      let textToInsert = '';
      let selectionOffsetStart = 0;
      let selectionOffsetEnd = 0;

      if (type === 'bold') {
        if (selectedText) {
          textToInsert = `**${selectedText}**`;
          selectionOffsetStart = 2;
          selectionOffsetEnd = 2 + selectedText.length;
        } else {
          textToInsert = '**Teks Tebal**';
          selectionOffsetStart = 2;
          selectionOffsetEnd = 12;
        }
      } else {
        if (selectedText) {
          textToInsert = `*${selectedText}*`;
          selectionOffsetStart = 1;
          selectionOffsetEnd = 1 + selectedText.length;
        } else {
          textToInsert = '*Teks Miring*';
          selectionOffsetStart = 1;
          selectionOffsetEnd = 12;
        }
      }

      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = before + textToInsert + after;
      setDescription(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd);
      }, 50);
      return;
    }

    // Block-level or Line-based operations
    let formatted = '';
    
    switch (type) {
      case 'heading': {
        const lines = selectedLines.split('\n');
        formatted = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) return line;
          const leadingSpaces = line.match(/^(\s*)/)[1];
          return `${leadingSpaces}### ${line.substring(leadingSpaces.length)}`;
        }).join('\n');
        break;
      }

      case 'bullet': {
        const lines = selectedLines.split('\n');
        formatted = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) return line;
          const leadingSpaces = line.match(/^(\s*)/)[1];
          return `${leadingSpaces}• ${line.substring(leadingSpaces.length)}`;
        }).join('\n');
        break;
      }

      case 'numbered': {
        const lines = selectedLines.split('\n');
        let startNum = 1;
        // Auto-increment only if single line and no text selection
        if (lines.length === 1 && !selectedText) {
          const linesBefore = text.substring(0, lineStart).split('\n');
          for (let i = linesBefore.length - 2; i >= 0; i--) {
            const match = linesBefore[i].trim().match(/^(\d+)[.)]/);
            if (match) {
              startNum = parseInt(match[1], 10) + 1;
              break;
            }
            if (linesBefore[i].trim() === '' && i < linesBefore.length - 2) {
              break;
            }
          }
        }
        
        let count = startNum;
        formatted = lines.map(line => {
          const leadingSpaces = line.match(/^(\s*)/)[1];
          const cleanContent = line.substring(leadingSpaces.length).replace(/^\d+[.)]\s*/, '');
          const formattedLine = `${leadingSpaces}${count}. ${cleanContent}`;
          count++;
          return formattedLine;
        }).join('\n');
        break;
      }

      case 'indent': {
        const lines = selectedLines.split('\n');
        formatted = lines.map(line => `  ${line}`).join('\n');
        break;
      }

      case 'outdent': {
        const lines = selectedLines.split('\n');
        formatted = lines.map(line => {
          if (line.startsWith('  ')) return line.substring(2);
          if (line.startsWith(' ')) return line.substring(1);
          return line;
        }).join('\n');
        break;
      }

      default:
        return;
    }

    const before = text.substring(0, lineStart);
    const after = text.substring(lineEnd);
    const newValue = before + formatted + after;
    setDescription(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + formatted.length);
    }, 50);
  };

  const convertHtmlToMarkdown = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    const walk = (node) => {
      let result = '';
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        let childrenText = '';
        for (let i = 0; i < node.childNodes.length; i++) {
          childrenText += walk(node.childNodes[i]);
        }
        
        switch (tagName) {
          case 'strong':
          case 'b':
            return `**${childrenText}**`;
          case 'em':
          case 'i':
            return `*${childrenText}*`;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return `\n### ${childrenText.trim()}\n`;
          case 'li': {
            const parentTag = node.parentNode ? node.parentNode.tagName.toLowerCase() : 'ul';
            const cleanContent = childrenText.trim();
            if (parentTag === 'ol') {
              const siblings = Array.from(node.parentNode.children);
              const index = siblings.indexOf(node) + 1;
              return `\n${index}. ${cleanContent}\n`;
            } else {
              return `\n• ${cleanContent}\n`;
            }
          }
          case 'ul':
          case 'ol':
            return `\n${childrenText.trim()}\n`;
          case 'p':
          case 'div':
            return `\n${childrenText.trim()}\n`;
          case 'br':
            return '\n';
          default:
            return childrenText;
        }
      }
      return result;
    };
    
    let markdown = walk(doc.body);
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([•*]|\d+\.)\s*\n+/g, '$1 ')
      .trim();
    return markdown;
  };

  const handlePaste = (e) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const markdown = convertHtmlToMarkdown(html);
      if (markdown) {
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        const newValue = before + markdown + after;
        setDescription(newValue);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + markdown.length, start + markdown.length);
        }, 50);
      }
    }
  };


  const parsePreviewInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-on-surface">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderPreview = (desc) => {
    if (!desc) return <p className="italic text-on-surface-variant/70 text-sm">Belum ada konten deskripsi...</p>;
    const lines = desc.split('\n');
    return (
      <div className="space-y-3 font-sans text-on-surface">
        {lines.map((line, idx) => {
          const leadingSpacesMatch = line.match(/^(\s*)/);
          const spaceCount = leadingSpacesMatch ? leadingSpacesMatch[1].length : 0;
          const indentLevel = Math.floor(spaceCount / 2); // 2 spaces per indent level
          
          let trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-2" />;
          
          const indentStyle = { paddingLeft: `${indentLevel * 1.5 + 0.5}rem` };

          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} style={indentStyle} className="text-base font-black text-on-surface mt-4 mb-2">
                {trimmed.replace('###', '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} style={indentStyle} className="text-lg font-black text-on-surface mt-4 mb-2">
                {trimmed.replace('##', '').trim()}
              </h3>
            );
          }
          if (trimmed.startsWith('•') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const cleanText = trimmed.replace(/^(•|\*\s+|\-\s+)/, '');
            return (
              <div key={idx} style={indentStyle} className="flex gap-2 items-start">
                <span className="text-primary font-black mt-0.5">•</span>
                <span className="flex-1 text-sm">{parsePreviewInline(cleanText)}</span>
              </div>
            );
          }
          const numMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const cleanText = numMatch[2];
            return (
              <div key={idx} style={indentStyle} className="flex gap-2 items-start">
                <span className="text-primary font-black min-w-[16px] text-right">{num}.</span>
                <span className="flex-1 text-sm">{parsePreviewInline(cleanText)}</span>
              </div>
            );
          }
          return (
            <p key={idx} style={indentStyle} className="leading-relaxed text-sm">
              {parsePreviewInline(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-background text-on-surface font-sans antialiased min-h-screen flex flex-col h-screen overflow-hidden">
      {/* Top Header Navigation */}
      <header className="bg-surface border-b-4 border-on-surface px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <span className="material-symbols-outlined text-on-primary-container font-black">edit_note</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-on-surface">Editor Deskripsi Kursus (Fullscreen)</h1>
            <p className="text-xs text-on-surface-variant font-bold">Hasil ketikan akan otomatis disinkronkan ke halaman utama.</p>
          </div>
        </div>

        {/* Mobile Tab Toggle */}
        <div className="flex md:hidden border-2 border-on-surface rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-1.5 text-xs font-black transition-colors ${activeTab === 'write' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'}`}
          >
            Tulis
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 text-xs font-black transition-colors ${activeTab === 'preview' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'}`}
          >
            Pratinjau
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 rounded-xl border-2 border-on-surface font-black text-xs hover:bg-surface-variant active:translate-y-0.5 active:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl border-2 border-on-surface font-black text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm font-black">check</span>
            Simpan & Terapkan
          </button>
        </div>
      </header>

      {/* Main Workspace (Split Screen) */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row bg-surface">
        {/* Editor (Left Pane) */}
        <div className={`flex-1 flex flex-col p-6 gap-4 border-r-0 md:border-r-4 border-on-surface h-full ${activeTab === 'write' ? 'flex' : 'hidden md:flex'}`}>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center bg-surface-variant/20 p-2.5 border-2 border-on-surface rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mr-2 pl-1 border-r border-on-surface/20 pr-3">Alat</span>
            <button
              type="button"
              onClick={() => applyFormatting('bold')}
              className="w-10 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('italic')}
              className="w-10 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all italic"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('heading')}
              className="px-3 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('bullet')}
              className="px-3 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all gap-1"
              title="Bullet List"
            >
              • Poin
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('numbered')}
              className="px-3 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all gap-1"
              title="Numbered List"
            >
              1. Poin
            </button>
            <div className="h-6 w-0.5 bg-on-surface/20 mx-1"></div>
            <button
              type="button"
              onClick={() => applyFormatting('indent')}
              className="px-3 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all gap-1"
              title="Geser Kanan (Indent)"
            >
              ➔ Indent
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('outdent')}
              className="px-3 h-8 flex items-center justify-center text-xs font-black border-2 border-on-surface rounded-xl bg-white hover:bg-surface-variant/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all gap-1"
              title="Geser Kiri (Outdent)"
            >
              ⬅ Outdent
            </button>
          </div>

          <textarea
            id="fullscreen-description"
            className="flex-1 w-full p-6 border-4 border-on-surface rounded-3xl bg-white font-mono text-sm leading-relaxed focus:outline-none focus:bg-primary-container/5 resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            placeholder="Tulis deskripsi kursus yang lengkap di sini. Gunakan pemformatan di atas untuk mempercantik poin dan subjudul..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handlePaste}
          />
        </div>

        {/* Live Preview (Right Pane) */}
        <div className={`flex-1 bg-surface-variant/10 p-6 flex flex-col gap-4 overflow-hidden h-full ${activeTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Pratinjau Tampilan Siswa (Live)</h4>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sinkron Aktif
            </span>
          </div>

          <div className="flex-1 bg-white border-4 border-on-surface rounded-3xl p-6 overflow-y-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-full">
            <h2 className="text-xl font-black mb-4 pb-4 border-b-2 border-on-background/10">Tentang Kursus Ini</h2>
            {renderPreview(description)}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDescriptionEditor;
