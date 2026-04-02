import { motion } from 'framer-motion';

export default function Loader({ text = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <motion.div
        className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
