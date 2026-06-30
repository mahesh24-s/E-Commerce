/**
 * components/dashboard/StatsCard.jsx
 */
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  trend,       // number (positive = up, negative = down, 0 = flat)
  trendLabel,  // e.g. "vs last month"
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend > 0
                ? "bg-emerald-50 text-emerald-600"
                : trend < 0
                ? "bg-red-50 text-red-600"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p
        className="text-2xl font-extrabold text-foreground"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {value}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {trendLabel && (
        <p className="text-xs text-muted-foreground/70 mt-0.5">{trendLabel}</p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
