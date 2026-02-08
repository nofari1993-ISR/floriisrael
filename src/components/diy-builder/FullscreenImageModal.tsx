import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullscreenImageModalProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const FullscreenImageModal = ({ imageUrl, isOpen, onClose }: FullscreenImageModalProps) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={imageUrl}
            alt="הזר שלכם"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenImageModal;
