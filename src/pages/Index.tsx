import ProfileHeader from "@/components/ProfileHeader";
import LinkCard from "@/components/LinkCard";
import SocialIcon from "@/components/SocialIcon";
import avatarImage from "@/assets/avatar.jpg";
import { 
  Heart, 
  Camera, 
  MessageCircle, 
  Flame, 
  Gift,
  Instagram,
  Twitter,
  Youtube,
  Send
} from "lucide-react";

const Index = () => {
  const links = [
    {
      title: "Conteúdo Exclusivo",
      description: "Acesse meus conteúdos premium",
      href: "#",
      icon: Flame,
      featured: true,
    },
    {
      title: "Ensaios Fotográficos",
      description: "Veja meus melhores trabalhos",
      href: "#",
      icon: Camera,
    },
    {
      title: "Fale Comigo",
      description: "Chat privado e personalizado",
      href: "#",
      icon: MessageCircle,
    },
    {
      title: "Lista de Desejos",
      description: "Me presenteie",
      href: "#",
      icon: Gift,
    },
    {
      title: "Apoie Meu Trabalho",
      description: "Contribua para novos conteúdos",
      href: "#",
      icon: Heart,
    },
  ];

  const socials = [
    { href: "#", icon: Instagram, label: "Instagram" },
    { href: "#", icon: Twitter, label: "Twitter" },
    { href: "#", icon: Youtube, label: "YouTube" },
    { href: "#", icon: Send, label: "Telegram" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(350 40% 10%) 0%, transparent 60%)',
        }}
      />
      
      <main className="relative z-10 flex flex-col items-center px-4 py-12 max-w-md mx-auto">
        {/* Profile Section */}
        <ProfileHeader
          name="Amante"
          bio="✨ Criadora de conteúdo exclusivo ✨ Seja bem-vindo ao meu universo"
          avatarUrl={avatarImage}
        />

        {/* Social Icons */}
        <div className="flex gap-3 mt-8 mb-10">
          {socials.map((social, index) => (
            <SocialIcon
              key={social.label}
              {...social}
              delay={300 + index * 100}
            />
          ))}
        </div>

        {/* Links Section */}
        <div className="w-full space-y-3">
          {links.map((link, index) => (
            <LinkCard
              key={link.title}
              {...link}
              delay={500 + index * 100}
            />
          ))}
        </div>

        {/* Footer */}
        <footer 
          className="mt-12 text-center animate-fade-in"
          style={{ animationDelay: '1200ms' }}
        >
          <p className="text-xs text-muted-foreground">
            Feito com{" "}
            <Heart className="inline h-3 w-3 text-primary fill-primary" />{" "}
            Amantes Link
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
