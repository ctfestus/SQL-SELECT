
import React, { useState, useEffect, useRef } from 'react';
import { User, SavedChallenge, Challenge, CourseModule, Course, PlanSettings, LearningPath, ChallengeType, PlanPermission } from '../types';
import {
    fetchAllLearners, fetchSavedChallenges, saveAdminChallenge, toggleChallengePublish, deleteSavedChallenge,
    fetchCourses, createCourseDraft, createCourseModules, updateCourseStatus, updateCourseModule, deleteCourse,
    updateCourseDetails, deleteCourseModule, updateLearnerPlan, fetchPlanSettings, savePlanSettings,
    fetchLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath, addCourseToPath, removeCourseFromPath,
    fetchAllPlanPermissions, updatePlanPermission
} from '../services/supabaseService';
import { generateAdminChallenge, generateCourseOutline, generateCourseChallenge, refineCourseModule, refineChallengeContent, generateBundleMetadata } from '../services/geminiService';
import {
    Users, BookOpen, Wand2, Shield, Search, Filter,
    MoreVertical, CheckCircle, XCircle, Trash2, Eye,
    Loader2, Save, RefreshCw, X, Layers, ArrowRight, Play, Edit3, GripVertical, FileText, Plus,
    Target, Zap, Clock, Database, ChevronRight, Sparkles, BrainCircuit, Check, Terminal, Maximize2, CreditCard, DollarSign, Crown, Calendar, Trophy, Flame, Package, Power, ToggleLeft, ToggleRight, ArrowLeft, Type, Upload, ListChecks, Bug, Code, Lock, Bot, Mic
} from 'lucide-react';

interface AdminDashboardProps {
    user: User;
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
    const [activeTab, setActiveTab] = useState<'learners' | 'content' | 'create' | 'courses' | 'bundles' | 'subscriptions' | 'access'>('learners');
    const [learners, setLearners] = useState<any[]>([]);
    const [savedChallenges, setSavedChallenges] = useState<SavedChallenge[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    // AI Creator State (Single Challenge)
    const [createTopic, setCreateTopic] = useState('Advanced Window Functions');
    const [createIndustry, setCreateIndustry] = useState('FinTech');
    const [createDiff, setCreateDiff] = useState('Intermediate');
    const [createContext, setCreateContext] = useState('A neobank analyzing transaction velocity for fraud detection.');
    const [generatedChallenge, setGeneratedChallenge] = useState<Challenge | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Course Builder State
    const [courseStep, setCourseStep] = useState<'list' | 'setup' | 'outline_review' | 'generating' | 'preview'>('list');
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [setupMode, setSetupMode] = useState<'manual' | 'upload'>('manual');

    // Setup Inputs
    const [courseInput, setCourseInput] = useState({
        title: 'Advanced Financial Analytics',
        industry: 'Finance',
        role: 'Senior Data Analyst',
        level: 'Advanced',
        context: 'You are working at a high-frequency trading firm...'
    });

    const [isReadingFile, setIsReadingFile] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');

    // State for modules being edited/generated
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationLog, setGenerationLog] = useState<string[]>([]);
    const generationProcessRef = useRef(false);
    const [isRefining, setIsRefining] = useState(false);
    const [aiModulePrompt, setAiModulePrompt] = useState('');

    // Drag and Drop State
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Content Editor State (Preview Stage)
    const [editingContentId, setEditingContentId] = useState<number | null>(null);
    const [jsonEditorContent, setJsonEditorContent] = useState('');
    const [aiRefinePrompt, setAiRefinePrompt] = useState('');
    const [isRefiningContent, setIsRefiningContent] = useState(false);

    // Subscription Edit State
    const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
    const [tempPlan, setTempPlan] = useState('');
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

    // Global Subscription Settings
    const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Access Control State
    const [permissions, setPermissions] = useState<PlanPermission[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);

    // Learning Path (Bundle) State
    const [bundles, setBundles] = useState<LearningPath[]>([]);
    const [bundleView, setBundleView] = useState<'list' | 'editor'>('list');
    const [editingBundle, setEditingBundle] = useState<LearningPath | null>(null);

    // Bundle Form Data
    const [newBundleData, setNewBundleData] = useState({
        title: '',
        description: '',
        target_role: '',
        industry: 'General',
        is_published: false
    });
    const [bundleSelectedCourses, setBundleSelectedCourses] = useState<Course[]>([]);

    // AI Bundle Creator
    const [bundleTopic, setBundleTopic] = useState('');
    const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);

    useEffect(() => {
        if (activeTab === 'learners') loadLearners();
        if (activeTab === 'content') loadContent();
        if (activeTab === 'courses') loadCourses();
        if (activeTab === 'subscriptions') loadPlanSettings();
        if (activeTab === 'bundles') { loadCourses(); loadBundles(); }
        if (activeTab === 'access') loadPermissions();
    }, [activeTab]);

    useEffect(() => {
        setAiModulePrompt('');
    }, [editingModuleIndex]);

    // Automatic Generation Trigger
    useEffect(() => {
        if (courseStep === 'generating' && activeCourseId && !generationProcessRef.current) {
            const currentCourse = courses.find(c => c.id === activeCourseId);
            // Ensure modules are loaded before starting
            if (currentCourse && currentCourse.modules && currentCourse.modules.length > 0) {
                handleGenerateContent();
            }
        }
    }, [courseStep, courses, activeCourseId]);

    const loadLearners = async () => {
        setLoading(true);
        const data = await fetchAllLearners();
        setLearners(data || []);
        setLoading(false);
    };

    const loadContent = async () => {
        setLoading(true);
        const data = await fetchSavedChallenges();
        setSavedChallenges(data || []);
        setLoading(false);
    };

    const loadCourses = async () => {
        setLoading(true);
        const data = await fetchCourses();
        setCourses(data || []);
        setLoading(false);
    };

    const loadBundles = async () => {
        setLoading(true);
        const data = await fetchLearningPaths();
        setBundles(data || []);
        setLoading(false);
    };

    const loadPlanSettings = async () => {
        setLoading(true);
        const data = await fetchPlanSettings();
        setPlanSettings(data);
        setLoading(false);
    };

    const loadPermissions = async () => {
        setLoading(true);
        const data = await fetchAllPlanPermissions();
        setPermissions(data || []);
        setLoading(false);
    };

    const filteredLearners = learners.filter(l =>
        (l.username && l.username.toLowerCase().includes(filter.toLowerCase())) ||
        (l.id && l.id.toLowerCase().includes(filter.toLowerCase()))
    );

    // --- Document Upload Handlers ---

    const extractTextFromPdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        // Use globally loaded pdfjsLib from script tag
        const pdfjsLib = (window as any).pdfjsLib;

        if (!pdfjsLib) {
            console.error("PDF.js library is not loaded.");
            return "Error: PDF.js library not detected.";
        }

        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
            }
            return fullText;
        } catch (error) {
            console.error("Error extracting text from PDF:", error);
            return "Error parsing PDF file.";
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsReadingFile(true);
        setUploadedFileName(file.name);

        try {
            let content = "";
            if (file.type === "application/pdf") {
                content = await extractTextFromPdf(file);
            } else if (
                file.type === "text/plain" ||
                file.type === "text/markdown" ||
                file.name.endsWith(".md") ||
                file.name.endsWith(".txt")
            ) {
                content = await file.text();
            } else if (
                file.name.endsWith(".pptx") ||
                file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            ) {
                content = `[Presentation File: ${file.name}]\n(Content extraction from PPTX is simulated for this demo. Please verify context.)\n\nSlides content would appear here...`;
            } else {
                alert("Unsupported file type. Please upload PDF, Markdown, or Text.");
                setIsReadingFile(false);
                return;
            }

            setCourseInput(prev => ({
                ...prev,
                context: `Based on the uploaded document "${file.name}":\n\n${content.substring(0, 25000)}...` // Limit context size just in case
            }));
        } catch (err) {
            console.error("File read error:", err);
            alert("Failed to read file. Please try another document.");
            setUploadedFileName('');
        } finally {
            setIsReadingFile(false);
        }
    };

    // ---

    const handleUpdateLearnerPlan = async () => {
        if (!tempPlan || !editingLearnerId) return;
        setIsUpdatingPlan(true);

        const success = await updateLearnerPlan(editingLearnerId, tempPlan);

        if (success) {
            setEditingLearnerId(null);
            await loadLearners();
        } else {
            alert('Failed to update plan. Please check admin permissions.');
        }
        setIsUpdatingPlan(false);
    };

    const handleSavePlanSettings = async () => {
        if (!planSettings) return;
        setIsSavingSettings(true);
        const success = await savePlanSettings(planSettings);
        if (success) {
            alert('Pricing updated successfully!');
        } else {
            alert('Failed to save settings. Please check database permissions.');
        }
        setIsSavingSettings(false);
    };

    const handleSavePermissions = async () => {
        setIsSavingPermissions(true);
        let success = true;
        for (const p of permissions) {
            const ok = await updatePlanPermission(p.tier, {
                course_lesson_limit: p.course_lesson_limit,
                allow_ai_tutor: p.allow_ai_tutor,
                allow_live_instructor: p.allow_live_instructor
            });
            if (!ok) success = false;
        }
        if (success) {
            alert('Permissions updated successfully!');
        } else {
            alert('Error updating some permissions.');
        }
        setIsSavingPermissions(false);
    };

    const handlePermissionChange = (index: number, field: keyof PlanPermission, value: any) => {
        const newPermissions = [...permissions];
        newPermissions[index] = { ...newPermissions[index], [field]: value };
        setPermissions(newPermissions);
    };

    // --- Bundle Management ---
    const handleGenerateBundleMetadata = async () => {
        if (!bundleTopic.trim()) return;
        setIsGeneratingBundle(true);
        try {
            const meta = await generateBundleMetadata(bundleTopic);
            setNewBundleData(prev => ({
                ...prev,
                title: meta.title,
                description: meta.description,
                target_role: meta.target_role,
                industry: meta.industry
            }));
        } catch (e) {
            alert('Failed to generate metadata.');
        } finally {
            setIsGeneratingBundle(false);
        }
    };

    const openCreateBundleEditor = () => {
        setEditingBundle(null);
        setNewBundleData({ title: '', description: '', target_role: '', industry: 'General', is_published: false });
        setBundleSelectedCourses([]);
        setBundleTopic('');
        setBundleView('editor');
    };

    const openEditBundleEditor = (bundle: LearningPath) => {
        setEditingBundle(bundle);
        setNewBundleData({
            title: bundle.title,
            description: bundle.description,
            target_role: bundle.target_role,
            industry: bundle.industry,
            is_published: bundle.is_published
        });
        setBundleSelectedCourses(bundle.courses || []);
        setBundleTopic('');
        setBundleView('editor');
    };

    const handleSaveBundle = async () => {
        if (!newBundleData.title) return;

        let bundleId = editingBundle?.id;
        let success = false;

        if (bundleId) {
            success = await updateLearningPath(bundleId, {
                title: newBundleData.title,
                description: newBundleData.description,
                target_role: newBundleData.target_role,
                industry: newBundleData.industry,
                is_published: newBundleData.is_published
            });
            const currentCourses = editingBundle?.courses || [];
            for (const c of currentCourses) {
                await removeCourseFromPath(bundleId, c.id);
            }
        } else {
            const created = await createLearningPath({
                title: newBundleData.title,
                description: newBundleData.description,
                target_role: newBundleData.target_role,
                industry: newBundleData.industry,
                is_published: newBundleData.is_published
            });
            if (created) {
                bundleId = created.id;
                success = true;
            }
        }

        if (success && bundleId) {
            for (let i = 0; i < bundleSelectedCourses.length; i++) {
                await addCourseToPath(bundleId, bundleSelectedCourses[i].id, i + 1);
            }
            setBundleView('list');
            loadBundles();
        } else {
            alert('Failed to save bundle.');
        }
    };

    const handleToggleCourseSelection = (course: Course) => {
        if (bundleSelectedCourses.some(c => c.id === course.id)) {
            setBundleSelectedCourses(prev => prev.filter(c => c.id !== course.id));
        } else {
            setBundleSelectedCourses(prev => [...prev, course]);
        }
    };

    const handleToggleBundlePublish = async (bundle: LearningPath) => {
        await updateLearningPath(bundle.id, { is_published: !bundle.is_published });
        loadBundles();
    };

    const handleDeleteBundle = async (id: number) => {
        if (confirm('Delete this learning path?')) {
            await deleteLearningPath(id);
            loadBundles();
        }
    };

    // --- Single Challenge Logic ---
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const challenge = await generateAdminChallenge(createTopic, createIndustry, createDiff, createContext);
            setGeneratedChallenge(challenge);
        } catch (e) {
            console.error(e);
            alert('Failed to generate content. Try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedChallenge) return;
        const success = await saveAdminChallenge(generatedChallenge, createIndustry, createDiff);
        if (success) {
            alert('Challenge saved to library!');
            setActiveTab('content');
            setGeneratedChallenge(null);
        }
    };

    // --- Course Builder Logic ---

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        const newModules = [...modules];
        const draggedItem = newModules[draggedIndex];
        newModules.splice(draggedIndex, 1);
        newModules.splice(dropIndex, 0, draggedItem);
        const resequenced = newModules.map((m, i) => ({ ...m, sequence_order: i + 1 }));
        setModules(resequenced);
        setDraggedIndex(null);
    };

    const removeModule = (index: number) => {
        if (confirm('Are you sure you want to remove this module?')) {
            const newModules = modules.filter((_, i) => i !== index);
            const resequenced = newModules.map((m, i) => ({ ...m, sequence_order: i + 1 }));
            setModules(resequenced);
            if (editingModuleIndex === index) setEditingModuleIndex(null);
        }
    };

    const addModule = () => {
        const newModule: CourseModule = {
            sequence_order: modules.length + 1,
            title: 'New Lesson',
            skill_focus: 'Select SQL Topic',
            task_description: 'Describe the task...',
            expected_outcome: 'Expected result...',
            estimated_time: '15 mins',
            challenge_json: null,
            moduleType: 'sql'
        };
        setModules([...modules, newModule]);
        setEditingModuleIndex(modules.length);
    };

    const updateModuleField = (index: number, field: keyof CourseModule, value: string) => {
        const newModules = [...modules];
        newModules[index] = { ...newModules[index], [field]: value };
        setModules(newModules);
    };

    const handleRefineModule = async (index: number) => {
        if (!aiModulePrompt.trim()) return;
        setIsRefining(true);
        try {
            const currentModule = modules[index];
            const newModulesData = await refineCourseModule(currentModule, courseInput.context, aiModulePrompt);
            const newModulesList = [...modules];
            newModulesList.splice(index, 1, ...newModulesData.map(m => ({ ...m, sequence_order: 0, challenge_json: null, moduleType: currentModule.moduleType })));
            const resequenced = newModulesList.map((m, i) => ({ ...m, sequence_order: i + 1 }));
            setModules(resequenced);
            setAiModulePrompt('');
            setEditingModuleIndex(null);
        } catch (error) {
            alert('Failed to refine module.');
        } finally {
            setIsRefining(false);
        }
    };

    const handleDraftOutline = async () => {
        setIsGenerating(true);
        try {
            const { scenario, modules: items } = await generateCourseOutline(courseInput.title, courseInput.industry, courseInput.role, courseInput.level, courseInput.context);
            setCourseInput(prev => ({ ...prev, context: scenario }));
            const draftModules: CourseModule[] = items.map((item, idx) => ({
                sequence_order: idx + 1,
                title: item.title,
                skill_focus: item.skillFocus,
                task_description: item.taskDescription,
                expected_outcome: item.expectedOutcome,
                estimated_time: item.estimatedTime,
                challenge_json: null,
                moduleType: 'sql' // Default
            }));
            setModules(draftModules);
            setCourseStep('outline_review');
        } catch (e) {
            alert('Failed to generate outline.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveOutline = async () => {
        // Prepare modules by saving intended type into challenge_json placeholder if it doesn't exist
        const modulesToSave = modules.map(m => ({
            ...m,
            challenge_json: m.challenge_json || { type: m.moduleType || 'sql' } as any
        }));

        if (activeCourseId) {
            await updateCourseDetails(activeCourseId, {
                title: courseInput.title,
                industry: courseInput.industry,
                target_role: courseInput.role,
                skill_level: courseInput.level,
                main_context: courseInput.context
            });
            const existingCourse = courses.find(c => c.id === activeCourseId);
            const existingModules = existingCourse?.modules || [];
            const currentModuleIds = new Set(modulesToSave.map(m => m.id).filter(id => id !== undefined));
            const toDelete = existingModules.filter(m => m.id && !currentModuleIds.has(m.id));
            for (const m of toDelete) { if (m.id) await deleteCourseModule(m.id); }
            for (let i = 0; i < modulesToSave.length; i++) {
                const m = modulesToSave[i];
                if (m.id) {
                    await updateCourseModule(m.id, {
                        sequence_order: i + 1,
                        title: m.title,
                        skill_focus: m.skill_focus,
                        task_description: m.task_description,
                        expected_outcome: m.expected_outcome,
                        estimated_time: m.estimated_time,
                        challenge_json: m.challenge_json // persist type
                    });
                } else {
                    await createCourseModules(activeCourseId, [{ ...m, sequence_order: i + 1 }]);
                }
            }
            await updateCourseStatus(activeCourseId, 'outline_ready');
            await loadCourses();
            setCourseStep('generating');
        } else {
            const courseRecord = await createCourseDraft({
                title: courseInput.title,
                industry: courseInput.industry,
                target_role: courseInput.role,
                skill_level: courseInput.level,
                main_context: courseInput.context
            });
            if (!courseRecord) { alert('Failed to create course record.'); return; }
            const success = await createCourseModules(courseRecord.id, modulesToSave);
            if (success) {
                await updateCourseStatus(courseRecord.id, 'outline_ready');
                setActiveCourseId(courseRecord.id);
                await loadCourses();
                setCourseStep('generating');
            } else { alert('Error saving modules.'); }
        }
    };

    const handleGenerateContent = async () => {
        if (generationProcessRef.current) return;
        generationProcessRef.current = true;
        const currentCourse = courses.find(c => c.id === activeCourseId);
        if (!currentCourse || !currentCourse.modules) { generationProcessRef.current = false; return; }
        setCourseStep('generating');
        setGenerationProgress(0);
        setGenerationLog([]);
        const dbModules = currentCourse.modules;
        for (let i = 0; i < dbModules.length; i++) {
            const mod = dbModules[i];
            setGenerationLog(prev => [...prev, `Analyzing Module ${i + 1}: ${mod.title}...`]);

            // Check if already fully generated (has schema etc, not just placeholder)
            if (mod.challenge_json && mod.challenge_json.schema && mod.challenge_json.schema.length > 0) {
                setGenerationLog(prev => [...prev, `> Content already exists. Skipping.`]);
                setGenerationProgress(Math.round(((i + 1) / dbModules.length) * 100));
                continue;
            }

            let retries = 0;
            let success = false;
            // Determine type from stored json placeholder
            const type = (mod.challenge_json?.type as ChallengeType) || 'sql';

            while (retries < 3 && !success) {
                try {
                    setGenerationLog(prev => [...prev, `> Synthesizing ${type.toUpperCase()} challenge (Attempt ${retries + 1})...`]);
                    const outlineItem = { title: mod.title, skillFocus: mod.skill_focus, taskDescription: mod.task_description, expectedOutcome: mod.expected_outcome, difficulty: currentCourse.skill_level, estimatedTime: mod.estimated_time };
                    const challenge = await generateCourseChallenge(outlineItem, currentCourse.industry, currentCourse.main_context, type);
                    await updateCourseModule(mod.id!, { challenge_json: challenge });
                    setGenerationLog(prev => [...prev, `> Module ${i + 1} compiled successfully.`]);
                    success = true;
                } catch (e) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            if (!success) { setGenerationLog(prev => [...prev, `> ERROR: Failed to generate Module ${i + 1}.`]); }
            setGenerationProgress(Math.round(((i + 1) / dbModules.length) * 100));
        }
        setGenerationLog(prev => [...prev, `Build Complete.`]);
        await updateCourseStatus(activeCourseId!, 'generating');
        await loadCourses();
        setCourseStep('preview');
        generationProcessRef.current = false;
    };

    const openContentEditor = (moduleId: number) => {
        const module = courses.find(c => c.id === activeCourseId)?.modules?.find(m => m.id === moduleId);
        if (module && module.challenge_json) {
            setEditingContentId(moduleId);
            setJsonEditorContent(JSON.stringify(module.challenge_json, null, 2));
            setAiRefinePrompt('');
        }
    };

    const handleRefineContent = async () => {
        if (!aiRefinePrompt.trim() || !jsonEditorContent) return;
        setIsRefiningContent(true);
        try {
            const currentChallenge = JSON.parse(jsonEditorContent);
            const refinedChallenge = await refineChallengeContent(currentChallenge, aiRefinePrompt);
            setJsonEditorContent(JSON.stringify(refinedChallenge, null, 2));
            setAiRefinePrompt('');
        } catch (error) { alert('Failed to refine content. Please check JSON validity.'); } finally { setIsRefiningContent(false); }
    };

    const handleSaveContent = async () => {
        if (!editingContentId) return;
        try {
            const parsed = JSON.parse(jsonEditorContent);
            await updateCourseModule(editingContentId, { challenge_json: parsed });
            setEditingContentId(null);
            await loadCourses();
        } catch (e) { alert('Invalid JSON. Please fix errors before saving.'); }
    };

    const handlePublish = async () => {
        if (!activeCourseId) return;
        const success = await updateCourseStatus(activeCourseId, 'published');
        if (success) { alert('Course Published Successfully!'); setCourseStep('list'); loadCourses(); }
    };

    const handleResumeCourse = (course: Course) => {
        setActiveCourseId(course.id);
        setCourseInput({ title: course.title, industry: course.industry, role: course.target_role, level: course.skill_level, context: course.main_context });
        if (course.modules) {
            // Populate local module state
            setModules(course.modules.map(m => ({
                ...m,
                moduleType: (m.challenge_json?.type as ChallengeType) || 'sql'
            })));
        }
        if (course.status === 'draft') setCourseStep('outline_review');
        else if (course.status === 'outline_ready') setCourseStep('generating');
        else if (course.status === 'generating') setCourseStep('preview');
        else if (course.status === 'published') setCourseStep('preview');
    };

    const StepsIndicator = () => (
        <div className="flex items-center justify-center mb-10 text-sm font-bold">
            <div className={`flex items-center gap-2 ${['setup', 'outline_review', 'generating', 'preview'].includes(courseStep) ? 'text-corp-cyan' : 'text-slate-600'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${['setup', 'outline_review', 'generating', 'preview'].includes(courseStep) ? 'bg-corp-cyan/20 border-corp-cyan' : 'border-slate-600'}`}>1</div>
                <span>DNA</span>
            </div>
            <div className="w-10 h-px bg-white/10 mx-4"></div>
            <div className={`flex items-center gap-2 ${['outline_review', 'generating', 'preview'].includes(courseStep) ? 'text-corp-cyan' : 'text-slate-600'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${['outline_review', 'generating', 'preview'].includes(courseStep) ? 'bg-corp-cyan/20 border-corp-cyan' : 'border-slate-600'}`}>2</div>
                <span>Blueprint</span>
            </div>
            <div className="w-10 h-px bg-white/10 mx-4"></div>
            <div className={`flex items-center gap-2 ${['generating', 'preview'].includes(courseStep) ? 'text-corp-cyan' : 'text-slate-600'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${['generating', 'preview'].includes(courseStep) ? 'bg-corp-cyan/20 border-corp-cyan' : 'border-slate-600'}`}>3</div>
                <span>Synthesis</span>
            </div>
            <div className="w-10 h-px bg-white/10 mx-4"></div>
            <div className={`flex items-center gap-2 ${['preview'].includes(courseStep) ? 'text-corp-cyan' : 'text-slate-600'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${['preview'].includes(courseStep) ? 'bg-corp-cyan/20 border-corp-cyan' : 'border-slate-600'}`}>4</div>
                <span>Launch</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-corp-blue font-sans text-white flex flex-col">
            {/* Admin Navbar */}
            <nav className="bg-corp-dark border-b border-white/10 px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/30">
                        <Shield size={20} className="text-red-400" />
                    </div>
                    <span className="font-black text-lg tracking-tight">Admin<span className="text-corp-cyan">Portal</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 font-medium">Logged in as <span className="text-white font-bold">{user.email}</span></span>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/5 uppercase tracking-wider">
                        Exit Admin Mode
                    </button>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-black/20 border-r border-white/5 flex flex-col backdrop-blur-sm">
                    <div className="p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('learners')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'learners' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Users size={18} /> Learners
                        </button>
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'courses' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Layers size={18} /> Courses
                        </button>
                        <button
                            onClick={() => setActiveTab('bundles')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'bundles' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Package size={18} /> Bundles
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'subscriptions' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <CreditCard size={18} /> Subscriptions
                        </button>
                        <button
                            onClick={() => setActiveTab('access')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'access' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Lock size={18} /> Access Control
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'content' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <BookOpen size={18} /> Challenges
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'create' ? 'bg-corp-cyan text-corp-dark shadow-lg shadow-corp-cyan/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Wand2 size={18} /> AI Studio
                        </button>
                    </div>
                </aside>

                {/* Main Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-corp-blue to-[#020015] relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                    {/* TAB: ACCESS CONTROL */}
                    {activeTab === 'access' && (
                        <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-corp-dark/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                        <Lock size={32} className="text-corp-cyan" /> Access Control
                                    </h1>
                                    <p className="text-blue-200 text-sm max-w-xl">
                                        Define feature permissions and quotas for each subscription tier. Changes are applied immediately.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isSavingPermissions}
                                    className={`group relative px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden ${isSavingPermissions ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-emerald-500/30'}`}
                                >
                                    <div className="relative z-10 flex items-center gap-3">
                                        {isSavingPermissions ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        <span>{isSavingPermissions ? 'Saving...' : 'Save Permissions'}</span>
                                    </div>
                                    {!isSavingPermissions && <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out"></div>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {permissions.map((perm, idx) => (
                                    <div key={perm.tier} className="bg-corp-dark border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-corp-cyan/30 transition-all group">
                                        <div className="p-6 border-b border-white/5 bg-black/20">
                                            <h3 className="text-xl font-bold text-white capitalize flex items-center justify-between">
                                                {perm.tier} Plan
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${perm.tier === 'pro' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                        perm.tier === 'basic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                    }`}>
                                                    {perm.tier}
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="p-6 space-y-6">

                                            {/* Lesson Limit */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                                    Course Lesson Limit
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-corp-cyan outline-none font-mono"
                                                        value={perm.course_lesson_limit}
                                                        onChange={(e) => handlePermissionChange(idx, 'course_lesson_limit', parseInt(e.target.value))}
                                                    />
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">(-1 = Unlimited)</span>
                                                </div>
                                            </div>

                                            {/* AI Tutor Toggle */}
                                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${perm.allow_ai_tutor ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-500'}`}>
                                                        <Bot size={18} />
                                                    </div>
                                                    <span className={`text-sm font-bold ${perm.allow_ai_tutor ? 'text-white' : 'text-slate-400'}`}>AI Tutor</span>
                                                </div>
                                                <button
                                                    onClick={() => handlePermissionChange(idx, 'allow_ai_tutor', !perm.allow_ai_tutor)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${perm.allow_ai_tutor ? 'bg-green-500' : 'bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${perm.allow_ai_tutor ? 'left-6' : 'left-1'}`}></div>
                                                </button>
                                            </div>

                                            {/* Live Instructor Toggle */}
                                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${perm.allow_live_instructor ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-500'}`}>
                                                        <Mic size={18} />
                                                    </div>
                                                    <span className={`text-sm font-bold ${perm.allow_live_instructor ? 'text-white' : 'text-slate-400'}`}>Live Instructor</span>
                                                </div>
                                                <button
                                                    onClick={() => handlePermissionChange(idx, 'allow_live_instructor', !perm.allow_live_instructor)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${perm.allow_live_instructor ? 'bg-green-500' : 'bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${perm.allow_live_instructor ? 'left-6' : 'left-1'}`}></div>
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ... (Existing Tabs: Bundles, Courses, Content, Create, Learners, Subscriptions) ... */}
                    {/* Note: I'm truncating the other tabs code here for brevity as instructed, ensuring they are preserved in the final output */}

                    {/* TAB: BUNDLES (Learning Paths) */}
                    {activeTab === 'bundles' && (
                        // ... existing bundle content (unchanged)
                        <div className="max-w-6xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                            {bundleView === 'list' ? (
                                <>
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h1 className="text-4xl font-black mb-2 flex items-center gap-3"><Package size={32} className="text-corp-cyan" /> Learning Paths</h1>
                                            <p className="text-blue-200">Curate multi-course bundles for comprehensive skill tracks.</p>
                                        </div>
                                        <button onClick={openCreateBundleEditor} className="bg-gradient-to-r from-corp-cyan to-corp-royal hover:shadow-lg hover:shadow-corp-cyan/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                            <Plus size={18} /> Create Bundle
                                        </button>
                                    </div>

                                    {bundles.length > 0 ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {bundles.map(bundle => (
                                                <div key={bundle.id} className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full hover:border-corp-cyan/30 transition-all">
                                                    <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] font-black text-corp-cyan bg-corp-cyan/10 px-2 py-1 rounded uppercase tracking-widest border border-corp-cyan/20">{bundle.industry}</span>
                                                                <button
                                                                    onClick={() => handleToggleBundlePublish(bundle)}
                                                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors ${bundle.is_published ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'}`}
                                                                >
                                                                    {bundle.is_published ? 'Published' : 'Draft'}
                                                                </button>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white">{bundle.title}</h3>
                                                            <p className="text-sm text-slate-400 mt-1">{bundle.description}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => openEditBundleEditor(bundle)} className="p-2 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-colors border border-white/5" title="Edit Bundle"><Edit3 size={16} /></button>
                                                            <button onClick={() => handleDeleteBundle(bundle.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors border border-white/5" title="Delete Bundle"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-1 bg-corp-dark/30">
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                                                            <span>Included Courses</span>
                                                            <span className="text-white bg-white/10 px-2 py-0.5 rounded">{bundle.courses?.length || 0}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {bundle.courses?.map((course, idx) => (
                                                                <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-mono text-slate-400">{idx + 1}</div>
                                                                        <span className="text-sm font-medium text-blue-100 line-clamp-1">{course.title}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!bundle.courses || bundle.courses.length === 0) && <div className="text-sm text-slate-500 italic text-center py-4">No courses added yet.</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                            <div className="w-16 h-16 rounded-full bg-corp-cyan/10 flex items-center justify-center mb-4"><Package size={32} className="text-corp-cyan opacity-50" /></div>
                                            <h3 className="text-xl font-bold text-white mb-2">No Bundles Found</h3>
                                            <p className="text-slate-400">Create a bundle to group related courses.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // ... existing Bundle Editor ...
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-black text-white">{editingBundle ? 'Edit Bundle' : 'New Bundle'}</h2>
                                        <button onClick={() => setBundleView('list')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                        {/* AI Architect Panel */}
                                        <div className="bg-gradient-to-br from-corp-royal/20 to-corp-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><Wand2 size={64} /></div>
                                            <h3 className="text-sm font-black text-corp-cyan uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles size={16} /> AI Architect</h3>
                                            <div className="flex gap-2">
                                                <input
                                                    value={bundleTopic}
                                                    onChange={(e) => setBundleTopic(e.target.value)}
                                                    placeholder="Describe the bundle (e.g. 'Advanced marketing analytics path for senior analysts')..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-corp-cyan outline-none transition-colors"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateBundleMetadata()}
                                                />
                                                <button
                                                    onClick={handleGenerateBundleMetadata}
                                                    disabled={isGeneratingBundle || !bundleTopic.trim()}
                                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isGeneratingBundle ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                                    Generate
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metadata Form */}
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Title</label>
                                                <input
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan/20 outline-none transition-all placeholder:text-slate-600 font-bold"
                                                    value={newBundleData.title}
                                                    onChange={e => setNewBundleData({ ...newBundleData, title: e.target.value })}
                                                    placeholder="e.g. Full Stack Data Science"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                                                <textarea
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-corp-cyan outline-none h-24 resize-none transition-all placeholder:text-slate-600 leading-relaxed text-sm"
                                                    value={newBundleData.description}
                                                    onChange={e => setNewBundleData({ ...newBundleData, description: e.target.value })}
                                                    placeholder="Describe the learning outcomes..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Target Role</label>
                                                    <input
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-corp-cyan outline-none transition-all placeholder:text-slate-600 text-sm"
                                                        value={newBundleData.target_role}
                                                        onChange={e => setNewBundleData({ ...newBundleData, target_role: e.target.value })}
                                                        placeholder="e.g. Senior Analyst"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Industry</label>
                                                    <input
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-corp-cyan outline-none transition-all placeholder:text-slate-600 text-sm"
                                                        value={newBundleData.industry}
                                                        onChange={e => setNewBundleData({ ...newBundleData, industry: e.target.value })}
                                                        placeholder="e.g. Finance"
                                                    />
                                                </div>
                                            </div>

                                            {/* Publish Toggle */}
                                            <div className="flex items-center gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setNewBundleData({ ...newBundleData, is_published: !newBundleData.is_published })}
                                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${newBundleData.is_published ? 'bg-green-500' : 'bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${newBundleData.is_published ? 'left-7' : 'left-1'}`}></div>
                                                </button>
                                                <span className="text-sm font-bold text-white">Publish to Catalog</span>
                                            </div>
                                        </div>

                                        {/* Course Selection */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                    <Layers size={16} /> Select Courses
                                                </h3>
                                                <span className="text-xs text-slate-400">Selected: {bundleSelectedCourses.length}</span>
                                            </div>

                                            <div className="space-y-2">
                                                {courses.map(course => {
                                                    const isSelected = bundleSelectedCourses.some(c => c.id === course.id);
                                                    return (
                                                        <button
                                                            key={course.id}
                                                            onClick={() => handleToggleCourseSelection(course)}
                                                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${isSelected
                                                                    ? 'bg-corp-blue/20 border-corp-cyan/50 shadow-sm'
                                                                    : 'bg-black/20 border-white/5 hover:bg-black/30 hover:border-white/10'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-corp-cyan border-corp-cyan text-corp-dark' : 'border-slate-500 text-transparent group-hover:border-slate-400'
                                                                    }`}>
                                                                    <Check size={14} />
                                                                </div>
                                                                <div>
                                                                    <div className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>{course.title}</div>
                                                                    <div className="text-[10px] text-slate-500">{course.industry}</div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {courses.length === 0 && <div className="text-center py-4 text-slate-500 text-sm">No available courses found.</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-6 mt-2 border-t border-white/10">
                                        <button
                                            onClick={handleSaveBundle}
                                            disabled={!newBundleData.title}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            {editingBundle ? 'Update Bundle' : 'Save Bundle'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: COURSES */}
                    {activeTab === 'courses' && (
                        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                            {courseStep === 'list' && (
                                <>
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <h1 className="text-4xl font-black mb-2 tracking-tight">Course Architect</h1>
                                            <p className="text-blue-200">Manage and deploy industry-specific learning paths.</p>
                                        </div>
                                        <button onClick={() => {
                                            setCourseStep('setup');
                                            setCourseInput({ title: '', industry: '', role: '', level: 'Foundational', context: '' });
                                            setActiveCourseId(null);
                                            setModules([]);
                                            setSetupMode('manual');
                                            setUploadedFileName('');
                                        }} className="bg-gradient-to-r from-corp-cyan to-corp-royal hover:shadow-lg hover:shadow-corp-cyan/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                            <Plus size={18} /> Create New Path
                                        </button>
                                    </div>
                                    {/* Course List */}
                                    {courses.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                            {courses.map(course => (
                                                <div key={course.id} className="glass-panel rounded-2xl p-6 hover:border-corp-cyan/50 transition-all group relative flex flex-col h-full cursor-default">
                                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete course?')) { await deleteCourse(course.id); loadCourses(); } }} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"> <Trash2 size={14} /> </button>
                                                    </div>
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-black text-corp-cyan bg-corp-cyan/10 px-2 py-1 rounded uppercase tracking-widest border border-corp-cyan/20">{course.industry}</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${course.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>{course.status}</span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white leading-tight mb-2">{course.title}</h3>
                                                        <p className="text-sm text-slate-400 line-clamp-2">{course.main_context}</p>
                                                    </div>
                                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Role</span>
                                                            <span className="text-xs text-blue-200 font-medium">{course.target_role}</span>
                                                        </div>
                                                        <button onClick={() => handleResumeCourse(course)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-white/10">Manage <ArrowRight size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                            <div className="w-16 h-16 rounded-full bg-corp-cyan/10 flex items-center justify-center mb-4"><Layers size={32} className="text-corp-cyan opacity-50" /></div>
                                            <h3 className="text-xl font-bold text-white mb-2">No Courses Found</h3>
                                            <p className="text-slate-400">Initialize your first curriculum to get started.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {courseStep !== 'list' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <button onClick={() => setCourseStep('list')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"><X size={18} /> Cancel</button>
                                    </div>
                                    <StepsIndicator />
                                    {courseStep === 'setup' && (
                                        <div className="max-w-3xl mx-auto glass-panel p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/10">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-corp-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
                                            <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2">Initialize Course DNA</h2><p className="text-blue-200">Define the core parameters. The AI Architect will use this to structure the curriculum.</p></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="col-span-2"><label className="text-xs font-bold text-corp-cyan uppercase tracking-wider mb-2 block ml-1">Course Title</label><div className="relative"><Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none transition-all placeholder:text-slate-600 font-bold" value={courseInput.title} onChange={e => setCourseInput({ ...courseInput, title: e.target.value })} placeholder="e.g. Advanced Financial Analytics" /></div></div>
                                                <div><label className="text-xs font-bold text-corp-cyan uppercase tracking-wider mb-2 block ml-1">Industry Domain</label><div className="relative"><Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none transition-all placeholder:text-slate-600" value={courseInput.industry} onChange={e => setCourseInput({ ...courseInput, industry: e.target.value })} placeholder="e.g. Finance" /></div></div>
                                                <div><label className="text-xs font-bold text-corp-cyan uppercase tracking-wider mb-2 block ml-1">Target Role</label><div className="relative"><Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none transition-all placeholder:text-slate-600" value={courseInput.role} onChange={e => setCourseInput({ ...courseInput, role: e.target.value })} placeholder="e.g. Senior Analyst" /></div></div>
                                                <div className="col-span-2"><label className="text-xs font-bold text-corp-cyan uppercase tracking-wider mb-2 block ml-1">Complexity Level</label><div className="grid grid-cols-3 gap-4">{['Foundational', 'Practical', 'Advanced'].map(lvl => (<button key={lvl} onClick={() => setCourseInput({ ...courseInput, level: lvl })} className={`py-3 rounded-xl border font-bold text-sm transition-all ${courseInput.level === lvl ? 'bg-corp-cyan/20 border-corp-cyan text-white shadow-[0_0_15px_rgba(0,164,239,0.2)]' : 'bg-black/30 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white'}`}>{lvl}</button>))}</div></div>
                                            </div>

                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-4 bg-black/20 p-1 rounded-lg w-fit border border-white/5">
                                                    <button
                                                        onClick={() => setSetupMode('manual')}
                                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${setupMode === 'manual' ? 'bg-corp-cyan text-corp-dark' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        Manual Input
                                                    </button>
                                                    <button
                                                        onClick={() => setSetupMode('upload')}
                                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${setupMode === 'upload' ? 'bg-corp-cyan text-corp-dark' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        Document Upload
                                                    </button>
                                                </div>

                                                {setupMode === 'manual' ? (
                                                    <>
                                                        <label className="text-xs font-bold text-corp-cyan uppercase tracking-wider mb-2 block ml-1">Context Prompt (Terminal)</label>
                                                        <div className="bg-black/40 border border-white/10 rounded-xl p-1">
                                                            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase"><Terminal size={10} /> Context_Input.txt</div>
                                                            <textarea className="w-full bg-transparent text-blue-100 px-4 py-3 text-base focus:outline-none min-h-[120px] font-mono leading-relaxed resize-none placeholder:text-slate-600" value={courseInput.context} onChange={e => setCourseInput({ ...courseInput, context: e.target.value })} placeholder="> Describe the specific topics, tools, and business problems this course should cover..." />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-corp-cyan/50 transition-colors bg-black/20 relative group">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.txt,.md,.pptx"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                            onChange={handleFileUpload}
                                                        />
                                                        <div className="flex flex-col items-center justify-center gap-4 relative z-10 pointer-events-none">
                                                            {isReadingFile ? (
                                                                <Loader2 size={40} className="text-corp-cyan animate-spin" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-corp-cyan group-hover:bg-corp-cyan/10 transition-colors">
                                                                    <Upload size={24} />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <h4 className="text-sm font-bold text-white mb-1">
                                                                    {uploadedFileName ? uploadedFileName : "Upload Syllabus / Curriculum"}
                                                                </h4>
                                                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                                                    {isReadingFile ? "Extracting content..." : "Drag & drop PDF, Markdown, or Text file to auto-populate context."}
                                                                </p>
                                                            </div>

                                                            {uploadedFileName && !isReadingFile && (
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                                                    <CheckCircle size={12} /> Ready to parse
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={handleDraftOutline} disabled={isGenerating || isReadingFile} className="w-full py-4 bg-gradient-to-r from-corp-royal to-corp-cyan hover:shadow-lg hover:shadow-corp-cyan/20 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">{isGenerating ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />} Architect Course Structure</button>
                                        </div>
                                    )}
                                    {/* Outline Review Step - UPDATED for blended types */}
                                    {courseStep === 'outline_review' && (
                                        <div className="max-w-4xl mx-auto">
                                            <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2">Review Blueprint</h2><p className="text-blue-200">Reorder, edit, or refine the learning path before synthesis.</p></div>
                                            <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 relative overflow-hidden"><div className="absolute left-0 top-0 w-1 h-full bg-corp-cyan"></div><label className="text-xs font-bold text-corp-cyan uppercase mb-2 block flex items-center gap-2"><Sparkles size={14} /> Generated Scenario</label><textarea className="w-full bg-transparent border-none text-xl text-white focus:outline-none min-h-[80px] font-light leading-relaxed resize-none" value={courseInput.context} onChange={e => setCourseInput({ ...courseInput, context: e.target.value })} /></div>
                                            <div className="space-y-4 mb-10 relative"><div className="absolute left-8 top-4 bottom-4 w-px bg-white/10 z-0 border-l border-dashed border-slate-600"></div>{modules.map((item, idx) => (
                                                <div key={idx} className={`relative z-10 glass-panel border rounded-2xl p-5 flex gap-5 group transition-all duration-200 ${draggedIndex === idx ? 'border-corp-cyan bg-corp-cyan/10 scale-[1.02] shadow-xl' : 'border-white/10 hover:border-white/30 bg-corp-dark'}`} draggable={true} onDragStart={(e) => handleDragStart(e, idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={(e) => handleDrop(e, idx)}>
                                                    <div className="flex flex-col items-center gap-3 pt-1 text-slate-500 cursor-move hover:text-white transition-colors"><div className="w-8 h-8 rounded-full bg-corp-dark border border-white/10 flex items-center justify-center font-mono font-bold text-sm shadow-md z-10 text-corp-cyan">{idx + 1}</div><GripVertical size={20} className="opacity-50" /></div>
                                                    <div className="flex-1">
                                                        {editingModuleIndex === idx ? (
                                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><label className="text-[10px] uppercase font-bold text-corp-cyan mb-1 block">Title</label><input className="w-full bg-black/20 border-b border-white/20 px-2 py-2 text-base text-white focus:border-corp-cyan outline-none transition-colors" value={item.title} onChange={e => updateModuleField(idx, 'title', e.target.value)} /></div>
                                                                    <div><label className="text-[10px] uppercase font-bold text-corp-cyan mb-1 block">Skill Focus</label><input className="w-full bg-black/20 border-b border-white/20 px-2 py-2 text-base text-white focus:border-corp-cyan outline-none transition-colors" value={item.skill_focus} onChange={e => updateModuleField(idx, 'skill_focus', e.target.value)} /></div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[10px] uppercase font-bold text-corp-cyan mb-1 block">Challenge Type</label>
                                                                        <select
                                                                            className="w-full bg-black/20 border-b border-white/20 px-2 py-2 text-base text-white focus:border-corp-cyan outline-none transition-colors appearance-none"
                                                                            value={item.moduleType || 'sql'}
                                                                            onChange={e => updateModuleField(idx, 'moduleType', e.target.value)}
                                                                        >
                                                                            <option value="sql">Standard SQL Task</option>
                                                                            <option value="mcq">Multiple Choice (MCQ)</option>
                                                                            <option value="debug">Debugging Task</option>
                                                                            <option value="completion">Code Completion</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div><label className="text-[10px] uppercase font-bold text-corp-cyan mb-1 block">Task Description</label><textarea className="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-base text-white focus:border-corp-cyan outline-none min-h-[80px]" value={item.task_description} onChange={e => updateModuleField(idx, 'task_description', e.target.value)} /></div>
                                                                <div className="mt-3 p-3 bg-corp-blue/20 rounded-lg border border-corp-cyan/20"><label className="text-[10px] font-bold text-corp-cyan uppercase mb-2 flex items-center gap-1"><Sparkles size={12} /> AI Assist</label><div className="flex gap-2"><input className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-lg text-white focus:border-corp-cyan outline-none placeholder:text-slate-500" placeholder="e.g., 'Split into 2 lessons', 'Make it harder', 'Focus on joins'" value={aiModulePrompt} onChange={e => setAiModulePrompt(e.target.value)} /><button onClick={() => handleRefineModule(idx)} disabled={isRefining || !aiModulePrompt.trim()} className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-xs font-bold flex items-center gap-2 border border-purple-500/30 transition-colors disabled:opacity-50">{isRefining ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />} Apply</button></div></div><div className="flex justify-end pt-2"><button onClick={() => setEditingModuleIndex(null)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold text-white flex items-center gap-2"><Check size={14} /> Done</button></div></div>) : (<><div className="flex justify-between items-start mb-2"><h3 className="font-bold text-white text-lg">{item.title}</h3><div className="flex gap-2 text-xs"><span className={`px-2 py-0.5 border rounded-full ${item.moduleType === 'mcq' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : item.moduleType === 'debug' ? 'bg-red-500/10 border-red-500/20 text-red-300' : item.moduleType === 'completion' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>{item.moduleType ? item.moduleType.toUpperCase() : 'SQL'}</span><span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-full">{item.skill_focus}</span></div></div><p className="text-base text-slate-400 mb-3 leading-relaxed">{item.task_description}</p><div className="flex items-center gap-4 text-xs font-mono text-slate-500"><span className="flex items-center gap-1"><Target size={12} /> {item.expected_outcome.substring(0, 30)}...</span><span className="flex items-center gap-1"><Clock size={12} /> {item.estimated_time}</span></div></>)}</div>{editingModuleIndex !== idx && (<div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingModuleIndex(idx)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-corp-cyan hover:text-white transition-colors border border-white/5" title="Edit"><Edit3 size={16} /></button><button onClick={() => removeModule(idx)} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors border border-white/5" title="Remove"><Trash2 size={16} /></button></div>)}</div>))}
                                                <button onClick={addModule} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-corp-cyan/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-corp-cyan hover:bg-corp-cyan/5 transition-all font-bold text-sm relative z-10"><Plus size={18} /> Add Module Node</button>
                                            </div>
                                            <div className="flex justify-between items-center bg-corp-dark p-6 rounded-2xl border border-white/10 shadow-lg sticky bottom-6 z-20"><p className="text-sm text-slate-400 font-medium">Ready to compile?</p><button onClick={handleSaveOutline} className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:shadow-lg hover:shadow-green-500/20 rounded-xl font-bold text-white flex items-center gap-2 transition-all transform hover:-translate-y-0.5"><Save size={18} /> Approve & Compile</button></div>
                                        </div>
                                    )}
                                    {courseStep === 'generating' && (
                                        <div className="max-w-3xl mx-auto py-10">
                                            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden"><div className="absolute inset-0 bg-corp-cyan/5 animate-pulse"></div><div className="relative z-10"><div className="w-20 h-20 mx-auto bg-corp-dark rounded-2xl flex items-center justify-center border border-corp-cyan/30 shadow-[0_0_30px_rgba(0,164,239,0.3)] mb-6"><Loader2 size={40} className="text-corp-cyan animate-spin" /></div><h3 className="text-2xl font-black text-white mb-2">Synthesizing Course Content</h3><p className="text-blue-200 mb-8">AI Agents are generating schemas, data, and validation logic...</p><div className="w-full h-3 bg-black/30 rounded-full overflow-hidden mb-8 border border-white/5"><div className="h-full bg-gradient-to-r from-corp-royal to-corp-cyan transition-all duration-500 ease-out" style={{ width: `${generationProgress}%` }}></div></div><div className="bg-black/60 rounded-xl border border-white/10 p-4 font-mono text-xs text-left h-48 overflow-y-auto custom-scrollbar shadow-inner">{generationLog.length === 0 && <span className="text-slate-500 animate-pulse">{'>'} Initializing build pipeline...</span>}{generationLog.map((log, i) => (<div key={i} className="text-green-400 mb-1 flex gap-2"><span className="opacity-50 select-none">{(i + 1).toString().padStart(2, '0')}</span><span>{log}</span></div>))}<div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} /></div></div></div><div className="mt-8 text-center"><button onClick={handleGenerateContent} className="px-6 py-2 bg-white/5 rounded-lg text-xs text-slate-500 hover:text-white transition-colors">Force Retry (Debug)</button></div>
                                        </div>
                                    )}
                                    {courseStep === 'preview' && (
                                        <div className="max-w-4xl mx-auto">
                                            <div className="text-center mb-10"><div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-4 shadow-[0_0_20px_rgba(74,222,128,0.2)]"><CheckCircle size={32} /></div><h2 className="text-4xl font-black text-white mb-2">Systems Nominal</h2><p className="text-blue-200">Content generated and verified. Ready for deployment.</p></div>

                                            {/* Content Editor Panel */}
                                            {editingContentId && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                                    <div className="bg-corp-dark w-full max-w-4xl h-[85vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
                                                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                                                            <h3 className="font-bold text-white flex items-center gap-2"><Edit3 size={16} /> JSON Editor</h3>
                                                            <button onClick={() => setEditingContentId(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={18} /></button>
                                                        </div>
                                                        <div className="flex-1 flex overflow-hidden">
                                                            <div className="flex-1 p-0 relative">
                                                                <textarea
                                                                    className="w-full h-full bg-[#0d1117] text-blue-100 font-mono text-xs p-4 focus:outline-none resize-none"
                                                                    value={jsonEditorContent}
                                                                    onChange={(e) => setJsonEditorContent(e.target.value)}
                                                                    spellCheck={false}
                                                                />
                                                            </div>
                                                            <div className="w-80 bg-black/20 border-l border-white/10 p-4 flex flex-col gap-4">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">AI Refinement</label>
                                                                    <textarea
                                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-24 focus:border-corp-cyan outline-none resize-none"
                                                                        placeholder="e.g. 'Add a hint to the task', 'Change correct answer to B', 'Make SQL harder'"
                                                                        value={aiRefinePrompt}
                                                                        onChange={(e) => setAiRefinePrompt(e.target.value)}
                                                                    />
                                                                    <button
                                                                        onClick={handleRefineContent}
                                                                        disabled={isRefiningContent || !aiRefinePrompt.trim()}
                                                                        className="w-full mt-2 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                                                    >
                                                                        {isRefiningContent ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Apply AI
                                                                    </button>
                                                                </div>
                                                                <div className="mt-auto">
                                                                    <button
                                                                        onClick={handleSaveContent}
                                                                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg"
                                                                    >
                                                                        Save Changes
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                                {courses.find(c => c.id === activeCourseId)?.modules?.map((mod, idx) => {
                                                    const type = (mod.challenge_json as any)?.type || 'sql';
                                                    const Icon = type === 'mcq' ? ListChecks : type === 'debug' ? Bug : type === 'completion' ? Code : Database;
                                                    return (
                                                        <div key={idx} onClick={() => mod.id && openContentEditor(mod.id)} className="glass-panel p-5 rounded-xl border border-white/10 flex items-start gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-corp-cyan font-bold text-xs shrink-0 border ${type === 'mcq' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : type === 'debug' ? 'bg-red-500/10 border-red-500/30 text-red-400' : type === 'completion' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-corp-royal/20 border-corp-royal/30'}`}>
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h4 className="font-bold text-white truncate pr-2 group-hover:text-corp-cyan transition-colors">{mod.title}</h4>
                                                                    {mod.challenge_json ? (<div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>) : (<div className="w-2 h-2 rounded-full bg-red-400"></div>)}
                                                                </div>
                                                                <p className="text-xs text-slate-400 line-clamp-1">{mod.task_description}</p>
                                                                <div className="mt-2 flex gap-2">
                                                                    <span className="text-[10px] font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded border border-white/5">{type.toUpperCase()}</span>
                                                                </div>
                                                            </div>
                                                            <Edit3 size={14} className="opacity-0 group-hover:opacity-50 text-white mt-1" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-center gap-4 border-t border-white/10 pt-8"><button onClick={() => setCourseStep('list')} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors">Save as Draft & Close</button><button onClick={() => setCourseStep('outline_review')} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white flex items-center gap-2 transition-colors"><Edit3 size={18} /> Modify Structure</button><button onClick={handlePublish} className="px-10 py-3 bg-gradient-to-r from-corp-cyan to-corp-royal hover:shadow-[0_0_30px_rgba(0,164,239,0.4)] rounded-xl font-black text-white flex items-center gap-2 transition-all transform hover:-translate-y-1"><Zap size={20} className="fill-white" />{courses.find(c => c.id === activeCourseId)?.status === 'published' ? 'Redeploy Course' : 'Publish Live'}</button></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                            <div className="flex justify-between items-center"><h1 className="text-3xl font-black">Content Library</h1><button onClick={() => setActiveTab('create')} className="bg-corp-cyan hover:bg-cyan-400 text-corp-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"><Wand2 size={16} /> Create New</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{savedChallenges.length > 0 ? savedChallenges.map((challenge) => (<div key={challenge.id} className="glass-panel border border-white/10 rounded-2xl p-6 hover:border-corp-cyan/30 transition-all group"><div className="flex justify-between items-start mb-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${challenge.is_published ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>{challenge.is_published ? 'Published' : 'Draft'}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={async () => { await toggleChallengePublish(challenge.id, challenge.is_published); loadContent(); }} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Toggle Publish">{challenge.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}</button><button onClick={async () => { if (confirm('Delete this challenge?')) { await deleteSavedChallenge(challenge.id); loadContent(); } }} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button></div></div><h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{challenge.title}</h3><div className="text-xs text-slate-400 mb-4 font-mono">{challenge.industry} • {challenge.difficulty}</div><p className="text-sm text-blue-200 line-clamp-3 mb-4">{challenge.topic}</p><div className="text-xs text-slate-500 pt-4 border-t border-white/5 flex justify-between"><span>ID: {challenge.id}</span><span>{new Date(challenge.created_at).toLocaleDateString()}</span></div></div>)) : (<div className="col-span-3 text-center text-slate-500 py-12">No challenges in library. Use AI Studio to create one.</div>)}</div>
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full relative z-10">
                            <div className="space-y-6"><div><h1 className="text-3xl font-black mb-2">AI Studio</h1><p className="text-blue-200 text-sm">Design new learning modules with Gemini.</p></div><div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl"><div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Skill Focus</label><input className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-corp-cyan outline-none transition-colors" value={createTopic} onChange={(e) => setCreateTopic(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Industry</label><input className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-corp-cyan outline-none transition-colors" value={createIndustry} onChange={(e) => setCreateIndustry(e.target.value)} /></div><div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Difficulty</label><select className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-corp-cyan outline-none appearance-none transition-colors" value={createDiff} onChange={(e) => setCreateDiff(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div></div><div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Context / Scenario Idea</label><textarea className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-corp-cyan outline-none min-h-[100px] transition-colors" value={createContext} onChange={(e) => setCreateContext(e.target.value)} /></div><button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-corp-royal to-corp-cyan rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">{isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} Generate Concept</button></div></div><div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col h-full overflow-hidden shadow-inner"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-300">Preview Output</h3>{generatedChallenge && (<button onClick={handleSave} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors"><Save size={12} /> Save</button>)}</div><div className="flex-1 bg-black/40 rounded-xl p-4 overflow-auto font-mono text-xs text-blue-200 border border-white/5 custom-scrollbar">{isGenerating ? (<div className="h-full flex flex-col items-center justify-center text-corp-cyan opacity-70"><Loader2 size={32} className="animate-spin mb-4" /><p>Architecting challenge...</p></div>) : generatedChallenge ? (<pre className="whitespace-pre-wrap">{JSON.stringify(generatedChallenge, null, 2)}</pre>) : (<div className="h-full flex items-center justify-center text-slate-600 italic">Waiting for generation...</div>)}</div></div>
                        </div>
                    )}

                    {activeTab === 'learners' && (
                        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3"><Users size={32} className="text-corp-cyan" /> Learner Management</h1>
                                    <p className="text-blue-200">Monitor engagement, track progress, and manage subscription tiers.</p>
                                </div>
                                <div className="relative group w-full md:w-auto">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-corp-cyan transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="w-full md:w-80 bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-corp-cyan/50 focus:ring-1 focus:ring-corp-cyan/20 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="bg-corp-dark/50 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-black/30 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th className="px-8 py-5 border-b border-white/5">User Profile</th>
                                            <th className="px-6 py-5 border-b border-white/5">Current Plan</th>
                                            <th className="px-6 py-5 border-b border-white/5 text-center">XP Earned</th>
                                            <th className="px-6 py-5 border-b border-white/5 text-center">Streak</th>
                                            <th className="px-6 py-5 border-b border-white/5">Last Active</th>
                                            <th className="px-8 py-5 border-b border-white/5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-3 text-corp-cyan" size={32} /> Loading learner database...</td></tr>
                                        ) : filteredLearners.length > 0 ? (
                                            filteredLearners.map((learner) => (
                                                <tr key={learner.id} className="hover:bg-gradient-to-r from-white/5 to-transparent transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-corp-cyan to-corp-royal flex items-center justify-center font-bold text-sm shadow-lg border border-white/10">
                                                                {(learner.username || 'U').substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-base leading-tight">{learner.username || 'Unknown User'}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{learner.id.slice(0, 8)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border ${learner.subscription_plan?.includes('pro') ? 'bg-corp-orange/10 text-corp-orange border-corp-orange/20' :
                                                                learner.subscription_plan?.includes('basic') ? 'bg-corp-cyan/10 text-corp-cyan border-corp-cyan/20' : 'bg-white/5 text-slate-400 border-white/10'
                                                            }`}>
                                                            {learner.subscription_plan?.includes('pro') ? <Crown size={12} className="fill-current" /> :
                                                                learner.subscription_plan?.includes('basic') ? <Zap size={12} className="fill-current" /> : <Shield size={12} />}
                                                            {learner.subscription_plan || 'Free'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="inline-flex items-center gap-2 text-corp-cyan font-mono font-bold bg-corp-cyan/5 px-3 py-1 rounded-full border border-corp-cyan/10">
                                                            <Trophy size={12} /> {learner.total_xp?.toLocaleString() || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="inline-flex items-center gap-1 text-orange-400 font-bold">
                                                            {learner.streak > 0 ? <Flame size={16} className="fill-orange-400" /> : <Flame size={16} className="text-slate-600" />}
                                                            {learner.streak || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-slate-400 text-xs font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-slate-600" />
                                                            {learner.last_active ? new Date(learner.last_active).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setEditingLearnerId(learner.id);
                                                                setTempPlan(learner.subscription_plan || 'free');
                                                            }}
                                                            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-corp-cyan/30 hover:text-corp-cyan px-4 py-2 rounded-lg text-white font-bold transition-all shadow-sm flex items-center gap-2 ml-auto"
                                                        >
                                                            <Edit3 size={12} /> Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-500 italic">No learners found matching your filter.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscriptions' && (
                        <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-corp-dark/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl"><div><h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><CreditCard size={32} className="text-corp-cyan" /> Subscription Strategy</h1><p className="text-blue-200 text-sm max-w-xl">Configure global pricing tiers. Changes reflect immediately across the platform for new sessions.</p></div><button onClick={handleSavePlanSettings} disabled={isSavingSettings} className={`group relative px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden ${isSavingSettings ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-emerald-500/30'}`}><div className="relative z-10 flex items-center gap-3">{isSavingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}<span>{isSavingSettings ? 'Syncing...' : 'Publish Changes'}</span></div>{!isSavingSettings && <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out"></div>}</button></div><div className="grid md:grid-cols-2 gap-8"><div className="relative group"><div className="absolute inset-0 bg-gradient-to-br from-corp-cyan/20 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div><div className="relative bg-corp-dark border border-white/10 rounded-[2rem] p-8 h-full flex flex-col hover:border-corp-cyan/50 transition-colors duration-300 overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-corp-cyan/5 rounded-full blur-[80px] pointer-events-none"></div><div className="flex items-center justify-between mb-8 relative z-10"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-corp-cyan/10 border border-corp-cyan/20 flex items-center justify-center text-corp-cyan shadow-[0_0_20px_rgba(0,164,239,0.15)]"><Zap size={28} className="fill-current" /></div><div><h3 className="text-2xl font-black text-white">Basic Tier</h3><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entry Level</span></div></div><div className="px-3 py-1 rounded-full bg-corp-cyan/10 border border-corp-cyan/20 text-corp-cyan text-[10px] font-bold uppercase tracking-widest">Active</div></div><div className="space-y-8 relative z-10"><div className="space-y-3"><label className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">Monthly Rate <span className="h-px flex-1 bg-white/10"></span></label><div className="relative group/input"><div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-slate-400 font-black text-lg border-r border-white/10 bg-black/20 rounded-l-xl transition-colors group-focus-within/input:text-corp-cyan group-focus-within/input:bg-corp-cyan/10 group-focus-within/input:border-corp-cyan/30">GHS</div><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl pl-20 pr-6 py-5 text-3xl font-black text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none transition-all font-mono placeholder:text-slate-700" value={planSettings?.basic.monthly ?? ''} onChange={e => { const val = parseInt(e.target.value); if (planSettings) setPlanSettings({ ...planSettings, basic: { ...planSettings.basic, monthly: isNaN(val) ? 0 : val } }) }} /></div></div><div className="space-y-3"><label className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">Annual Rate <span className="h-px flex-1 bg-white/10"></span></label><div className="relative group/input"><div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-slate-400 font-black text-lg border-r border-white/10 bg-black/20 rounded-l-xl transition-colors group-focus-within/input:text-corp-cyan group-focus-within/input:bg-corp-cyan/10 group-focus-within/input:border-corp-cyan/30">GHS</div><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl pl-20 pr-6 py-5 text-3xl font-black text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none transition-all font-mono placeholder:text-slate-700" value={planSettings?.basic.annual ?? ''} onChange={e => { const val = parseInt(e.target.value); if (planSettings) setPlanSettings({ ...planSettings, basic: { ...planSettings.basic, annual: isNaN(val) ? 0 : val } }) }} /></div></div></div></div></div><div className="relative group"><div className="absolute inset-0 bg-gradient-to-br from-corp-orange/20 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div><div className="relative bg-corp-dark border border-white/10 rounded-[2rem] p-8 h-full flex flex-col hover:border-corp-orange/50 transition-colors duration-300 overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-corp-orange/5 rounded-full blur-[80px] pointer-events-none"></div><div className="flex items-center justify-between mb-8 relative z-10"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-corp-orange/10 border border-corp-orange/20 flex items-center justify-center text-corp-orange shadow-[0_0_20px_rgba(255,153,51,0.15)]"><Crown size={28} className="fill-current" /></div><div><h3 className="text-2xl font-black text-white">Pro Tier</h3><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Premium Access</span></div></div><div className="px-3 py-1 rounded-full bg-corp-orange/10 border border-corp-orange/20 text-corp-orange text-[10px] font-bold uppercase tracking-widest">Active</div></div><div className="space-y-8 relative z-10"><div className="space-y-3"><label className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">Monthly Rate <span className="h-px flex-1 bg-white/10"></span></label><div className="relative group/input"><div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-slate-400 font-black text-lg border-r border-white/10 bg-black/20 rounded-l-xl transition-colors group-focus-within/input:text-corp-orange group-focus-within/input:bg-corp-orange/10 group-focus-within/input:border-corp-orange/30">GHS</div><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl pl-20 pr-6 py-5 text-3xl font-black text-white focus:border-corp-orange focus:ring-1 focus:ring-corp-orange outline-none transition-all font-mono placeholder:text-slate-700" value={planSettings?.pro.monthly ?? ''} onChange={e => { const val = parseInt(e.target.value); if (planSettings) setPlanSettings({ ...planSettings, pro: { ...planSettings.pro, monthly: isNaN(val) ? 0 : val } }) }} /></div></div><div className="space-y-3"><label className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">Annual Rate <span className="h-px flex-1 bg-white/10"></span></label><div className="relative group/input"><div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-slate-400 font-black text-lg border-r border-white/10 bg-black/20 rounded-l-xl transition-colors group-focus-within/input:text-corp-orange group-focus-within/input:bg-corp-orange/10 group-focus-within/input:border-corp-orange/30">GHS</div><input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl pl-20 pr-6 py-5 text-3xl font-black text-white focus:border-corp-orange focus:ring-1 focus:ring-corp-orange outline-none transition-all font-mono placeholder:text-slate-700" value={planSettings?.pro.annual ?? ''} onChange={e => { const val = parseInt(e.target.value); if (planSettings) setPlanSettings({ ...planSettings, pro: { ...planSettings.pro, annual: isNaN(val) ? 0 : val } }) }} /></div></div></div></div></div></div>
                        </div>
                    )}

                </main>
            </div>

            {editingLearnerId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-corp-dark border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-corp-cyan/10 rounded-full blur-[60px]"></div>
                        <h3 className="text-xl font-bold text-white mb-6">Modify Learner Subscription</h3>
                        <div className="space-y-3 mb-8">
                            {['free', 'basic_monthly', 'basic_annual', 'pro_monthly', 'pro_annual'].map(plan => (
                                <label key={plan} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${tempPlan === plan ? 'bg-corp-cyan/20 border-corp-cyan text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={plan}
                                        checked={tempPlan === plan}
                                        onChange={(e) => setTempPlan(e.target.value)}
                                        className="hidden"
                                    />
                                    <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${tempPlan === plan ? 'border-corp-cyan' : 'border-slate-500'}`}>
                                        {tempPlan === plan && <div className="w-2 h-2 bg-corp-cyan rounded-full"></div>}
                                    </div>
                                    <span className="font-medium text-sm capitalize">{plan.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingLearnerId(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleUpdateLearnerPlan} disabled={isUpdatingPlan} className="px-6 py-2 rounded-lg bg-corp-cyan hover:bg-cyan-400 text-corp-dark font-bold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
                                {isUpdatingPlan ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
