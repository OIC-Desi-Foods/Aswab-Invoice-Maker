
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300); // Wait for fade out animation to complete
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message, type, onDismiss]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(onDismiss, 300);
    }

    if (!message) return null;

    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-all duration-300 transform z-50";
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
    };
    const visibilityClasses = visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5';

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert" aria-live="assertive">
            <div className="flex items-center">
                <span className="flex-grow pr-4">{message}</span>
                <button onClick={handleDismiss} className="ml-4 font-bold opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">&times;</button>
            </div>
        </div>
    );
};

export default Toast;
