import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type IdeaActionType = 'goal' | 'task' | 'habit' | 'finance' | 'contact' | 'note';

export interface IdeaAction {
  type: IdeaActionType;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  amount?: string;
  tx_type?: 'income' | 'expense';
}

export interface IdeaAnalysis {
  realism_score: number; // 0-100
  summary?: string;
  pros?: string[];
  risks?: string[];
  first_step?: string;
  suggested_actions: IdeaAction[];
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_text: string;
  status: string;
  analysis_result: IdeaAnalysis | null;
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    if (!user) {
      setIdeas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ideas:', error);
    } else {
      setIdeas((data || []) as unknown as Idea[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const createIdea = useCallback(
    async (title: string, rawText: string): Promise<Idea | null> => {
      if (!user) {
        toast.error('Войдите, чтобы сохранять идеи');
        return null;
      }
      const { data, error } = await supabase
        .from('ideas')
        .insert({ user_id: user.id, title, raw_text: rawText, description: rawText })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating idea:', error);
        toast.error('Не удалось сохранить идею');
        return null;
      }
      const idea = data as unknown as Idea;
      setIdeas((prev) => [idea, ...prev]);
      toast.success('Идея сохранена');
      return idea;
    },
    [user]
  );

  const deleteIdea = useCallback(async (id: string) => {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) {
      toast.error('Не удалось удалить идею');
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast.success('Идея удалена');
  }, []);

  const analyzeIdea = useCallback(async (idea: Idea): Promise<IdeaAnalysis | null> => {
    setAnalyzingId(idea.id);
    try {
      const prompt = `Ты — коуч по продуктивности. Оцени идею пользователя и разложи её на конкретные шаги.
Идея: "${idea.title}"
Описание: "${idea.raw_text}"

Ответь СТРОГО валидным JSON без markdown:
{
  "realism_score": число 0-100 (реалистичность идеи),
  "summary": "краткая оценка на русском, 1-2 предложения",
  "pros": ["сильная сторона", "..."],
  "risks": ["риск", "..."],
  "first_step": "первый конкретный шаг",
  "suggested_actions": [
    {"type": "goal|task|habit|finance|contact", "title": "название", "description": "детали", "priority": "low|medium|high"}
  ]
}
Сделай 3-6 действий: минимум одна цель, несколько задач и при уместности привычка.`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        },
      });

      if (error) throw error;

      const content: string = data?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI response parse error');
      const analysis = JSON.parse(jsonMatch[0]) as IdeaAnalysis;
      analysis.suggested_actions = (analysis.suggested_actions || []).filter((a) => a?.type && a?.title);

      const { error: updErr } = await supabase
        .from('ideas')
        .update({ analysis_result: analysis as any, status: 'analyzed' })
        .eq('id', idea.id);
      if (updErr) throw updErr;

      setIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, analysis_result: analysis, status: 'analyzed' } : i))
      );
      toast.success('Идея проанализирована');
      return analysis;
    } catch (err) {
      console.error('Error analyzing idea:', err);
      toast.error('Не удалось проанализировать идею');
      return null;
    } finally {
      setAnalyzingId(null);
    }
  }, []);

  const applyIdea = useCallback(
    async (ideaId: string, actions: IdeaAction[]): Promise<boolean> => {
      if (!actions.length) {
        toast.error('Выберите хотя бы один пункт');
        return false;
      }
      const { error } = await supabase.rpc('apply_idea_flow_custom', {
        p_idea_id: ideaId,
        p_actions: actions as any,
      });
      if (error) {
        console.error('Error applying idea:', error);
        toast.error('Не удалось применить идею');
        return false;
      }
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === ideaId
            ? { ...i, status: 'approved', applied_at: new Date().toISOString() }
            : i
        )
      );
      window.dispatchEvent(new Event('habitflow-data-changed'));
      toast.success('Идея превращена в план');
      return true;
    },
    []
  );

  const scheduleFollowup = useCallback(async (ideaId: string, days: number, message?: string) => {
    const { error } = await supabase.rpc('schedule_idea_followup', {
      p_idea_id: ideaId,
      p_days_from_now: days,
      p_message: message,
    });
    if (error) {
      toast.error('Не удалось запланировать напоминание');
      return false;
    }
    toast.success(`Напомним через ${days} дн.`);
    return true;
  }, []);

  return {
    ideas,
    loading,
    analyzingId,
    createIdea,
    deleteIdea,
    analyzeIdea,
    applyIdea,
    scheduleFollowup,
    refetch: fetchIdeas,
  };
}
