import { useState } from 'react';
import { Heart, Camera, ChevronRight, Sparkles, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OnboardingViewProps {
  onComplete: () => void;
}

const INTERESTS = ['💕 Relacionamento', '🔥 Encontros', '💬 Amizade', '📸 Fotos', '🎥 Vídeos', '💃 Dança', '🎵 Música', '✈️ Viagens', '🍷 Jantar', '🏋️ Fitness', '🎨 Arte', '📚 Cultura'];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete();
  };

  const canProceed = () => {
    if (step === 1) return name.length >= 2;
    if (step === 2) return true;
    if (step === 3) return selectedInterests.length >= 3;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col gradient-dark p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'gradient-primary' : 'bg-secondary/50'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-up">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">Vamos começar! 💕</h1>
              <p className="text-muted-foreground">Conte um pouco sobre você</p>
            </div>
            <div className="flex justify-center mb-8">
              <button className="relative group">
                <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <Camera className="w-5 h-5 text-primary-foreground" />
                </div>
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="pl-12 h-14 bg-secondary/30 border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Idade" value={age} onChange={(e) => setAge(e.target.value)} className="h-14 bg-secondary/30 border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground text-center" />
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Cidade" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-12 h-14 bg-secondary/30 border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-up">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">Suas melhores fotos 📸</h1>
              <p className="text-muted-foreground">Adicione fotos que mostram o melhor de você</p>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1">
              {[...Array(6)].map((_, i) => (
                <button key={i} className={`aspect-[3/4] rounded-2xl border-2 border-dashed transition-all flex items-center justify-center ${i === 0 ? 'border-primary bg-primary/10 hover:bg-primary/20' : 'border-border/30 bg-secondary/20 hover:border-primary/50'}`}>
                  {i === 0 ? (<div className="text-center"><Camera className="w-8 h-8 text-primary mx-auto mb-2" /><span className="text-xs text-primary font-medium">Principal</span></div>) : (<span className="text-2xl text-muted-foreground">+</span>)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-up">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">O que te interessa? ✨</h1>
              <p className="text-muted-foreground">Selecione pelo menos 3 interesses</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${selectedInterests.includes(interest) ? 'gradient-primary text-primary-foreground shadow-pink-sm' : 'bg-secondary/30 text-foreground hover:bg-secondary/50'}`}>
                  {interest}
                </button>
              ))}
            </div>
            {selectedInterests.length > 0 && <p className="mt-4 text-sm text-muted-foreground">{selectedInterests.length} selecionado{selectedInterests.length > 1 ? 's' : ''}</p>}
          </div>
        )}

        <div className="mt-8 pb-4">
          <Button onClick={handleNext} disabled={!canProceed()} className="w-full h-14 gradient-primary rounded-xl text-lg font-semibold shadow-glow hover:shadow-pink-lg transition-all active:scale-[0.98] disabled:opacity-50">
            {step === 3 ? (<><Sparkles className="w-5 h-5 mr-2" />Começar</>) : (<>Continuar<ChevronRight className="w-5 h-5 ml-2" /></>)}
          </Button>
          {step > 1 && <button onClick={() => setStep(step - 1)} className="w-full mt-4 text-muted-foreground hover:text-foreground transition-colors">Voltar</button>}
        </div>
      </div>
    </div>
  );
}
