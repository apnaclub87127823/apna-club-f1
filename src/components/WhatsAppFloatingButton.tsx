import { MessageCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

const WhatsAppFloatingButton = () => {
  const { profile } = useProfile();
  const { isAuthenticated } = useAuth();

  const handleWhatsAppClick = () => {
    const adminNumber = '917014079906'; // +91 70140 79906
    
    let message = 'Hello, I need assistance.';
    
    if (isAuthenticated && profile) {
      message = `Hello, my name is ${profile.fullName} and my mobile number is ${profile.mobileNumber}. I need assistance.`;
    }
    
    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-50"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default WhatsAppFloatingButton;
