import { LucideIcon } from "lucide-react";

interface SocialIconProps {
  href: string;
  icon: LucideIcon;
  label: string;
  delay?: number;
}

const SocialIcon = ({ href, icon: Icon, label, delay = 0 }: SocialIconProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="social-icon animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
};

export default SocialIcon;
