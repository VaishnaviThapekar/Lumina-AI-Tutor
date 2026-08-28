'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Target, Clock, BookOpen, Brain, TrendingUp, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

interface StudyTask {
    id: string;
    title: string;
    subject: string;
    date: string;
    duration: number; // minutes
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
    type: 'study' | 'quiz' | 'review' | 'exam';
}

interface Exam {
    id: string;
    subject: string;
    date: string;
    topics: string[];
}

export default function AIStudyPlanner() {
    const [tasks, setTasks] = useState<StudyTask[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddExam, setShowAddExam] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const user = getCurrentUser();

    useEffect(() => {
        if (user) {
            loadTasks();
            loadExams();
        }
    }, [user]);

    const loadTasks = () => {
        const saved = localStorage.getItem(`study_tasks_${user?.id}`);
        if (saved) setTasks(JSON.parse(saved));
    };

    const loadExams = () => {
        const saved = localStorage.getItem(`exams_${user?.id}`);
        if (saved) setExams(JSON.parse(saved));
    };

    const saveTasks = (newTasks: StudyTask[]) => {
        setTasks(newTasks);
        localStorage.setItem(`study_tasks_${user?.id}`, JSON.stringify(newTasks));
    };

    const saveExams = (newExams: Exam[]) => {
        setExams(newExams);
        localStorage.setItem(`exams_${user?.id}`, JSON.stringify(newExams));
    };

    const addTask = (task: Omit<StudyTask, 'id' | 'completed'>) => {
        const newTask: StudyTask = {
            ...task,
            id: Date.now().toString(),
            completed: false
        };
        saveTasks([...tasks, newTask]);
        setShowAddTask(false);
    };

    const addExam = (exam: Omit<Exam, 'id'>) => {
        const newExam: Exam = {
            ...exam,
            id: Date.now().toString()
        };
        saveExams([...exams, newExam]);

        // Auto-generate study tasks for exam
        generateStudyPlan(newExam);
        setShowAddExam(false);
    };

    const generateStudyPlan = (exam: Exam) => {
        const examDate = new Date(exam.date);
        const today = new Date();
        const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExam <= 0) return;

        const generatedTasks: StudyTask[] = [];
        const topicsPerDay = Math.ceil(exam.topics.length / Math.max(daysUntilExam - 1, 1));

        exam.topics.forEach((topic, index) => {
            const dayOffset = Math.floor(index / topicsPerDay);
            const studyDate = new Date(today);
            studyDate.setDate(studyDate.getDate() + dayOffset);

            generatedTasks.push({
                id: `auto_${Date.now()}_${index}`,
                title: `Study: ${topic}`,
                subject: exam.subject,
                date: studyDate.toISOString().split('T')[0],
                duration: 60,
                priority: 'high',
                completed: false,
                type: 'study'
            });
        });

        // Add review day before exam
        const reviewDate = new Date(examDate);
        reviewDate.setDate(reviewDate.getDate() - 1);
        generatedTasks.push({
            id: `review_${Date.now()}`,
            title: `Review all topics for ${exam.subject}`,
            subject: exam.subject,
            date: reviewDate.toISOString().split('T')[0],
            duration: 120,
            priority: 'high',
            completed: false,
            type: 'review'
        });

        saveTasks([...tasks, ...generatedTasks]);
    };

    const toggleTask = (id: string) => {
        saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        saveTasks(tasks.filter(t => t.id !== id));
    };

    const deleteExam = (id: string) => {
        saveExams(exams.filter(e => e.id !== id));
    };

    const tasksForDate = tasks.filter(t => t.date === selectedDate);
    const upcomingExams = exams.filter(e => new Date(e.date) >= new Date()).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalStudyTime = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0);

    return (
        <div className="space-y-6">
            {/* Top Header Banner matching ConceptMap */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
                            <Calendar className="w-4 h-4 animate-bounce" />
                            <span>AI Adaptive Study Schedule</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold">Study Planner & Exam Timetable</h2>
                        <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
                            Auto-schedule review sessions, set exam deadlines, and receive AI workload balance recommendations.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddTask(true)}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2"
                    >
                        <Brain className="w-4 h-4 text-purple-200" />
                        <span>✨ Generate AI Schedule</span>
                    </button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Today's Progress</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{completedToday}/{todayTasks.length}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">Tasks completed</div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-6 h-6 text-purple-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Study Time</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">Total Time Spent</div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Upcoming Exams</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{upcomingExams.length} Exams</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">Deadlines Set</div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Overall Completion</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{Math.round((tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100)}%</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Completion Rate</div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Calendar & Tasks */}
                <div className="md:col-span-2 space-y-6">
                    {/* Date Selector */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-purple-500" />
                                Study Calendar
                            </h3>
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Task
                            </button>
                        </div>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white mb-4"
                        />

                        {/* Tasks for selected date */}
                        <div className="space-y-3">
                            {tasksForDate.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No tasks scheduled for this day</p>
                                </div>
                            ) : (
                                tasksForDate.map(task => (
                                    <div
                                        key={task.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${task.completed
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`font-bold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                        {task.title}
                                                    </h4>
                                                    <button
                                                        onClick={() => deleteTask(task.id)}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="w-4 h-4" />
                                                        {task.subject}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {task.duration} min
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Exams & AI Suggestions */}
                <div className="space-y-6">
                    {/* Upcoming Exams */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Brain className="w-6 h-6 text-orange-500" />
                                Upcoming Exams
                            </h3>
                            <button
                                onClick={() => setShowAddExam(true)}
                                className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {upcomingExams.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No exams scheduled
                                </p>
                            ) : (
                                upcomingExams.map(exam => {
                                    const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={exam.id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{exam.subject}</h4>
                                                <button
                                                    onClick={() => deleteExam(exam.id)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {new Date(exam.date).toLocaleDateString()} ({daysUntil} days)
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {exam.topics.map((topic, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            AI Suggestions
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    Study in 25-min Pomodoro sessions for better focus
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    Review flashcards daily for spaced repetition
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    Schedule breaks every 2 hours to prevent burnout
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            {showAddTask && (
                <TaskModal
                    onClose={() => setShowAddTask(false)}
                    onAdd={addTask}
                    selectedDate={selectedDate}
                />
            )}

            {/* Add Exam Modal */}
            {showAddExam && (
                <ExamModal
                    onClose={() => setShowAddExam(false)}
                    onAdd={addExam}
                />
            )}
        </div>
    );
}

// Task Modal Component
function TaskModal({ onClose, onAdd, selectedDate }: any) {
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        date: selectedDate,
        duration: 60,
        priority: 'medium' as 'high' | 'medium' | 'low',
        type: 'study' as 'study' | 'quiz' | 'review' | 'exam'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Study Task</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Task title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        required
                    />
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        required
                    />
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                    >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                    </select>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                        >
                            Add Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Exam Modal Component
function ExamModal({ onClose, onAdd }: any) {
    const [formData, setFormData] = useState({
        subject: '',
        date: '',
        topics: ['']
    });

    const addTopic = () => {
        setFormData({ ...formData, topics: [...formData.topics, ''] });
    };

    const updateTopic = (index: number, value: string) => {
        const newTopics = [...formData.topics];
        newTopics[index] = value;
        setFormData({ ...formData, topics: newTopics });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            ...formData,
            topics: formData.topics.filter(t => t.trim())
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Exam</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        required
                    />
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        required
                    />
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Topics to Study
                        </label>
                        {formData.topics.map((topic, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Topic ${i + 1}`}
                                value={topic}
                                onChange={(e) => updateTopic(i, e.target.value)}
                                className="w-full px-4 py-3 mb-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                            />
                        ))}
                        <button
                            type="button"
                            onClick={addTopic}
                            className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                        >
                            + Add Topic
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 AI will automatically generate a study plan based on your exam date and topics!
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold"
                        >
                            Add Exam
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}