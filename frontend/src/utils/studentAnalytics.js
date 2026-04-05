export function getSmartExplanations(form, probability) {
  const cgpa = parseFloat(form.CGPA);
  const attendance = parseFloat(form.Attendance);
  const backlogs = parseInt(form.Backlogs, 10);
  
  const explanations = [];
  let remainingProb = probability * 100;

  // Approximate relative weights based on typical predictive importance
  if (!isNaN(attendance) && attendance < 75) {
    explanations.push({ factor: 'Attendance', desc: `Attendance is critically low at ${attendance}%`, contribution: Math.min(40, remainingProb * 0.4), icon: '📅' });
  } else if (!isNaN(attendance) && attendance < 85) {
    explanations.push({ factor: 'Attendance', desc: `Attendance is slipping (${attendance}%)`, contribution: Math.min(15, remainingProb * 0.2), icon: '📅' });
  }

  if (!isNaN(cgpa) && cgpa < 6.0) {
    explanations.push({ factor: 'Grades', desc: `CGPA (${cgpa}) is below healthy threshold`, contribution: Math.min(35, remainingProb * 0.35), icon: '📉' });
  } else if (!isNaN(cgpa) && cgpa < 7.0) {
    explanations.push({ factor: 'Grades', desc: `CGPA (${cgpa}) is showing signs of risk`, contribution: Math.min(20, remainingProb * 0.2), icon: '📉' });
  }

  if (!isNaN(backlogs) && backlogs > 0) {
    const contribution = Math.min(25, backlogs * 10);
    explanations.push({ factor: 'Backlogs', desc: `You have ${backlogs} active backlog(s)`, contribution: contribution, icon: '📚' });
  }

  // Fallback if the ML model sees a risk we didn't statically catch
  if (explanations.length === 0 && probability > 0.4) {
    explanations.push({ factor: 'Overall Profile', desc: 'Holistic risk detected by AI model processing', contribution: Math.min(50, remainingProb), icon: '🧠' });
  }

  // Normalize contributions if they exceed probability or adjust slightly for realism
  return explanations.sort((a, b) => b.contribution - a.contribution);
}

export function getActionPlan(form, probability, riskLevel) {
  const cgpa = parseFloat(form.CGPA);
  const attendance = parseFloat(form.Attendance);
  const backlogs = parseInt(form.Backlogs, 10);

  const actions = [];

  if (!isNaN(attendance) && attendance < 75) {
    actions.push({ text: 'Attend at least 80% of classes next month', priority: 'URGENT', icon: '🚨' });
  }
  
  if (!isNaN(backlogs) && backlogs > 0) {
    actions.push({ text: `Schedule immediate office hours to clear ${backlogs} backlog(s)`, priority: 'HIGH', icon: '⚡' });
  }

  if (!isNaN(cgpa) && cgpa < 6.5) {
    actions.push({ text: 'Focus on core subjects. Allocate 2 hours/day for intensive revision', priority: 'HIGH', icon: '📖' });
  }

  if (probability > 0.6) {
    actions.push({ text: 'Schedule a session with your academic counselor this week', priority: 'URGENT', icon: '👨‍🏫' });
  }

  if (actions.length === 0) {
    actions.push({ text: 'Maintain your current study habits and attendance rate', priority: 'LOW', icon: '✅' });
    if (!isNaN(cgpa) && cgpa > 8) {
      actions.push({ text: 'Consider joining advanced study groups or mentorship programs', priority: 'LOW', icon: '🚀' });
    }
  }

  return actions;
}
