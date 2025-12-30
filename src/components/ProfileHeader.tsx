interface ProfileHeaderProps {
  name: string;
  bio: string;
  avatarUrl: string;
}

const ProfileHeader = ({ name, bio, avatarUrl }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-6 animate-fade-up">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
        <img
          src={avatarUrl}
          alt={name}
          className="relative h-32 w-32 rounded-full object-cover border-2 border-primary/30 avatar-glow"
        />
      </div>
      
      <h1 
        className="font-display text-3xl font-semibold text-foreground mb-2 glow-text animate-fade-up"
        style={{ animationDelay: '100ms' }}
      >
        {name}
      </h1>
      
      <p 
        className="text-muted-foreground max-w-xs leading-relaxed animate-fade-up"
        style={{ animationDelay: '200ms' }}
      >
        {bio}
      </p>
    </div>
  );
};

export default ProfileHeader;
