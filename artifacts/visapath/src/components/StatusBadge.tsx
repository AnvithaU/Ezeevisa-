import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  approved: <CheckCircle2 className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
  under_review: <Clock className="w-3.5 h-3.5" />,
  submitted: <Send className="w-3.5 h-3.5" />,
  draft: <FileText className="w-3.5 h-3.5" />,
};

export default function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        getStatusColor(status),
        className
      )}
    >
      {showIcon && statusIcons[status]}
      {getStatusLabel(status)}
    </motion.span>
  );
}
