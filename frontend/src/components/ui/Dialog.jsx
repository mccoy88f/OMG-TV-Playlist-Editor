// Dialog.jsx
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function Dialog({
 open,
 onClose,
 title,
 description,
 confirmLabel = 'Confirm',
 cancelLabel = 'Cancel',
 onConfirm,
 variant = 'destructive'
}) {
 return (
   <Modal
     isOpen={open}
     onClose={onClose}
     title={title}
     size="sm"
   >
     {description && (
       <p className="mb-4 text-sm text-gray-500">{description}</p>
     )}
     <div className="flex justify-end space-x-2">
       <Button variant="ghost" onClick={onClose}>
         {cancelLabel}
       </Button>
       <Button variant={variant} onClick={onConfirm}>
         {confirmLabel}
       </Button>
     </div>
   </Modal>
 );
}