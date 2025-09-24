import { useState } from 'react';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  title: string;
  instructions: string;
}

export const BulkAddModal = ({ isOpen, onClose, onSave, title, instructions }: BulkAddModalProps) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    setText("");
    onClose();
  };

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-header">
          <h3 className="confirmation-dialog-title">{title}</h3>
          <button onClick={onClose} className="confirmation-dialog-close">&times;</button>
        </div>
        <div className="confirmation-dialog-content">
          <p className="confirmation-dialog-message">{instructions}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
            placeholder="Dán dữ liệu của bạn ở đây..."
          />
        </div>
        <div className="confirmation-dialog-actions">
          <button className="ghost-button" onClick={onClose}>Hủy</button>
          <button className="primary-button" onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
};