import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Loader2, ArrowLeft, Calendar, Clock, CheckCircle2, 
    Droplets, Activity, FileText, ChevronDown, ChevronRight, 
    AlertCircle, Sparkles, ShoppingBag, Info
} from 'lucide-react';
import userApiClient from '../../../services/userApiClient';
import './ConsultationBooking.css';
import { 
    formatDateToYYYYMMDD, 
    formatReadableDate, 
    hasDietContent, 
    parseDateOnly 
} from '../../../utils/subscriptionUtils';
import type { IDietDaySchedule } from '../../../utils/subscriptionUtils';

interface DietPlanSection {
    _id?: string;
    sequence: number;
    label: string;
    description: string;
}

interface DietPlan {
    _id: string;
    id?: string;
    consultationId: string;
    customerId: string;
    startDate: string;
    originalStartDate: string;
    durationType: string;
    durationValue: number;
    durationMonths?: number;
    endDate?: string;
    visibilityDate?: string;
    displayMode?: 'TODAY' | 'CURRENT_WEEK' | 'NEXT_7_DAYS';
    advanceDays?: number;
    repeatWeek?: boolean;
    repeatMonth?: boolean;
    schedule?: IDietDaySchedule[];
    sections?: DietPlanSection[];
    completedDays?: string[];
    completedSections?: string[];
}

const DietDashboard: React.FC = () => {
    const { id: routeConsultationId } = useParams<{ id: string }>();
    const [allPlans, setAllPlans] = useState<DietPlan[]>([]);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string>(routeConsultationId || '');
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
    const [legacyActiveSection, setLegacyActiveSection] = useState<number | null>(null);

    // Current date tracking (advances automatically)
    const [currentDateStr, setCurrentDateStr] = useState<string>(() => formatDateToYYYYMMDD(new Date()));

    useEffect(() => {
        document.body.classList.add('consultation-page-body');
        
        // Auto-refresh date at midnight or periodically
        const interval = setInterval(() => {
            const todayStr = formatDateToYYYYMMDD(new Date());
            if (todayStr !== currentDateStr) {
                setCurrentDateStr(todayStr);
            }
        }, 60000);

        return () => {
            document.body.classList.remove('consultation-page-body');
            clearInterval(interval);
        };
    }, [currentDateStr]);

    useEffect(() => {
        fetchDietData();
    }, [routeConsultationId]);

    const fetchDietData = async () => {
        setLoading(true);
        try {
            if (routeConsultationId) {
                setSelectedConsultationId(routeConsultationId);
                const res = await userApiClient.get(`/user/diet-plan/consultation/${routeConsultationId}`);
                if (res.data.success && res.data.data) {
                    setDietPlan(res.data.data);
                }
            } else {
                // Accessed via /account/diet-dashboard - fetch all user plans
                const res = await userApiClient.get('/user/diet-plan');
                if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    setAllPlans(res.data.data);
                    const defaultPlan = res.data.data[0];
                    setDietPlan(defaultPlan);
                    setSelectedConsultationId(defaultPlan.consultationId);
                }
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Error fetching diet plan');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchPlan = async (consultationId: string) => {
        setSelectedConsultationId(consultationId);
        setLoading(true);
        try {
            const res = await userApiClient.get(`/user/diet-plan/consultation/${consultationId}`);
            if (res.data.success && res.data.data) {
                setDietPlan(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error loading diet plan');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDayComplete = async (dayKey: string | number) => {
        if (!dietPlan || updating) return;
        setUpdating(true);
        try {
            const consultationId = dietPlan.consultationId;
            const res = await userApiClient.put(`/user/diet-plan/consultation/${consultationId}/day/${dayKey}/toggle`);
            if (res.data.success && res.data.data) {
                setDietPlan(res.data.data);
                const completedList = res.data.data.completedDays || [];
                const isNowCompleted = completedList.includes(String(dayKey));
                if (isNowCompleted) {
                    toast.success('Day marked as completed!');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error updating completion status');
        } finally {
            setUpdating(false);
        }
    };

    // Legacy section toggle
    const handleToggleLegacySection = async (sectionId: string) => {
        if (!dietPlan || updating) return;
        setUpdating(true);
        try {
            const consultationId = dietPlan.consultationId;
            const res = await userApiClient.put(`/user/diet-plan/consultation/${consultationId}/section/${sectionId}/toggle`);
            if (res.data.success && res.data.data) {
                setDietPlan(res.data.data);
                toast.success('Section updated!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error updating status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5" style={{ minHeight: '60vh', alignItems: 'center' }}>
                <Loader2 className="animate-spin w-12 h-12 text-primary" />
            </div>
        );
    }

    if (!dietPlan) {
        return (
            <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
                <h3 className="mb-4">No Diet Plan Found</h3>
                <p className="text-muted mb-4">Your diet plan has not been assigned yet or is unavailable.</p>
                <Link to="/account/consultations" className="btn btn-primary d-inline-flex align-items-center gap-2">
                    <ArrowLeft size={16} /> Back to Consultations
                </Link>
            </div>
        );
    }

    // Determine plan type: Subscription with schedule OR Legacy sections
    const hasSubscriptionSchedule = Array.isArray(dietPlan.schedule) && dietPlan.schedule.length > 0;

    // Date calculations for subscription
    const startDateStr = dietPlan.startDate ? formatDateToYYYYMMDD(parseDateOnly(dietPlan.startDate)) : '';
    const visibilityDateStr = dietPlan.visibilityDate 
        ? formatDateToYYYYMMDD(parseDateOnly(dietPlan.visibilityDate)) 
        : startDateStr;
    const endDateStr = dietPlan.endDate 
        ? formatDateToYYYYMMDD(parseDateOnly(dietPlan.endDate)) 
        : (dietPlan.schedule && dietPlan.schedule.length > 0 ? dietPlan.schedule[dietPlan.schedule.length - 1].date : '');

    const todayStr = currentDateStr;

    // Status:
    // 1. NOT_YET_VISIBLE: today < visibilityDate
    // 2. PREPARATION: today >= visibilityDate && today < startDate
    // 3. ACTIVE: today >= startDate && today <= endDate
    // 4. EXPIRED: today > endDate
    const isBeforeVisibility = visibilityDateStr && todayStr < visibilityDateStr;
    const isPreparation = visibilityDateStr && todayStr >= visibilityDateStr && todayStr < startDateStr;
    const isExpired = endDateStr && todayStr > endDateStr;
    const isActive = todayStr >= startDateStr && !isExpired;

    // Compute visible schedule based on displayMode and advanceDays
    let visibleDays: IDietDaySchedule[] = [];
    const fullSchedule = dietPlan.schedule || [];
    const advanceWindow = dietPlan.advanceDays || 0;

    if (hasSubscriptionSchedule) {
        if (isBeforeVisibility) {
            visibleDays = [];
        } else if (isPreparation) {
            // Plan is visible before subscription starts for advance grocery shopping
            if (dietPlan.displayMode === 'CURRENT_WEEK') {
                // Show Week 1
                visibleDays = fullSchedule.filter(d => d.month === 1 && d.week === 1);
            } else if (dietPlan.displayMode === 'NEXT_7_DAYS') {
                // Show first 7 days
                visibleDays = fullSchedule.slice(0, 7);
            } else {
                // TODAY mode: If advance window covers Day 1, show Day 1; otherwise show first day
                visibleDays = fullSchedule.slice(0, Math.max(1, advanceWindow));
            }
        } else if (isActive) {
            const todayDay = fullSchedule.find(d => d.date === todayStr);
            const todayIdx = todayDay ? todayDay.dayIndex : 1;

            if (dietPlan.displayMode === 'TODAY') {
                // Show today's diet plus any advance days permitted
                visibleDays = fullSchedule.filter(
                    d => d.dayIndex >= todayIdx && d.dayIndex <= todayIdx + advanceWindow
                );
            } else if (dietPlan.displayMode === 'CURRENT_WEEK') {
                // Show current week of subscription
                const currentMonth = todayDay ? todayDay.month : 1;
                const currentWeek = todayDay ? todayDay.week : 1;
                visibleDays = fullSchedule.filter(
                    d => d.month === currentMonth && d.week === currentWeek
                );
            } else if (dietPlan.displayMode === 'NEXT_7_DAYS') {
                // Show today and following 6 days (7 days total)
                visibleDays = fullSchedule.filter(
                    d => d.dayIndex >= todayIdx && d.dayIndex < todayIdx + 7 + advanceWindow
                );
            } else {
                // Default to Next 7 Days
                visibleDays = fullSchedule.filter(
                    d => d.dayIndex >= todayIdx && d.dayIndex < todayIdx + 7
                );
            }
        } else if (isExpired) {
            // Expired: Do not expose future diet content; user sees completed summary of their past schedule
            visibleDays = [];
        }
    }

    const completedDaysList = dietPlan.completedDays || [];
    const progressCount = hasSubscriptionSchedule
        ? fullSchedule.filter(d => completedDaysList.includes(String(d.dayIndex)) || completedDaysList.includes(d.date)).length
        : (dietPlan.completedSections || []).length;
    const totalCount = hasSubscriptionSchedule ? fullSchedule.length : (dietPlan.sections || []).length;

    return (
        <div className="consultation-wrapper">
            <style>
                {`
                    .diet-meal-card {
                        background: #ffffff;
                        border-radius: 16px;
                        border: 1px solid #eef2f6;
                        transition: all 0.25s ease;
                    }
                    .diet-meal-card:hover {
                        border-color: #cbd5e1;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    }
                    .meal-tag {
                        font-size: 0.8rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .frozen-day-card {
                        background-color: #f8fafc !important;
                        border: 1px solid #cbd5e1 !important;
                    }
                `}
            </style>

            <div className="page-content bg-light pb-5">
                <section className="content-inner-1 pt-4" style={{ minHeight: '70vh' }}>
                    <div className="container">
                        
                        {/* Back Link & Multi-Subscription Switcher */}
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                            <Link to="/account/consultations" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">
                                <ArrowLeft size={16} /> Back to Consultations
                            </Link>

                            {allPlans.length > 1 && (
                                <div className="d-flex align-items-center gap-2">
                                    <label className="text-muted small mb-0 fw-bold">Select Subscription:</label>
                                    <select 
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto', borderRadius: '8px' }}
                                        value={selectedConsultationId}
                                        onChange={(e) => handleSwitchPlan(e.target.value)}
                                    >
                                        {allPlans.map((p, idx) => (
                                            <option key={p.consultationId || idx} value={p.consultationId}>
                                                Plan #{idx + 1} ({p.startDate?.slice(0, 10)}) - {p.durationMonths ? `${p.durationMonths} Mo` : `${p.durationValue} ${p.durationType}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="row justify-content-center">
                            <div className="col-lg-9">
                                
                                {/* Header Title and Status Badge */}
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <div>
                                        <h2 className="dz-title m-0">Personalized Diet Subscription</h2>
                                        <small className="text-muted">
                                            {dietPlan.durationMonths 
                                                ? `${dietPlan.durationMonths} Month Subscription` 
                                                : `${dietPlan.durationValue} ${dietPlan.durationType} Plan`}
                                        </small>
                                    </div>

                                    {isBeforeVisibility ? (
                                        <span className="badge bg-warning text-dark p-2 px-3 fs-6 rounded-pill d-inline-flex align-items-center gap-1">
                                            <Clock size={16} /> Visible on {formatReadableDate(visibilityDateStr)}
                                        </span>
                                    ) : isPreparation ? (
                                        <span className="badge p-2 px-3 fs-6 rounded-pill d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#0284c7', color: '#fff' }}>
                                            <ShoppingBag size={16} /> Advance Preparation View
                                        </span>
                                    ) : isExpired ? (
                                        <span className="badge bg-secondary p-2 px-3 fs-6 rounded-pill d-inline-flex align-items-center gap-1">
                                            <CheckCircle2 size={16} /> Subscription Completed
                                        </span>
                                    ) : (
                                        <span className="badge bg-success p-2 px-3 fs-6 rounded-pill d-inline-flex align-items-center gap-1">
                                            <Sparkles size={16} /> Active Plan
                                        </span>
                                    )}
                                </div>

                                {/* Subscription Summary Card */}
                                <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                                    <div className="card-body p-4">
                                        <div className="row text-center g-3">
                                            <div className="col-6 col-md-3 border-end">
                                                <p className="text-muted small mb-1">Start Date</p>
                                                <h6 className="mb-0 fw-bold">{startDateStr ? formatReadableDate(startDateStr) : '-'}</h6>
                                            </div>
                                            <div className="col-6 col-md-3 border-end">
                                                <p className="text-muted small mb-1">End Date</p>
                                                <h6 className="mb-0 fw-bold">{endDateStr ? formatReadableDate(endDateStr) : '-'}</h6>
                                            </div>
                                            <div className="col-6 col-md-3 border-end">
                                                <p className="text-muted small mb-1">Display Mode</p>
                                                <h6 className="mb-0 fw-bold text-capitalize">
                                                    {dietPlan.displayMode?.toLowerCase().replace(/_/g, ' ') || 'Today\'s Diet'}
                                                </h6>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <p className="text-muted small mb-1">Progress</p>
                                                <h6 className="mb-0 fw-bold text-success">
                                                    {progressCount} / {totalCount} Days
                                                </h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* State Alert: Preparation Notice */}
                                {isPreparation && (
                                    <div className="alert alert-info border-0 shadow-sm p-3 rounded-4 mb-4 d-flex align-items-center gap-3">
                                        <ShoppingBag size={24} className="text-info flex-shrink-0" />
                                        <div>
                                            <strong className="d-block">Preparation Access Active</strong>
                                            <span className="small">
                                                Your subscription begins on <strong>{formatReadableDate(startDateStr)}</strong>. 
                                                You have early access to view upcoming meals so you can purchase organic groceries and prepare healthy ingredients in advance!
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* State Alert: Not Yet Visible */}
                                {isBeforeVisibility && (
                                    <div className="card shadow-sm border-0 p-5 text-center rounded-4 bg-white mb-4">
                                        <div className="mx-auto mb-3 text-warning">
                                            <Clock size={48} />
                                        </div>
                                        <h4 className="fw-bold mb-2">Diet Plan Being Prepared</h4>
                                        <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '500px' }}>
                                            Your customized diet plan is currently being finalized by our nutrition experts. 
                                            It will become visible on <strong>{formatReadableDate(visibilityDateStr)}</strong>. 
                                            Your diet subscription officially begins on <strong>{formatReadableDate(startDateStr)}</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* State Alert: Expired Subscription */}
                                {isExpired && (
                                    <div className="card shadow-sm border-0 p-5 text-center rounded-4 bg-white mb-4">
                                        <div className="mx-auto mb-3 text-success">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h4 className="fw-bold mb-2">Subscription Completed</h4>
                                        <p className="text-muted mb-3 mx-auto" style={{ maxWidth: '550px' }}>
                                            Your diet subscription concluded on <strong>{formatReadableDate(endDateStr)}</strong>. 
                                            Congratulations on sticking with your natural edibles health journey! 
                                            To extend or renew your consultation and diet plan, please book a new consultation.
                                        </p>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Link to="/consultation" className="btn btn-primary px-4" style={{ borderRadius: '12px' }}>
                                                Book New Consultation
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* 1. RENDER SUBSCRIPTION SCHEDULE (Month -> Week -> Day) */}
                                {hasSubscriptionSchedule && !isBeforeVisibility && !isExpired && (
                                    <div className="diet-schedule-container">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="fw-bold mb-0">
                                                {isPreparation ? 'Upcoming Preparation Schedule' : 'Your Schedule'}
                                            </h5>
                                            <small className="text-muted">
                                                Showing {visibleDays.length} day(s) permitted by display settings
                                            </small>
                                        </div>

                                        {visibleDays.length === 0 ? (
                                            <div className="alert alert-light border p-4 text-center rounded-4 text-muted">
                                                <Info size={24} className="mb-2 text-primary d-block mx-auto" />
                                                No diet schedule currently visible for today.
                                            </div>
                                        ) : (
                                            visibleDays.map((day) => {
                                                const isCompleted = completedDaysList.includes(String(day.dayIndex)) || completedDaysList.includes(day.date);
                                                const isToday = day.date === todayStr;
                                                const hasData = hasDietContent(day);
                                                const isOpen = activeDayIndex === day.dayIndex || (activeDayIndex === null && isToday);

                                                return (
                                                    <div 
                                                        key={day.dayIndex}
                                                        className={`card shadow-sm border-0 mb-4 rounded-4 overflow-hidden ${isCompleted ? 'frozen-day-card' : 'bg-white'}`}
                                                    >
                                                        {/* Day Accordion / Card Header */}
                                                        <div 
                                                            className="p-3 px-4 d-flex justify-content-between align-items-center cursor-pointer border-bottom bg-white"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setActiveDayIndex(isOpen ? -1 : day.dayIndex)}
                                                        >
                                                            <div className="d-flex align-items-center gap-3">
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-link p-0 text-dark text-decoration-none"
                                                                >
                                                                    {isOpen ? <ChevronDown size={20} className="text-primary" /> : <ChevronRight size={20} className="text-muted" />}
                                                                </button>
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <h5 className="fw-bold mb-0 text-dark">
                                                                            {day.label}
                                                                        </h5>
                                                                        {isToday && (
                                                                            <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                                                                Today
                                                                            </span>
                                                                        )}
                                                                        {isCompleted && (
                                                                            <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                                                                                <CheckCircle2 size={12} /> Completed
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        Month {day.month} • Week {day.week} • {formatReadableDate(day.date)}
                                                                    </small>
                                                                </div>
                                                            </div>

                                                            <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    className={`btn btn-sm ${isCompleted ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                                                    style={{ borderRadius: '10px' }}
                                                                    onClick={() => handleToggleDayComplete(day.dayIndex)}
                                                                    disabled={updating}
                                                                >
                                                                    {isCompleted ? (
                                                                        <span className="d-inline-flex align-items-center gap-1">
                                                                            <CheckCircle2 size={14} /> Completed
                                                                        </span>
                                                                    ) : (
                                                                        'Mark Day Complete'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Day Meal Details Body */}
                                                        {isOpen && (
                                                            <div className="p-4" style={{ backgroundColor: '#fafbfc' }}>
                                                                {!hasData ? (
                                                                    <div className="alert alert-light border text-center p-4 rounded-3 text-muted">
                                                                        <Info size={20} className="text-primary mb-1 d-block mx-auto" />
                                                                        No specific diet entered for this day. Please follow general dietary guidelines or contact your consultant.
                                                                    </div>
                                                                ) : (
                                                                    <div className="row g-3">
                                                                        {/* Breakfast */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-primary meal-tag">
                                                                                    <span>☕</span> Breakfast
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                                    {day.meals?.breakfast || <span className="text-muted fst-italic">Standard healthy breakfast</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Mid-Morning */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-primary meal-tag">
                                                                                    <span>🍏</span> Mid-Morning Snack
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                                    {day.meals?.midMorning || <span className="text-muted fst-italic">Fruit / warm herbal tea</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Lunch */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-primary meal-tag">
                                                                                    <span>🥗</span> Lunch
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                                    {day.meals?.lunch || <span className="text-muted fst-italic">Balanced meal with vegetables and pulses</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Evening */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-primary meal-tag">
                                                                                    <span>🍵</span> Evening Snack
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                                    {day.meals?.evening || <span className="text-muted fst-italic">Light snack / roasted seeds</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Dinner */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-primary meal-tag">
                                                                                    <span>🍲</span> Dinner
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                                    {day.meals?.dinner || <span className="text-muted fst-italic">Light dinner before 8 PM</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Water Intake */}
                                                                        <div className="col-md-6">
                                                                            <div className="diet-meal-card p-3 h-100">
                                                                                <div className="d-flex align-items-center gap-2 mb-2 text-info meal-tag">
                                                                                    <Droplets size={16} /> Water Intake
                                                                                </div>
                                                                                <p className="mb-0 text-secondary" style={{ lineHeight: 1.6 }}>
                                                                                    {day.meals?.water || '3 to 4 Liters / Day'}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Exercise & Notes */}
                                                                        {(day.meals?.exercise || day.notes) && (
                                                                            <div className="col-12">
                                                                                <div className="row g-3">
                                                                                    {day.meals?.exercise && (
                                                                                        <div className="col-md-6">
                                                                                            <div className="diet-meal-card p-3 h-100" style={{ borderLeft: '4px solid #22c55e' }}>
                                                                                                <div className="d-flex align-items-center gap-2 mb-1 text-success meal-tag">
                                                                                                    <Activity size={16} /> Activity & Exercise
                                                                                                </div>
                                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                                                                                                    {day.meals.exercise}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                    {day.notes && (
                                                                                        <div className="col-md-6">
                                                                                            <div className="diet-meal-card p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                                                                                                <div className="d-flex align-items-center gap-2 mb-1 text-warning meal-tag">
                                                                                                    <FileText size={16} /> Special Instructions
                                                                                                </div>
                                                                                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                                                                                                    {day.notes}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {/* 2. BACKWARD-COMPATIBLE LEGACY SECTIONS VIEW */}
                                {!hasSubscriptionSchedule && Array.isArray(dietPlan.sections) && dietPlan.sections.length > 0 && (
                                    <div className="accordion dz-accordion style-1" id="accordionDiet">
                                        <h5 className="fw-bold mb-3">Plan Sections</h5>
                                        {dietPlan.sections.map((section, index) => {
                                            const sectionId = section._id || String(section.sequence);
                                            const isCompleted = (dietPlan.completedSections || []).includes(sectionId);
                                            const isOpen = legacyActiveSection === index;

                                            return (
                                                <div 
                                                    key={index} 
                                                    className={`accordion-item shadow-sm mb-3 border-0 rounded-4 overflow-hidden ${isCompleted ? 'frozen-day' : ''}`}
                                                >
                                                    <h2 className="accordion-header">
                                                        <button 
                                                            className={`accordion-button fs-5 fw-bold ${!isOpen ? 'collapsed' : ''}`} 
                                                            type="button" 
                                                            onClick={() => setLegacyActiveSection(prev => prev === index ? null : index)}
                                                            aria-expanded={isOpen}
                                                        >
                                                            {section.label}
                                                        </button>
                                                    </h2>
                                                    {isOpen && (
                                                        <div className="accordion-collapse">
                                                            <div className="accordion-body p-4 border-top">
                                                                <div className="diet-plan-desc mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#4b5563' }}>
                                                                    {section.description ? section.description : <span className="text-muted fst-italic">No details provided for this section.</span>}
                                                                </div>
                                                                
                                                                <div className="d-flex justify-content-end align-items-center mt-3 pt-3 border-top">
                                                                    <button 
                                                                        className={`btn ${isCompleted ? 'btn-outline-success' : 'btn-primary'} d-inline-flex align-items-center gap-2`}
                                                                        onClick={() => handleToggleLegacySection(sectionId)}
                                                                        disabled={updating}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <>
                                                                                <CheckCircle2 size={16} /> Completed
                                                                            </>
                                                                        ) : (
                                                                            'Mark as Completed'
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DietDashboard;
