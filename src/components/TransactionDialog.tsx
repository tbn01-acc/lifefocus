import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FinanceTransaction, FINANCE_CATEGORIES } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'completed'>) => void;
  transaction?: FinanceTransaction | null;
}

export function TransactionDialog({ open, onClose, onSave, transaction }: TransactionDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(FINANCE_CATEGORIES[4].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { t } = useTranslation();

  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
    } else {
      setName('');
      setType('expense');
      setAmount('');
      setCategory(FINANCE_CATEGORIES[4].id);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, open]);

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    onSave({ 
      name: name.trim(), 
      type, 
      amount: parseFloat(amount), 
      category, 
      date 
    });
    onClose();
  };

  const filteredCategories = FINANCE_CATEGORIES.filter(c => 
    c.type === type || c.type === undefined
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {transaction ? t('edit') : t('createTransaction')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Тип операции
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                    type === 'income'
                      ? "bg-habit text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('income')}
                </button>
                <button
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                    type === 'expense'
                      ? "bg-destructive text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('expense')}
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Название
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Зарплата"
                className="bg-background border-border"
              />
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('amount')}
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-background border-border"
              />
            </div>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Дата
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('category')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "p-2 rounded-xl flex flex-col items-center gap-1 transition-all",
                      category === c.id
                        ? "bg-finance/20 ring-2 ring-finance"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-xs text-muted-foreground truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !amount}
              className="w-full bg-finance hover:bg-finance/90 text-white"
            >
              {t('save')}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
