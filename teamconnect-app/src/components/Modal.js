import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';
import { useLanguage } from '../i18n/LanguageContext'; 

function Modal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            {cancelText || 'Odustani'}
          </button>
          <button className="btn btn-confirm" onClick={onConfirm}>
            {confirmText || 'Potvrdi'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
