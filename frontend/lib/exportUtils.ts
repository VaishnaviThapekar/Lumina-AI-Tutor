// lib/exportUtils.ts
// Export utilities for downloading data as PDF, CSV, JSON

import { StudyStats } from './studyTracker';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== CSV EXPORT ====================

export const exportStatsToCSV = (stats: StudyStats): void => {
  const csvData = [
    ['Metric', 'Value'],
    ['Total Study Time (minutes)', stats.totalStudyTime.toString()],
    ['Documents Read', stats.documentsRead.toString()],
    ['Sessions Completed', stats.sessionsCompleted.toString()],
    ['Current Streak (days)', stats.currentStreak.toString()],
    ['Longest Streak (days)', stats.longestStreak.toString()],
    ['Average Session Length (minutes)', stats.averageSessionLength.toString()],
    ['This Week Minutes', stats.thisWeekMinutes.toString()],
    ['Last Week Minutes', stats.lastWeekMinutes.toString()],
    ['Quizzes Completed', stats.quizzesCompleted.toString()],
    ['Average Score (%)', stats.averageScore.toString()],
  ];

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  downloadFile(csvContent, 'study-statistics.csv', 'text/csv');
};

export const exportNotesToCSV = (notes: Note[]): void => {
  const csvData = [
    ['Title', 'Content', 'Tags', 'Created', 'Updated'],
    ...notes.map(note => [
      `"${note.title.replace(/"/g, '""')}"`,
      `"${note.content.replace(/"/g, '""')}"`,
      `"${note.tags.join(', ')}"`,
      new Date(note.createdAt).toLocaleDateString(),
      new Date(note.updatedAt).toLocaleDateString(),
    ])
  ];

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  downloadFile(csvContent, 'study-notes.csv', 'text/csv');
};

// ==================== JSON EXPORT ====================

export const exportNotesToJSON = (notes: Note[]): void => {
  const jsonContent = JSON.stringify(notes, null, 2);
  downloadFile(jsonContent, 'study-notes.json', 'application/json');
};

export const exportStatsToJSON = (stats: StudyStats): void => {
  const jsonContent = JSON.stringify(stats, null, 2);
  downloadFile(jsonContent, 'study-statistics.json', 'application/json');
};

// ==================== TEXT EXPORT ====================

export const exportNotesToText = (notes: Note[]): void => {
  let textContent = '='.repeat(60) + '\n';
  textContent += 'LUMINA AI TUTOR - STUDY NOTES\n';
  textContent += '='.repeat(60) + '\n\n';
  textContent += `Exported: ${new Date().toLocaleString()}\n`;
  textContent += `Total Notes: ${notes.length}\n\n`;
  
  notes.forEach((note, index) => {
    textContent += '-'.repeat(60) + '\n';
    textContent += `NOTE ${index + 1}: ${note.title}\n`;
    textContent += '-'.repeat(60) + '\n';
    textContent += `Created: ${new Date(note.createdAt).toLocaleString()}\n`;
    textContent += `Updated: ${new Date(note.updatedAt).toLocaleString()}\n`;
    textContent += `Tags: ${note.tags.join(', ') || 'None'}\n\n`;
    textContent += note.content + '\n\n';
  });

  downloadFile(textContent, 'study-notes.txt', 'text/plain');
};

export const exportStatsToText = (stats: StudyStats): void => {
  let textContent = '='.repeat(60) + '\n';
  textContent += 'LUMINA AI TUTOR - STUDY STATISTICS REPORT\n';
  textContent += '='.repeat(60) + '\n\n';
  textContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  textContent += 'OVERALL STATISTICS\n';
  textContent += '-'.repeat(60) + '\n';
  textContent += `Total Study Time: ${formatMinutes(stats.totalStudyTime)}\n`;
  textContent += `Documents Read: ${stats.documentsRead}\n`;
  textContent += `Sessions Completed: ${stats.sessionsCompleted}\n`;
  textContent += `Average Session Length: ${stats.averageSessionLength} minutes\n\n`;
  
  textContent += 'PERFORMANCE METRICS\n';
  textContent += '-'.repeat(60) + '\n';
  textContent += `Quizzes Completed: ${stats.quizzesCompleted}\n`;
  textContent += `Average Quiz Score: ${stats.averageScore}%\n\n`;
  
  textContent += 'STUDY HABITS\n';
  textContent += '-'.repeat(60) + '\n';
  textContent += `Current Streak: ${stats.currentStreak} days 🔥\n`;
  textContent += `Longest Streak: ${stats.longestStreak} days\n\n`;
  
  textContent += 'WEEKLY PROGRESS\n';
  textContent += '-'.repeat(60) + '\n';
  textContent += `This Week: ${formatMinutes(stats.thisWeekMinutes)}\n`;
  textContent += `Last Week: ${formatMinutes(stats.lastWeekMinutes)}\n`;
  const weeklyChange = stats.lastWeekMinutes > 0 
    ? Number((((stats.thisWeekMinutes - stats.lastWeekMinutes) / stats.lastWeekMinutes) * 100).toFixed(1))
    : 0;
  textContent += `Change: ${weeklyChange > 0 ? '+' : ''}${weeklyChange}%\n`;

  downloadFile(textContent, 'study-statistics.txt', 'text/plain');
};

// ==================== MARKDOWN EXPORT ====================

export const exportNotesToMarkdown = (notes: Note[]): void => {
  let mdContent = '# Study Notes\n\n';
  mdContent += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  mdContent += `**Total Notes:** ${notes.length}\n\n`;
  mdContent += '---\n\n';
  
  notes.forEach((note, index) => {
    mdContent += `## ${index + 1}. ${note.title}\n\n`;
    mdContent += `**Created:** ${new Date(note.createdAt).toLocaleString()}  \n`;
    mdContent += `**Updated:** ${new Date(note.updatedAt).toLocaleString()}  \n`;
    if (note.tags.length > 0) {
      mdContent += `**Tags:** ${note.tags.map(tag => `\`${tag}\``).join(', ')}  \n`;
    }
    mdContent += '\n';
    mdContent += note.content + '\n\n';
    mdContent += '---\n\n';
  });

  downloadFile(mdContent, 'study-notes.md', 'text/markdown');
};

// ==================== BACKUP/RESTORE ====================

export const createFullBackup = (): void => {
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      stats: localStorage.getItem('studyStats'),
      notes: localStorage.getItem('studyNotes'),
      pomodoroDate: localStorage.getItem('pomodoroDate'),
      pomodoroMinutes: localStorage.getItem('pomodoroMinutes'),
      lastWeekReset: localStorage.getItem('lastWeekReset'),
    }
  };

  const jsonContent = JSON.stringify(backup, null, 2);
  downloadFile(jsonContent, `lumina-backup-${Date.now()}.json`, 'application/json');
};

export const restoreFromBackup = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        if (!backup.data) {
          throw new Error('Invalid backup file');
        }
        
        // Restore data
        Object.entries(backup.data).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// ==================== HELPER FUNCTIONS ====================

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// ==================== PRINT FUNCTIONS ====================

export const printStats = (stats: StudyStats): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Study Statistics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
          .section { margin: 30px 0; }
          .section h2 { color: #6366f1; margin-bottom: 15px; }
          .metric { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .metric-label { font-weight: 600; }
          .metric-value { color: #4f46e5; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>📊 Study Statistics Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="section">
          <h2>Overall Statistics</h2>
          <div class="metric"><span class="metric-label">Total Study Time:</span><span class="metric-value">${formatMinutes(stats.totalStudyTime)}</span></div>
          <div class="metric"><span class="metric-label">Documents Read:</span><span class="metric-value">${stats.documentsRead}</span></div>
          <div class="metric"><span class="metric-label">Sessions Completed:</span><span class="metric-value">${stats.sessionsCompleted}</span></div>
          <div class="metric"><span class="metric-label">Average Session Length:</span><span class="metric-value">${stats.averageSessionLength} min</span></div>
        </div>
        
        <div class="section">
          <h2>Performance Metrics</h2>
          <div class="metric"><span class="metric-label">Quizzes Completed:</span><span class="metric-value">${stats.quizzesCompleted}</span></div>
          <div class="metric"><span class="metric-label">Average Quiz Score:</span><span class="metric-value">${stats.averageScore}%</span></div>
        </div>
        
        <div class="section">
          <h2>Study Habits</h2>
          <div class="metric"><span class="metric-label">Current Streak:</span><span class="metric-value">${stats.currentStreak} days 🔥</span></div>
          <div class="metric"><span class="metric-label">Longest Streak:</span><span class="metric-value">${stats.longestStreak} days</span></div>
        </div>
        
        <div class="section">
          <h2>Weekly Progress</h2>
          <div class="metric"><span class="metric-label">This Week:</span><span class="metric-value">${formatMinutes(stats.thisWeekMinutes)}</span></div>
          <div class="metric"><span class="metric-label">Last Week:</span><span class="metric-value">${formatMinutes(stats.lastWeekMinutes)}</span></div>
        </div>
        
        <div class="footer">
          <p>Generated by Lumina AI Tutor</p>
          <p>Keep up the great work! 🎓</p>
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

export const printNotes = (notes: Note[]): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const notesHtml = notes.map((note, index) => `
    <div class="note">
      <h2>${index + 1}. ${note.title}</h2>
      <div class="note-meta">
        <span>Created: ${new Date(note.createdAt).toLocaleDateString()}</span>
        <span>Updated: ${new Date(note.updatedAt).toLocaleDateString()}</span>
      </div>
      ${note.tags.length > 0 ? `<div class="tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
      <div class="content">${note.content.replace(/\n/g, '<br>')}</div>
    </div>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Study Notes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
          .note { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
          .note h2 { color: #6366f1; margin-top: 0; }
          .note-meta { color: #6b7280; font-size: 12px; margin: 10px 0; }
          .note-meta span { margin-right: 20px; }
          .tags { margin: 10px 0; }
          .tag { display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 4px 12px; border-radius: 12px; margin-right: 8px; font-size: 12px; }
          .content { margin-top: 15px; line-height: 1.6; }
          .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; page-break-before: always; }
        </style>
      </head>
      <body>
        <h1>📝 Study Notes</h1>
        <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Notes:</strong> ${notes.length}</p>
        ${notesHtml}
        <div class="footer">
          <p>Generated by Lumina AI Tutor</p>
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};
