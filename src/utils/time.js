export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const calculateDuration = (start, end) => {
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  return endMins - startMins;
};

export const formatDuration = (totalMinutes) => {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  let text = '';
  if (hrs > 0) text += `${hrs}h `;
  if (mins > 0 || hrs === 0) text += `${mins}m`;
  return text;
};

export const sortTasksByTime = (tasks) => {
  return [...tasks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
};

export const sortPenalties = (penalties) => {
  return [...penalties].sort((a, b) => b.duration - a.duration);
};

export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};