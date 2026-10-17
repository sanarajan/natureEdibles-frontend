import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    Calendar, Clock, Copy, Repeat, AlertCircle, CheckCircle2, 
    Info, Utensils, Droplets, Activity, FileText, ChevronRight, ChevronLeft
} from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import Swal from 'sweetalert2';
import { 
    calculateSubscriptionEndDate, 
    formatDateToYYYYMMDD, 
    generateSchedule, 
    hasDietContent, 
    parseDateOnly 
} from '../../../utils/subscriptionUtils';
import type { IDietDaySchedule, IDietMeals } from '../../../utils/subscriptionUtils';

interface DietPlanSection {
    sequence: number;
    label: string;
    description: string;
}

interface AdminDietPlanFormProps {
    consultation: any;
    onClose: () => void;
}

const DURATION_OPTIONS = [1, 2, 3, 6];

const AdminDietPlanForm: React.FC<AdminDietPlanFormProps> = ({ consultation, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [planId, setPlanId] = useState<string | null>(null);
    const [originalStartDate, setOriginalStartDate] = useState<string | null>(null);

    // Subscription & Display Settings
    const [durationMonths, setDurationMonths] = useState<number>(1);
    const [startDate, setStartDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
    const [visibilityDate, setVisibilityDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
    const [displayMode, setDisplayMode] = useState<'TODAY' | 'CURRENT_WEEK' | 'NEXT_7_DAYS'>('TODAY');
    const [advanceDays, setAdvanceDays] = useState<number>(1);

    // Schedule state: array of IDietDaySchedule
    const [schedule, setSchedule] = useState<IDietDaySchedule[]>([]);

    // Navigation state for Month -> Week -> Day
    const [selectedMonth, setSelectedMonth] = useState<number>(1);
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);

    // Copy action modal / controls state
    const [copyDayTargetIndex, setCopyDayTargetIndex] = useState<number | "">("");
    const [copyWeekTargetNum, setCopyWeekTargetNum] = useState<number | "">("");
    const [copyMonthTargetNum, setCopyMonthTargetNum] = useState<number | "">("");

    // Calculate End Date dynamically
    const calculatedEndDate = calculateSubscriptionEndDate(startDate, durationMonths);

    useEffect(() => {
        fetchExistingPlan();
    }, []);

    const fetchExistingPlan = async () => {
        try {
            const consultationId = consultation._id || consultation.id;
            const res = await adminApiClient.get(`/admin/diet-plan/consultation/${consultationId}`);
            
            if (res.data.success && res.data.data) {
                const plan = res.data.data;
                setPlanId(plan._id || plan.id);
                setOriginalStartDate(plan.originalStartDate || plan.startDate);

                const existingStart = plan.startDate ? formatDateToYYYYMMDD(parseDateOnly(plan.startDate)) : formatDateToYYYYMMDD(new Date());
                setStartDate(existingStart);

                const existingDuration = [1, 2, 3, 6].includes(plan.durationMonths) 
                    ? plan.durationMonths 
                    : (plan.durationType === 'months' && [1, 2, 3, 6].includes(plan.durationValue) ? plan.durationValue : 1);
                setDurationMonths(existingDuration);

                if (plan.visibilityDate) {
                    setVisibilityDate(formatDateToYYYYMMDD(parseDateOnly(plan.visibilityDate)));
                } else {
                    setVisibilityDate(existingStart);
                }

                if (['TODAY', 'CURRENT_WEEK', 'NEXT_7_DAYS'].includes(plan.displayMode)) {
                    setDisplayMode(plan.displayMode);
                }
                if (plan.advanceDays !== undefined) {
                    setAdvanceDays(Number(plan.advanceDays));
                }

                if (Array.isArray(plan.schedule) && plan.schedule.length > 0) {
                    const fullSchedule = generateSchedule(existingStart, existingDuration, plan.schedule);
                    setSchedule(fullSchedule);
                    if (fullSchedule.length > 0) {
                        setSelectedDayIndex(fullSchedule[0].dayIndex);
                    }
                } else {
                    // Initialize schedule for existing start and duration
                    const initial = generateSchedule(existingStart, existingDuration);
                    setSchedule(initial);
                }
            } else {
                // Initialize clean schedule for new subscription
                const initial = generateSchedule(startDate, 1);
                setSchedule(initial);
                if (initial.length > 0) {
                    setSelectedDayIndex(initial[0].dayIndex);
                }
            }
        } catch (error: any) {
            // New plan initialization fallback
            const initial = generateSchedule(startDate, 1);
            setSchedule(initial);
            if (initial.length > 0) {
                setSelectedDayIndex(initial[0].dayIndex);
            }
        } finally {
            setFetching(false);
        }
    };

    // When duration or start date changes, regenerate schedule structure while preserving entered meals
    const handleDurationChange = async (newMonths: number) => {
        if (newMonths === durationMonths) return;

        // If reducing duration and future months have content, confirm
        if (newMonths < durationMonths) {
            const hasContentInRemovedMonths = schedule.some(d => d.month > newMonths && hasDietContent(d));
            if (hasContentInRemovedMonths) {
                const result = await Swal.fire({
                    title: 'Reduce Duration?',
                    text: `Reducing the duration to ${newMonths} Month(s) will remove diet content beyond Month ${newMonths}. Continue?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, reduce duration',
                    cancelButtonText: 'Cancel'
                });
                if (!result.isConfirmed) return;
            }
        }

        setDurationMonths(newMonths);
        const updated = generateSchedule(startDate, newMonths, schedule);
        setSchedule(updated);

        // Adjust selected month/week if out of bounds
        if (selectedMonth > newMonths) {
            setSelectedMonth(1);
            setSelectedWeek(1);
            setSelectedDayIndex(1);
        }
    };

    const handleStartDateChange = (newDateStr: string) => {
        // Once diet content has been entered, prevent changing the subscription start date.
        // Explain that the start date must be finalized before entering the diet plan. Allow date selection before diet entry.
        if (schedule.some(hasDietContent)) {
            Swal.fire({
                title: 'Start Date Locked',
                text: 'Diet content has already been entered. The subscription start date must be finalized before entering the diet plan.',
                icon: 'warning',
                confirmButtonColor: '#22c55e',
                confirmButtonText: 'Understood'
            });
            return;
        }

        if (planId && originalStartDate) {
            const newDate = parseDateOnly(newDateStr);
            const origDate = parseDateOnly(originalStartDate);
            if (newDate < origDate) {
                toast.error('Edited Start Date cannot be earlier than the Original Start Date');
                return;
            }
        }

        setStartDate(newDateStr);

        // If visibility date was equal to previous start date or after new start date, update visibility date
        if (visibilityDate > newDateStr || visibilityDate === startDate) {
            setVisibilityDate(newDateStr);
        }

        const updated = generateSchedule(newDateStr, durationMonths, schedule);
        setSchedule(updated);
    };

    const handleVisibilityDateChange = (newVisStr: string) => {
        if (newVisStr > startDate) {
            toast.warning('Plan visibility date cannot be after the subscription start date.');
            return;
        }
        setVisibilityDate(newVisStr);
    };

    // Filter schedule for selected Month and Week
    const daysInSelectedMonth = schedule.filter(d => d.month === selectedMonth);
    const availableWeeksInMonth = Array.from(new Set(daysInSelectedMonth.map(d => d.week))).sort((a, b) => a - b);
    
    // Ensure selected week is valid within this month
    const effectiveWeek = availableWeeksInMonth.includes(selectedWeek) 
        ? selectedWeek 
        : (availableWeeksInMonth[0] || 1);

    const daysInSelectedWeek = daysInSelectedMonth.filter(d => d.week === effectiveWeek);
    
    // Ensure selected day is valid
    const currentSelectedDay = schedule.find(d => d.dayIndex === selectedDayIndex) 
        || daysInSelectedWeek[0] 
        || schedule[0];

    // Update meal fields for the currently selected day
    const handleMealChange = (field: keyof IDietMeals, value: string) => {
        if (!currentSelectedDay) return;
        setSchedule(prev => prev.map(d => {
            if (d.dayIndex === currentSelectedDay.dayIndex) {
                return {
                    ...d,
                    meals: {
                        ...d.meals,
                        [field]: value
                    }
                };
            }
            return d;
        }));
    };

    const handleNotesChange = (value: string) => {
        if (!currentSelectedDay) return;
        setSchedule(prev => prev.map(d => {
            if (d.dayIndex === currentSelectedDay.dayIndex) {
                return {
                    ...d,
                    notes: value
                };
            }
            return d;
        }));
    };

    // ==========================================
    // COPYING & REPEAT PATTERNS
    // ==========================================

    // 1. Repeat Week: Copy 7-day pattern of selected week to all other weeks in subscription
    const handleRepeatWeekAcrossAllWeeks = async () => {
        const sourceDays = daysInSelectedWeek;
        if (sourceDays.length === 0) {
            toast.error('No days found in the current week to repeat.');
            return;
        }

        if (!sourceDays.some(hasDietContent)) {
            toast.info(`Month ${selectedMonth}, Week ${effectiveWeek} does not have any diet content to repeat.`);
            return;
        }

        const otherDaysWithContent = schedule.filter(
            d => !(d.month === selectedMonth && d.week === effectiveWeek) && hasDietContent(d)
        );

        if (otherDaysWithContent.length > 0) {
            const confirm = await Swal.fire({
                title: 'Repeat Week Pattern?',
                text: `Other weeks already have diet entries. Do you want to overwrite them with the schedule of Month ${selectedMonth}, Week ${effectiveWeek}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, repeat week',
                cancelButtonText: 'Cancel'
            });
            if (!confirm.isConfirmed) return;
        }

        setSchedule(prev => prev.map(d => {
            if (d.month === selectedMonth && d.week === effectiveWeek) return d;
            // Find corresponding source day by dayOfWeek, falling back safely if source is partial week
            const match = sourceDays.find(sd => sd.dayOfWeek === d.dayOfWeek)
                || sourceDays[(d.dayOfWeek - 1) % sourceDays.length];
            if (match) {
                return {
                    ...d,
                    meals: { ...match.meals },
                    notes: match.notes
                };
            }
            return d;
        }));

        toast.success(`Week ${effectiveWeek} schedule repeated across all other weeks!`);
    };

    // 2. Repeat Month: Copy Month 1's schedule to all other months
    const handleRepeatMonthAcrossAllMonths = async () => {
        const sourceDays = schedule.filter(d => d.month === 1);
        if (sourceDays.length === 0) {
            toast.error('No days in Month 1 to copy.');
            return;
        }

        if (!sourceDays.some(hasDietContent)) {
            toast.info('Month 1 does not have any diet content to repeat.');
            return;
        }

        const otherMonthsWithContent = schedule.filter(d => d.month > 1 && hasDietContent(d));
        if (otherMonthsWithContent.length > 0) {
            const confirm = await Swal.fire({
                title: 'Repeat Month 1?',
                text: 'Subsequent months already have diet entries. Do you want to overwrite them with Month 1 schedule?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, repeat Month 1',
                cancelButtonText: 'Cancel'
            });
            if (!confirm.isConfirmed) return;
        }

        setSchedule(prev => prev.map(d => {
            if (d.month === 1) return d;
            // Robust position mapping:
            // 1. Map by day offset within month (Day 1..N of Month) so Week 3 maps directly to Week 3
            const targetMonthDays = prev.filter(x => x.month === d.month);
            const dayOffset = targetMonthDays.findIndex(x => x.dayIndex === d.dayIndex);
            
            const match = (dayOffset >= 0 && sourceDays[dayOffset])
                || sourceDays.find(sd => sd.week === d.week && sd.dayOfWeek === d.dayOfWeek)
                || sourceDays.find(sd => sd.dayOfWeek === d.dayOfWeek)
                || sourceDays[sourceDays.length - 1];

            if (match) {
                return {
                    ...d,
                    meals: { ...match.meals },
                    notes: match.notes
                };
            }
            return d;
        }));

        toast.success('Month 1 schedule repeated to all other months successfully!');
    };

    // 3. Copy Day to Another Day
    const handleCopyDay = async (targetDayIndex: number) => {
        if (!currentSelectedDay || targetDayIndex === currentSelectedDay.dayIndex) return;
        
        const targetDay = schedule.find(d => d.dayIndex === targetDayIndex);
        if (!targetDay) return;

        if (!hasDietContent(currentSelectedDay)) {
            toast.info(`${currentSelectedDay.label} does not have any diet content to copy.`);
            setCopyDayTargetIndex("");
            return;
        }

        if (hasDietContent(targetDay)) {
            const confirm = await Swal.fire({
                title: 'Overwrite Day Content?',
                text: `${targetDay.label} already has diet entries. Overwrite with content from ${currentSelectedDay.label}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#22c55e',
                cancelButtonColor: '#ef4444',
                confirmButtonText: 'Yes, Overwrite',
                cancelButtonText: 'Cancel'
            });
            if (!confirm.isConfirmed) {
                setCopyDayTargetIndex("");
                return;
            }
        }

        setSchedule(prev => prev.map(d => {
            if (d.dayIndex === targetDayIndex) {
                return {
                    ...d,
                    meals: { ...currentSelectedDay.meals },
                    notes: currentSelectedDay.notes
                };
            }
            return d;
        }));

        toast.success(`Copied to ${targetDay.label}!`);
        setCopyDayTargetIndex("");
    };

    // 4. Copy Week to Another Week (within or across months)
    const handleCopyWeek = async (targetWeekNum: number, targetMonthNum: number) => {
        const sourceDays = daysInSelectedWeek;
        const targetDays = schedule.filter(d => d.month === targetMonthNum && d.week === targetWeekNum);

        if (targetDays.length === 0) {
            toast.error(`Target Month ${targetMonthNum}, Week ${targetWeekNum} not found.`);
            setCopyWeekTargetNum("");
            return;
        }

        if (!sourceDays.some(hasDietContent)) {
            toast.info(`Month ${selectedMonth}, Week ${effectiveWeek} does not have any diet content to copy.`);
            setCopyWeekTargetNum("");
            return;
        }

        const hasContent = targetDays.some(d => hasDietContent(d));
        if (hasContent) {
            const confirm = await Swal.fire({
                title: 'Overwrite Week Content?',
                text: `Month ${targetMonthNum}, Week ${targetWeekNum} already has diet entries. Overwrite with Month ${selectedMonth}, Week ${effectiveWeek}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, Overwrite Week',
                cancelButtonText: 'Cancel'
            });
            if (!confirm.isConfirmed) {
                setCopyWeekTargetNum("");
                return;
            }
        }

        setSchedule(prev => prev.map(d => {
            if (d.month === targetMonthNum && d.week === targetWeekNum) {
                const dayIdxInTarget = targetDays.findIndex(x => x.dayIndex === d.dayIndex);
                const match = sourceDays.find(sd => sd.dayOfWeek === d.dayOfWeek)
                    || (dayIdxInTarget >= 0 ? sourceDays[dayIdxInTarget % sourceDays.length] : undefined)
                    || sourceDays[0];

                if (match) {
                    return {
                        ...d,
                        meals: { ...match.meals },
                        notes: match.notes
                    };
                }
            }
            return d;
        }));

        toast.success(`Week copied to Month ${targetMonthNum}, Week ${targetWeekNum}!`);
        setCopyWeekTargetNum("");
    };

    // 5. Copy Month to Another Month
    const handleCopyMonth = async (targetMonthNum: number) => {
        if (targetMonthNum === selectedMonth) return;
        const sourceDays = daysInSelectedMonth;
        const targetDays = schedule.filter(d => d.month === targetMonthNum);

        if (targetDays.length === 0) {
            toast.error(`Target Month ${targetMonthNum} not found.`);
            setCopyMonthTargetNum("");
            return;
        }

        if (!sourceDays.some(hasDietContent)) {
            toast.info(`Month ${selectedMonth} does not have any diet content to copy.`);
            setCopyMonthTargetNum("");
            return;
        }

        const hasContent = targetDays.some(d => hasDietContent(d));
        if (hasContent) {
            const confirm = await Swal.fire({
                title: 'Overwrite Month Content?',
                text: `Month ${targetMonthNum} already has diet entries. Overwrite with Month ${selectedMonth}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, Overwrite Month',
                cancelButtonText: 'Cancel'
            });
            if (!confirm.isConfirmed) {
                setCopyMonthTargetNum("");
                return;
            }
        }

        setSchedule(prev => prev.map(d => {
            if (d.month === targetMonthNum) {
                const dayOffset = targetDays.findIndex(x => x.dayIndex === d.dayIndex);
                const match = (dayOffset >= 0 && sourceDays[dayOffset])
                    || sourceDays.find(sd => sd.week === d.week && sd.dayOfWeek === d.dayOfWeek)
                    || sourceDays.find(sd => sd.dayOfWeek === d.dayOfWeek)
                    || sourceDays[sourceDays.length - 1];

                if (match) {
                    return {
                        ...d,
                        meals: { ...match.meals },
                        notes: match.notes
                    };
                }
            }
            return d;
        }));

        toast.success(`Month ${selectedMonth} copied to Month ${targetMonthNum}!`);
        setCopyMonthTargetNum("");
    };

    // ==========================================
    // FORM SUBMISSION
    // ==========================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (visibilityDate > startDate) {
            toast.error('Plan visibility date cannot be after the subscription start date');
            return;
        }

        if (planId && originalStartDate) {
            const newDate = parseDateOnly(startDate);
            const origDate = parseDateOnly(originalStartDate);
            if (newDate < origDate) {
                toast.error('Edited Start Date cannot be earlier than the Original Start Date');
                return;
            }
        }

        // Build backward-compatible sections summary
        const sections: DietPlanSection[] = [];
        for (let m = 1; m <= durationMonths; m++) {
            const monthDays = schedule.filter(d => d.month === m);
            const weeksInM = Array.from(new Set(monthDays.map(d => d.week))).sort((a, b) => a - b);
            weeksInM.forEach(w => {
                const wDays = monthDays.filter(d => d.week === w);
                const desc = wDays
                    .filter(d => hasDietContent(d))
                    .map(d => `${d.label}:\n- Breakfast: ${d.meals.breakfast || 'N/A'}\n- Lunch: ${d.meals.lunch || 'N/A'}\n- Dinner: ${d.meals.dinner || 'N/A'}`)
                    .join('\n\n');

                sections.push({
                    sequence: sections.length + 1,
                    label: `Month ${m} - Week ${w}`,
                    description: desc || 'Diet schedule configured.'
                });
            });
        }

        const payload = {
            consultationId: consultation._id || consultation.id,
            customerId: consultation.userId || consultation.customerId,
            durationMonths,
            durationType: 'months',
            durationValue: durationMonths,
            startDate,
            endDate: calculatedEndDate,
            visibilityDate,
            displayMode,
            advanceDays: Number(advanceDays) || 0,
            schedule,
            sections
        };

        setLoading(true);
        try {
            if (planId) {
                await adminApiClient.put(`/admin/diet-plan/${planId}`, payload);
                toast.success('Diet Plan subscription updated successfully');
            } else {
                await adminApiClient.post('/admin/diet-plan', payload);
                toast.success('Diet Plan subscription created successfully');
            }
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error saving diet plan');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="cancellation-reason-overlay" style={{ zIndex: 1200 }}>
                <div className="cancellation-reason-box admin-card p-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cancellation-reason-overlay" style={{ zIndex: 1200 }}>
            <div 
                className="cancellation-reason-box admin-card p-0" 
                style={{ 
                    maxWidth: '1050px', 
                    width: '95%', 
                    maxHeight: '92vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '20px',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-white">
                    <div>
                        <h5 className="fw-bold mb-0 text-dark">
                            {planId ? 'Edit Diet Plan Subscription' : 'Create Diet Plan Subscription'}
                        </h5>
                        <small className="text-muted">
                            Patient: <strong>{consultation.fullName || 'Customer'}</strong> • Consultation ID: {consultation._id?.slice(-6)}
                        </small>
                    </div>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                <div className="p-4 overflow-auto" style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                    <form onSubmit={handleSubmit} id="dietPlanSubscriptionForm">
                        
                        {/* 1. Subscription & Display Settings Card */}
                        <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3 text-secondary text-uppercase small d-flex align-items-center gap-2">
                                    <Calendar size={18} className="text-primary" />
                                    Subscription Configuration & Display Settings
                                </h6>

                                <div className="row g-3">
                                    {/* Duration in Months */}
                                    <div className="col-md-6 col-lg-3">
                                        <label className="form-label fw-bold small text-muted">Subscription Duration</label>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {DURATION_OPTIONS.map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    className={`btn btn-sm ${durationMonths === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    style={{ borderRadius: '10px', minWidth: '60px' }}
                                                    onClick={() => handleDurationChange(m)}
                                                >
                                                    {m} {m === 1 ? 'Month' : 'Months'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div className="col-md-6 col-lg-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="form-label fw-bold small text-muted mb-0">Subscription Start Date</label>
                                            {schedule.some(hasDietContent) && (
                                                <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                                    Locked
                                                </span>
                                            )}
                                        </div>
                                        <input 
                                            type="date"
                                            className="form-control admin-input"
                                            value={startDate}
                                            disabled={schedule.some(hasDietContent)}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            required
                                        />
                                        <small className="text-muted mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                                            End Date: <strong className="text-primary">{calculatedEndDate}</strong>
                                        </small>
                                        {schedule.some(hasDietContent) && (
                                            <small className="text-muted mt-1 d-block" style={{ fontSize: '0.72rem' }}>
                                                Start date locked: finalize start date before entering diet plan.
                                            </small>
                                        )}
                                    </div>

                                    {/* Plan Visibility Date */}
                                    <div className="col-md-6 col-lg-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <label className="form-label fw-bold small text-muted mb-1">
                                                Plan Visibility Date
                                            </label>
                                        </div>
                                        <input 
                                            type="date"
                                            className="form-control admin-input"
                                            value={visibilityDate}
                                            max={startDate}
                                            onChange={(e) => handleVisibilityDateChange(e.target.value)}
                                            required
                                        />
                                        <div className="d-flex gap-1 mt-1">
                                            <button 
                                                type="button" 
                                                className="btn btn-link p-0 text-decoration-none small text-muted" 
                                                style={{ fontSize: '0.72rem' }}
                                                onClick={() => {
                                                    const d = parseDateOnly(startDate);
                                                    d.setDate(d.getDate() - 1);
                                                    setVisibilityDate(formatDateToYYYYMMDD(d));
                                                }}
                                            >
                                                1 Day Before
                                            </button>
                                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>•</span>
                                            <button 
                                                type="button" 
                                                className="btn btn-link p-0 text-decoration-none small text-muted" 
                                                style={{ fontSize: '0.72rem' }}
                                                onClick={() => setVisibilityDate(startDate)}
                                            >
                                                Same Day
                                            </button>
                                        </div>
                                    </div>

                                    {/* Display Mode */}
                                    <div className="col-md-6 col-lg-3">
                                        <label className="form-label fw-bold small text-muted">What User Sees (Display Mode)</label>
                                        <select 
                                            className="form-select admin-input"
                                            value={displayMode}
                                            onChange={(e) => setDisplayMode(e.target.value as any)}
                                        >
                                            <option value="TODAY">Today's Diet Only</option>
                                            <option value="CURRENT_WEEK">Current Week</option>
                                            <option value="NEXT_7_DAYS">Next 7 Days (Today + 6)</option>
                                        </select>
                                        <div className="d-flex align-items-center gap-1 mt-1">
                                            <label className="form-label small text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                                                Advance View:
                                            </label>
                                            <select 
                                                className="form-select form-select-sm py-0 admin-input"
                                                style={{ fontSize: '0.75rem', width: 'auto' }}
                                                value={advanceDays}
                                                onChange={(e) => setAdvanceDays(Number(e.target.value))}
                                            >
                                                <option value={0}>0 Days</option>
                                                <option value={1}>1 Day Ahead</option>
                                                <option value={2}>2 Days Ahead</option>
                                                <option value={3}>3 Days Ahead</option>
                                                <option value={7}>7 Days Ahead</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="alert alert-light border mt-3 mb-0 p-2 px-3 small rounded-3 d-flex align-items-center gap-2 text-muted">
                                    <Info size={16} className="text-primary flex-shrink-0" />
                                    <span>
                                        <strong>Configuration Summary:</strong> Starts <strong>{startDate}</strong>, Ends <strong>{calculatedEndDate}</strong> ({durationMonths} Mo). 
                                        {visibilityDate < startDate 
                                            ? ` Visible to user early on ${visibilityDate} for grocery prep.` 
                                            : ` Visible to user on start date (${visibilityDate}).`} 
                                        {displayMode === 'TODAY' && ` Displays Today's Diet (+ ${advanceDays} day advance).`}
                                        {displayMode === 'CURRENT_WEEK' && ` Displays Current Week.`}
                                        {displayMode === 'NEXT_7_DAYS' && ` Displays Next 7 Days.`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Schedule Builder Header & Hierarchy (Month -> Week -> Day) */}
                        <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h6 className="fw-bold mb-0 text-secondary text-uppercase small d-flex align-items-center gap-2">
                                            <Utensils size={18} className="text-primary" />
                                            Schedule Builder (Month → Week → Day)
                                        </h6>
                                        <small className="text-muted">Configure daily meal plans, water intake, exercises, and health notes.</small>
                                    </div>

                                    {/* Action buttons: Repeat / Copy */}
                                    <div className="d-flex gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                            style={{ borderRadius: '8px' }}
                                            onClick={handleRepeatWeekAcrossAllWeeks}
                                            title="Copy this 7-day week schedule to all other weeks"
                                        >
                                            <Repeat size={14} /> Repeat Week Across All Weeks
                                        </button>

                                        {durationMonths > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                                                style={{ borderRadius: '8px' }}
                                                onClick={handleRepeatMonthAcrossAllMonths}
                                                title="Copy Month 1 schedule to all subsequent months"
                                            >
                                                <Copy size={14} /> Repeat Month 1 to All Months
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Month Tabs */}
                                {durationMonths > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                                        <div className="d-flex gap-2 overflow-auto">
                                            {Array.from({ length: durationMonths }, (_, i) => i + 1).map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    className={`btn btn-sm px-3 ${selectedMonth === m ? 'btn-primary' : 'btn-light'}`}
                                                    style={{ borderRadius: '10px' }}
                                                    onClick={() => {
                                                        setSelectedMonth(m);
                                                        setSelectedWeek(1);
                                                        const firstDayOfM = schedule.find(d => d.month === m);
                                                        if (firstDayOfM) setSelectedDayIndex(firstDayOfM.dayIndex);
                                                    }}
                                                >
                                                    Month {m}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Copy Month helper */}
                                        <div className="d-flex align-items-center gap-2">
                                            <small className="text-muted small">Copy Month to:</small>
                                            <select 
                                                className="form-select form-select-sm py-0 admin-input"
                                                style={{ width: 'auto', fontSize: '0.8rem' }}
                                                value={copyMonthTargetNum}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val) handleCopyMonth(val);
                                                }}
                                            >
                                                <option value="">Select target month...</option>
                                                {Array.from({ length: durationMonths }, (_, i) => i + 1).map(m => {
                                                    if (m === selectedMonth) return null;
                                                    return (
                                                        <option key={m} value={m}>
                                                            Month {m}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Week Tabs within Month */}
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                                    <div className="d-flex gap-2 overflow-auto">
                                        {availableWeeksInMonth.map(w => (
                                            <button
                                                key={w}
                                                type="button"
                                                className={`btn btn-sm px-3 ${effectiveWeek === w ? 'btn-success' : 'btn-outline-secondary'}`}
                                                style={{ borderRadius: '8px' }}
                                                onClick={() => {
                                                    setSelectedWeek(w);
                                                    const firstDayOfW = daysInSelectedMonth.find(d => d.week === w);
                                                    if (firstDayOfW) setSelectedDayIndex(firstDayOfW.dayIndex);
                                                }}
                                            >
                                                Week {w}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Copy week helper */}
                                    <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted small">Copy Week to:</small>
                                        <select 
                                            className="form-select form-select-sm py-0 admin-input"
                                            style={{ width: 'auto', fontSize: '0.8rem' }}
                                            value={copyWeekTargetNum}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    const [m, w] = val.split('-').map(Number);
                                                    handleCopyWeek(w, m);
                                                }
                                            }}
                                        >
                                            <option value="">Select target week...</option>
                                            {Array.from({ length: durationMonths }, (_, i) => i + 1).map(m => {
                                                const mDays = schedule.filter(d => d.month === m);
                                                const mWeeks = Array.from(new Set(mDays.map(d => d.week))).sort((a, b) => a - b);
                                                return mWeeks.map(w => {
                                                    if (m === selectedMonth && w === effectiveWeek) return null;
                                                    return (
                                                        <option key={`${m}-${w}`} value={`${m}-${w}`}>
                                                            Month {m} - Week {w}
                                                        </option>
                                                    );
                                                });
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* Days Navigation Pills */}
                                <div className="mb-4">
                                    <div className="d-flex gap-2 overflow-auto pb-2">
                                        {daysInSelectedWeek.map(day => {
                                            const isSelected = day.dayIndex === currentSelectedDay?.dayIndex;
                                            const hasData = hasDietContent(day);
                                            return (
                                                <button
                                                    key={day.dayIndex}
                                                    type="button"
                                                    className={`btn btn-sm text-start position-relative p-2 px-3 border ${
                                                        isSelected ? 'btn-primary shadow-sm' : hasData ? 'btn-outline-primary bg-white' : 'btn-light text-muted'
                                                    }`}
                                                    style={{ borderRadius: '12px', minWidth: '130px' }}
                                                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                       <span className="fw-bold" style={{ fontSize: '0.80rem' }}>
  Day <span className="d-block">{day.dayIndex}</span>
</span>
                                                        {hasData && (
                                                            <CheckCircle2 size={13} className={isSelected ? 'text-white' : 'text-success'} />
                                                        )}
                                                    </div>
                                                    <small className="d-block text-truncate" style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.7 }}>
                                                        {day.date}
                                                    </small>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Day Meal Form */}
                                {currentSelectedDay && (
                                    <div className="p-4 rounded-4 border bg-light">
                                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                            <div>
                                                <h6 className="fw-bold mb-0 text-primary">
                                                    {currentSelectedDay.label}
                                                </h6>
                                                <small className="text-muted">Date: {currentSelectedDay.date} • Month {currentSelectedDay.month}, Week {currentSelectedDay.week}</small>
                                            </div>

                                            {/* Copy single day action */}
                                            <div className="d-flex align-items-center gap-2">
                                                <small className="text-muted small">Copy Day to:</small>
                                                <select 
                                                    className="form-select form-select-sm py-0 admin-input"
                                                    style={{ width: 'auto', fontSize: '0.8rem' }}
                                                    value={copyDayTargetIndex}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        if (val) handleCopyDay(val);
                                                    }}
                                                >
                                                    <option value="">Select target day...</option>
                                                    {schedule.map(d => {
                                                        if (d.dayIndex === currentSelectedDay.dayIndex) return null;
                                                        return (
                                                            <option key={d.dayIndex} value={d.dayIndex}>
                                                                Day {d.dayIndex} ({d.date})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            {/* Breakfast */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    ☕ Breakfast
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Oats porridge with nuts and berries, 2 boiled eggs..."
                                                    value={currentSelectedDay.meals.breakfast}
                                                    onChange={(e) => handleMealChange('breakfast', e.target.value)}
                                                />
                                            </div>

                                            {/* Mid-Morning Snack */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    🍏 Mid-Morning Snack
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Green tea, tender coconut water, handful of almonds..."
                                                    value={currentSelectedDay.meals.midMorning}
                                                    onChange={(e) => handleMealChange('midMorning', e.target.value)}
                                                />
                                            </div>

                                            {/* Lunch */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    🥗 Lunch
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Boiled Matta Rice, dal curry, steamed vegetables & curd..."
                                                    value={currentSelectedDay.meals.lunch}
                                                    onChange={(e) => handleMealChange('lunch', e.target.value)}
                                                />
                                            </div>

                                            {/* Evening Snack */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    🍵 Evening Snack
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Roasted makhana, fruit bowl (papaya & apple)..."
                                                    value={currentSelectedDay.meals.evening}
                                                    onChange={(e) => handleMealChange('evening', e.target.value)}
                                                />
                                            </div>

                                            {/* Dinner */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    🍲 Dinner
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Vegetable soup, 2 whole wheat rotis with grilled paneer..."
                                                    value={currentSelectedDay.meals.dinner}
                                                    onChange={(e) => handleMealChange('dinner', e.target.value)}
                                                />
                                            </div>

                                            {/* Water Intake */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    <Droplets size={16} className="text-info" /> Water Intake
                                                </label>
                                                <input 
                                                    type="text"
                                                    className="form-control admin-input"
                                                    placeholder="E.g., 3 to 4 Liters / Day"
                                                    value={currentSelectedDay.meals.water}
                                                    onChange={(e) => handleMealChange('water', e.target.value)}
                                                />
                                            </div>

                                            {/* Exercise */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    <Activity size={16} className="text-success" /> Exercise & Activity
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., 30 mins brisk walking in the morning, light stretching..."
                                                    value={currentSelectedDay.meals.exercise}
                                                    onChange={(e) => handleMealChange('exercise', e.target.value)}
                                                />
                                            </div>

                                            {/* Special Notes */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted d-flex align-items-center gap-1">
                                                    <FileText size={16} className="text-warning" /> Notes & Instructions
                                                </label>
                                                <textarea 
                                                    className="form-control admin-input" 
                                                    rows={2}
                                                    placeholder="E.g., Avoid sugar, eat dinner before 8 PM, stay hydrated..."
                                                    value={currentSelectedDay.notes || ''}
                                                    onChange={(e) => handleNotesChange(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Day navigation controls (Previous Day & Next Day) */}
                                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                                                style={{ borderRadius: '8px' }}
                                                disabled={currentSelectedDay.dayIndex <= 1}
                                                onClick={() => {
                                                    const prevIdx = currentSelectedDay.dayIndex - 1;
                                                    const prevDay = schedule.find(d => d.dayIndex === prevIdx);
                                                    if (prevDay) {
                                                        setSelectedMonth(prevDay.month);
                                                        setSelectedWeek(prevDay.week);
                                                        setSelectedDayIndex(prevIdx);
                                                    }
                                                }}
                                            >
                                                <ChevronLeft size={14} /> Previous Day (Day {Math.max(1, currentSelectedDay.dayIndex - 1)})
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                                style={{ borderRadius: '8px' }}
                                                disabled={currentSelectedDay.dayIndex >= schedule.length}
                                                onClick={() => {
                                                    const nextIdx = currentSelectedDay.dayIndex + 1;
                                                    const nextDay = schedule.find(d => d.dayIndex === nextIdx);
                                                    if (nextDay) {
                                                        setSelectedMonth(nextDay.month);
                                                        setSelectedWeek(nextDay.week);
                                                        setSelectedDayIndex(nextIdx);
                                                    }
                                                }}
                                            >
                                                Next Day (Day {Math.min(schedule.length, currentSelectedDay.dayIndex + 1)}) <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Controls */}
                <div className="p-3 px-4 border-top bg-white d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                        Total Days Configured: <strong>{schedule.filter(hasDietContent).length} / {schedule.length}</strong>
                    </span>
                    <div className="d-flex gap-2">
                        <button 
                            type="button" 
                            className="btn btn-light px-4" 
                            style={{ borderRadius: '12px' }} 
                            onClick={onClose} 
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            form="dietPlanSubscriptionForm" 
                            className="btn btn-primary px-4" 
                            style={{ borderRadius: '12px' }} 
                            disabled={loading}
                        >
                            {loading ? 'Saving Subscription...' : (planId ? 'Save & Update Plan' : 'Publish Subscription')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDietPlanForm;
