import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserHabits, updateUserHabits } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_HABITS = [
  { id: 'classes', label: 'Attended Classes', icon: '🎓' },
  { id: 'study', label: 'Studied 2+ Hours', icon: '📚' },
  { id: 'revision', label: 'Reviewed Old Notes', icon: '📝' }
];

export default function StudentHabits() {
  const { currentUser } = useAuth();
  const [dates, setDates] = useState({});
  const [loading, setLoading] = useState(true);

  // Get current date string (YYYY-MM-DD) natively
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadHabits() {
      if (!currentUser) return;
      try {
        const data = await getUserHabits(currentUser.uid);
        if (data && data.dates) {
          setDates(data.dates);
        }
      } catch (err) {
        console.error("Failed to load habits", err);
      } finally {
         setLoading(false);
      }
    }
    loadHabits();
  }, [currentUser]);

  const toggleHabit = async (habitId, isCompleted) => {
    if (!currentUser) return;

    const currentToday = dates[today] || [];
    let updatedToday;

    if (isCompleted) {
      updatedToday = [...new Set([...currentToday, habitId])];
    } else {
      updatedToday = currentToday.filter(id => id !== habitId);
    }

    const updatedDates = {
      ...dates,
      [today]: updatedToday
    };

    setDates(updatedDates);

    try {
      await updateUserHabits(currentUser.uid, { dates: updatedDates });
    } catch (err) {
      console.error("Failed to update habits", err);
    }
  };

  const calculateStreak = () => {
    let streak = 0;
    const sortedDays = Object.keys(dates).sort((a,b) => b.localeCompare(a));
    // Determine active streaks dynamically
    for (let i = 0; i < sortedDays.length; i++) {
        if (dates[sortedDays[i]].length > 0) {
           streak++;
        }
    }
    return streak;
  }

  const todayHabits = dates[today] || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Daily Tracker</h3>
        <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center gap-2">
           <span className="text-orange-500">🔥</span>
           <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{calculateStreak()} Day Streak</span>
        </div>
      </div>

      <div className="space-y-3 flex-1">
         {DEFAULT_HABITS.map(habit => {
           const isChecked = todayHabits.includes(habit.id);
           return (
             <motion.div 
               key={habit.id}
               whileTap={{ scale: 0.98 }}
               className={`p-3 rounded-xl border flex items-center cursor-pointer transition-all ${isChecked ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
               onClick={() => toggleHabit(habit.id, !isChecked)}
             >
                <div className={`w-6 h-6 rounded-md mr-4 flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {isChecked && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-lg mr-3">{habit.icon}</span>
                <span className={`text-sm font-semibold flex-1 transition-all ${isChecked ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>
                   {habit.label}
                </span>
             </motion.div>
           )
         })}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Complete your goals to maintain your momentum!</p>
    </div>
  )
}
