import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Sparkles, Loader2, Trash2, Plus, ChevronDown, ChevronUp,
  Target, CheckSquare, Repeat, Wallet, User, Bell, Rocket,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIdeas, Idea, IdeaAction, IdeaActionType } from '@/hooks/useIdeas';
import { cn } from '@/lib/utils';

const ACTION_META: Record<IdeaActionType, { icon: typeof Target; label: string }> = {
  goal: { icon: Target, label: 'Цель' },
  task: { icon: CheckSquare, label: 'Задача' },
  habit: { icon: Repeat, label: 'Привычка' },
  finance: { icon: Wallet, label: 'Финансы' },
  contact: { icon: User, label: 'Контакт' },
  note: { icon: Lightbulb, label: 'Заметка' },
};

function scoreTone(score: number) {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-primary';
  return 'text-destructive';
}

interface IdeaCardProps {
  idea: Idea;
  analyzingId: string | null;
  onAnalyze: (idea: Idea) => void;
  onApply: (id: string, actions: IdeaAction[]) => Promise<boolean>;
  onDelete: (id: string) => void;
  onFollowup: (id: string, days: number) => void;
}

function IdeaCard({ idea, analyzingId, onAnalyze, onApply, onDelete, onFollowup }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [applying, setApplying] = useState(false);

  const analysis = idea.analysis_result;
  const isAnalyzing = analyzingId === idea.id;
  const actions = analysis?.suggested_actions || [];

  const toggle = (i: number) => setSelected((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleApply = async () => {
    const chosen: IdeaAction[] = actions.filter((_, i) => selected[i] !== false);
    setApplying(true);
    await onApply(idea.id, chosen);
    setApplying(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{idea.title}</h3>
            {idea.status === 'approved' && (
              <Badge variant="secondary" className="text-[10px]">Применена</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{idea.raw_text}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(idea.id)}>
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {analysis && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Реалистичность</span>
            <span className={cn('font-semibold', scoreTone(analysis.realism_score))}>
              {analysis.realism_score}%
            </span>
          </div>
          <Progress value={analysis.realism_score} className="h-2" />
          {analysis.summary && (
            <p className="text-xs text-muted-foreground">{analysis.summary}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!analysis ? (
          <Button size="sm" onClick={() => onAnalyze(idea)} disabled={isAnalyzing} className="gap-1.5">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Оценить идею
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)} className="gap-1.5">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Декомпозиция ({actions.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAnalyze(idea)} disabled={isAnalyzing} className="gap-1.5">
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Пересчитать
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onFollowup(idea.id, 7)} className="gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Напомнить
            </Button>
          </>
        )}
      </div>

      <AnimatePresence>
        {expanded && analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            {(analysis.pros?.length || analysis.risks?.length) && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  {(analysis.pros || []).map((p, i) => (
                    <p key={i} className="text-success">+ {p}</p>
                  ))}
                </div>
                <div className="space-y-1">
                  {(analysis.risks || []).map((r, i) => (
                    <p key={i} className="text-destructive">− {r}</p>
                  ))}
                </div>
              </div>
            )}

            {analysis.first_step && (
              <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
                <span className="text-muted-foreground">Первый шаг: </span>
                {analysis.first_step}
              </div>
            )}

            <div className="space-y-2">
              {actions.map((action, i) => {
                const meta = ACTION_META[action.type] || ACTION_META.note;
                const Icon = meta.icon;
                const checked = selected[i] !== false;
                return (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                    <Checkbox checked={checked} onCheckedChange={() => toggle(i)} className="mt-0.5" />
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{action.title}</span>
                        <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      </div>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button size="sm" className="w-full gap-1.5" onClick={handleApply} disabled={applying}>
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              Применить в план
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function IdeasBoard() {
  const { ideas, loading, createIdea, analyzeIdea, applyIdea, deleteIdea, scheduleFollowup, analyzingId } = useIdeas();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const created = await createIdea(title.trim(), text.trim() || title.trim());
    setSaving(false);
    if (created) {
      setTitle('');
      setText('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Новая идея</h2>
        </div>
        <Input
          placeholder="Название идеи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Опишите идею: что, зачем, какой результат хотите получить"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <Button onClick={handleCreate} disabled={!title.trim() || saving} className="w-full gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Сохранить идею
        </Button>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Пока нет идей. Запишите первую — оценим реалистичность и разложим на цели, задачи и привычки.
          </p>
        </Card>
      ) : (
        ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            analyzingId={analyzingId}
            onAnalyze={analyzeIdea}
            onApply={applyIdea}
            onDelete={deleteIdea}
            onFollowup={scheduleFollowup}
          />
        ))
      )}
    </div>
  );
}
