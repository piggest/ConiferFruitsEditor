import type { BlockNoteEditor } from '@blocknote/core';

type Props = { editor: BlockNoteEditor };

export default function Toolbar({ editor }: Props) {
  const toggleStyle = (style: 'bold' | 'italic' | 'underline') => {
    const current = editor.getActiveStyles();
    editor.addStyles({ [style]: !current[style] } as any);
    editor.focus();
  };

  const setHeading = (level: 1 | 2 | 3 | null) => {
    const block = editor.getTextCursorPosition().block;
    if (level === null) {
      editor.updateBlock(block, { type: 'paragraph' });
    } else {
      editor.updateBlock(block, { type: 'heading', props: { level } });
    }
    editor.focus();
  };

  const setList = (type: 'bulletListItem' | 'numberedListItem') => {
    const block = editor.getTextCursorPosition().block;
    editor.updateBlock(block, { type });
    editor.focus();
  };

  const btnStyle: React.CSSProperties = {
    padding: '4px 10px', marginRight: 4, border: '1px solid #ccc',
    background: '#fff', cursor: 'pointer', borderRadius: 3,
  };

  const divider = <span style={{ width: 1, height: 20, background: '#ccc', margin: '0 8px' }} />;

  return (
    <div style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ddd', background: '#f7f7f7', alignItems: 'center' }}>
      <button style={btnStyle} onClick={() => toggleStyle('bold')} title="太字 (Cmd+B)"><b>B</b></button>
      <button style={btnStyle} onClick={() => toggleStyle('italic')} title="斜体 (Cmd+I)"><i>I</i></button>
      <button style={btnStyle} onClick={() => toggleStyle('underline')} title="下線 (Cmd+U)"><u>U</u></button>
      {divider}
      <button style={btnStyle} onClick={() => setHeading(1)}>H1</button>
      <button style={btnStyle} onClick={() => setHeading(2)}>H2</button>
      <button style={btnStyle} onClick={() => setHeading(3)}>H3</button>
      <button style={btnStyle} onClick={() => setHeading(null)}>P</button>
      {divider}
      <button style={btnStyle} onClick={() => setList('bulletListItem')}>• List</button>
      <button style={btnStyle} onClick={() => setList('numberedListItem')}>1. List</button>
    </div>
  );
}
