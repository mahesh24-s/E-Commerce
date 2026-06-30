/**
 * components/dashboard/EmptyState.jsx
 */
import { motion } from "framer-motion";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="text-5xl mb-4">{icon ?? "📭"}</div>
      <h3
        className="text-lg font-bold text-foreground mb-2"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}
