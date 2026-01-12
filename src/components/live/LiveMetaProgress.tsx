interface LiveMetaProgressProps {
  progress: number;
  goal: number;
}

export function LiveMetaProgress({ progress, goal }: LiveMetaProgressProps) {
  const progressPercent = (progress / goal) * 100;
  const isNearGoal = progressPercent >= 80;

  return (
    <div className={`bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/20 flex items-center gap-3 ${
      isNearGoal ? 'animate-pulse-glow' : ''
    }`}>
      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
        Meta
      </span>
      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-primary rounded-full transition-all duration-700 ease-out ${
            isNearGoal 
              ? 'bg-gradient-to-r from-primary via-primary-foreground/30 to-primary bg-[length:200%_100%] animate-shimmer' 
              : ''
          }`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>
      <span className={`text-[9px] font-semibold whitespace-nowrap ${
        isNearGoal ? 'text-primary animate-pulse' : 'text-primary'
      }`}>
        {progress.toLocaleString()}/{goal.toLocaleString()}
      </span>
    </div>
  );
}
