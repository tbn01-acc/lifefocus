import { ExerciseLog, Workout, WorkoutCompletion } from '@/types/fitness';
import { format } from 'date-fns';

export function exportFitnessToCSV(
  exerciseLogs: ExerciseLog[],
  workouts: Workout[],
  completions: WorkoutCompletion[]
): void {
  // Create CSV header
  const headers = [
    'Date',
    'Workout',
    'Exercise',
    'Category',
    'Set Number',
    'Reps',
    'Weight (kg)',
    'Status',
  ];

  // Create CSV rows
  const rows: string[][] = [];
  
  exerciseLogs.forEach(log => {
    if (log.sets.length === 0) {
      // Log entry without sets
      rows.push([
        format(new Date(log.date), 'yyyy-MM-dd'),
        log.workoutName,
        log.exerciseName,
        log.categoryId || '',
        '',
        '',
        '',
        log.status,
      ]);
    } else {
      // Log entry with sets
      log.sets.forEach(set => {
        rows.push([
          format(new Date(log.date), 'yyyy-MM-dd'),
          log.workoutName,
          log.exerciseName,
          log.categoryId || '',
          set.setNumber.toString(),
          set.reps.toString(),
          set.weight?.toString() || '',
          set.completed ? 'completed' : 'not_completed',
        ]);
      });
    }
  });

  // Sort by date descending
  rows.sort((a, b) => b[0].localeCompare(a[0]));

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `fitness-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkoutsToCSV(workouts: Workout[]): void {
  const headers = [
    'Workout Name',
    'Icon',
    'Category',
    'Scheduled Days',
    'Exercise Name',
    'Target Sets',
    'Target Reps',
    'Exercise Category',
  ];

  const rows: string[][] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  workouts.forEach(workout => {
    const scheduledDaysStr = workout.scheduledDays.map(d => dayNames[d]).join(', ');
    
    if (workout.exercises.length === 0) {
      rows.push([
        workout.name,
        workout.icon,
        workout.categoryId || '',
        scheduledDaysStr,
        '',
        '',
        '',
        '',
      ]);
    } else {
      workout.exercises.forEach((exercise, idx) => {
        rows.push([
          idx === 0 ? workout.name : '',
          idx === 0 ? workout.icon : '',
          idx === 0 ? (workout.categoryId || '') : '',
          idx === 0 ? scheduledDaysStr : '',
          exercise.name,
          exercise.targetSets.toString(),
          exercise.targetReps.toString(),
          exercise.categoryId || '',
        ]);
      });
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workouts-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
