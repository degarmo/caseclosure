// RichTextEditor.jsx
// A complete TipTap editor component with toolbar and customization options

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import './RichTextEditor.css';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Quote
} from 'lucide-react';

// Toolbar Button Component
const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}
    `}
  >
    {children}
  </button>
);

// Toolbar Separator
const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-300 mx-1" />
);

// Main Rich Text Editor Component
const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  maxLength = null,
  minHeight = '200px',
  showToolbar = true,
  editable = true,
  className = ''
}) => {
  // Initialize the editor with proper extension configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        // Disable any extensions we're adding separately to avoid conflicts
        dropcursor: {
          color: '#DBEAFE',
          width: 4,
        },
        gapcursor: false,
      }),
      // Add Underline as a separate extension
      Underline,
      // Add Link as a separate extension  
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800'
        },
        validate: href => /^https?:\/\//.test(href),
      }),
      // Add TextAlign
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      // Add Placeholder
      Placeholder.configure({
        placeholder
      }),
      // Conditionally add CharacterCount
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : [])
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onCreate: ({ editor }) => {
      // Set initial content if provided
      if (content && content !== '<p></p>') {
        editor.commands.setContent(content);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  // Handle link addition
  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Add https:// if no protocol specified
    const finalUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  };

  if (!editor) {
    return (
      <div className={`border border-gray-300 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-sm">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="border-b border-gray-300 bg-gray-50 p-2 flex items-center flex-wrap gap-1">
          {/* Text Style Group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Heading Group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Normal Text"
          >
            <Type className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* List Group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Alignment Group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Link */}
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Undo/Redo Group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}
      
      {/* Editor Content Area */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className={`prose prose-sm max-w-none focus:outline-none`}
          style={{ minHeight, padding: '16px', cursor: 'text' }}
          onClick={() => {
            // Focus the editor when clicking anywhere in the content area
            if (editor && !editor.isFocused) {
              editor.chain().focus('start').run();
            }
          }}
        />
        
        {/* Character Count */}
        {maxLength && editor.storage.characterCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {editor.storage.characterCount.characters()}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified version without toolbar for inline editing
export const SimpleRichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Enter text...', 
  className = '' 
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onCreate: ({ editor }) => {
      if (content && content !== '<p></p>') {
        editor.commands.setContent(content);
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      <EditorContent 
        editor={editor} 
        className="p-2 focus:outline-none min-h-[80px]"
      />
    </div>
  );
};

export default RichTextEditor;