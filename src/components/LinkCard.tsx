import { ExternalLink, LucideIcon } from "lucide-react";

interface LinkCardProps {
  title: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  featured?: boolean;
  delay?: number;
}

const LinkCard = ({ title, description, href, icon: Icon, featured, delay = 0 }: LinkCardProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-card group flex items-center gap-4 animate-fade-up ${featured ? 'border-primary/30' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {Icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${featured ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground group-hover:text-primary'} transition-colors`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </a>
  );
};

export default LinkCard;
