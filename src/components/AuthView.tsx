import { useState } from 'react';
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthViewProps {
  onSuccess: () => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-dark p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Heart
            key={i}
            className="absolute text-primary/30 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
            }}
            size={20 + (i % 3) * 8}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 gradient-primary rounded-3xl shadow-glow mb-6 animate-glow">
            <Heart className="w-10 h-10 text-primary-foreground fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">
            Amantes<span className="text-primary">.com</span>
          </h1>
          <p className="text-muted-foreground text-sm">Conexões que aquecem o coração 💕</p>
        </div>

        <div className="glass-dark rounded-3xl p-8 shadow-pink-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-2 mb-8">
            <Button
              variant={isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl transition-all ${isLogin ? 'gradient-primary shadow-glow' : 'text-muted-foreground hover:text-primary-foreground'}`}
              onClick={() => setIsLogin(true)}
            >
              Entrar
            </Button>
            <Button
              variant={!isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl transition-all ${!isLogin ? 'gradient-primary shadow-glow' : 'text-muted-foreground hover:text-primary-foreground'}`}
              onClick={() => setIsLogin(false)}
            >
              Criar Conta
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isLogin && (
              <button type="button" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </button>
            )}

            <Button
              type="submit"
              className="w-full h-14 gradient-primary rounded-xl text-lg font-semibold shadow-glow hover:shadow-pink-lg transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">ou continue com</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {['Google', 'Apple', 'Facebook'].map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="h-12 rounded-xl bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/50 transition-all"
                onClick={onSuccess}
              >
                <span className="text-xs font-medium text-foreground">{provider}</span>
              </Button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Ao continuar, você concorda com nossos{' '}
          <button className="text-primary hover:underline">Termos</button> e{' '}
          <button className="text-primary hover:underline">Privacidade</button>
        </p>
      </div>
    </div>
  );
}
