import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, Utensils, Droplets, Activity, FileText, 
    ArrowLeft, CheckCircle2, AlertCircle, Info, Clock, 
    Printer, ShieldCheck, ChevronDown, ChevronRight
} from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { 
    formatReadableDate, 
    hasDietContent, 
    parseDateOnly 
} from '../../../utils/subscriptionUtils';
import type { IDietDaySchedule } from '../../../utils/subscriptionUtils';

interface AdminDietPlanViewProps {
    consultation?: any;
    consultationId?: string;
    onClose?: () => void;
}

const AdminDietPlanView: React.FC<AdminDietPlanViewProps> = ({ 
    consultation: propConsultation, 
    consultationId: propConsultationId, 
    onClose 
}) => {
    const { id: routeConsultationId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const effectiveConsultationId = propConsultation?._id 
        || propConsultation?.id 
        || propConsultationId 
        || routeConsultationId;

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<any>(null);
    const [consultation, setConsultation] = useState<any>(propConsultation || null);
    const [error, setError] = useState<string | null>(null);

    // Hierarchy browsing state
    const [selectedMonth, setSelectedMonth] = useState<number>(1);
    const [openWeek, setOpenWeek] = useState<number | null>(null);
    const [showOnlyConfiguredDays, setShowOnlyConfiguredDays] = useState<boolean>(false);

    useEffect(() => {
        fetchPlanDetails();
    }, [effectiveConsultationId]);

    const fetchPlanDetails = async () => {
        if (!effectiveConsultationId) {
            setError('No consultation ID specified.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. If consultation details not passed in prop, fetch consultation info
            if (!consultation) {
                try {
                    const cRes = await adminApiClient.get(`/admin/consultation/bookings/${effectiveConsultationId}`);
                    if (cRes.data?.success && cRes.data?.data) {
                        setConsultation(cRes.data.data);
                    }
                } catch {
                    // Ignore consultation fetch error, proceed with plan
                }
            }

            // 2. Fetch existing Diet Plan for this consultation
            const res = await adminApiClient.get(`/admin/diet-plan/consultation/${effectiveConsultationId}`);
            if (res.data?.success && res.data?.data) {
                const dietData = res.data.data;
                setPlan(dietData);
                if (dietData.durationMonths) {
                    setSelectedMonth(1);
                }
            } else {
                setError('No diet plan has been created for this consultation yet.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error retrieving diet plan');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/admin/consultations');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDateDisplay = (dateInput: string | Date | undefined | null) => {
        if (!dateInput) return '—';
        try {
            return formatReadableDate(dateInput);
        } catch {
            return String(dateInput);
        }
    };

    // Filter schedule for selected Month and Week
    const schedule: IDietDaySchedule[] = Array.isArray(plan?.schedule) ? plan.schedule : [];
    const durationMonths: number = plan?.durationMonths 
        || (plan?.durationType === 'months' ? plan.durationValue : 1) 
        || 1;

    const daysInSelectedMonth = schedule.filter(d => d.month === selectedMonth);
    const availableWeeksInMonth = Array.from(new Set(daysInSelectedMonth.map(d => d.week))).sort((a, b) => a - b);


    const totalDaysCount = schedule.length;
    const configuredDaysCount = schedule.filter(hasDietContent).length;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="p-5 text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading Diet Plan...</span>
                    </div>
                    <p className="text-muted mt-3 small">Loading diet plan subscription details...</p>
                </div>
            );
        }

        if (error || !plan) {
            return (
                <div className="p-5 text-center my-5">
                    <AlertCircle size={48} className="text-warning mb-3" />
                    <h5 className="fw-bold text-dark">Diet Plan Not Found</h5>
                    <p className="text-muted small">{error || 'No diet plan has been configured for this consultation.'}</p>
                    <button className="btn btn-outline-primary btn-sm mt-2" onClick={handleBack} style={{ borderRadius: '10px' }}>
                        <ArrowLeft size={16} className="me-1" /> Return to Consultations
                    </button>
                </div>
            );
        }

        return (
            <div className="diet-plan-view-content">
                {/* 1. Subscription Information Card */}
                <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <h6 className="fw-bold mb-0 text-secondary text-uppercase small d-flex align-items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Subscription Information
                            </h6>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-2 px-3 rounded-pill small d-flex align-items-center gap-1">
                                <ShieldCheck size={14} /> Read-Only Admin View
                            </span>
                        </div>

                        <div className="row g-3">
                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Duration</span>
                                <strong className="text-dark fs-6">
                                    {plan.durationMonths || plan.durationValue} {plan.durationType || 'Month(s)'}
                                </strong>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Subscription Start Date</span>
                                <strong className="text-dark fs-6">
                                    {plan.startDate ? formatDateDisplay(plan.startDate) : '—'}
                                </strong>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Subscription End Date</span>
                                <strong className="text-dark fs-6 text-primary">
                                    {plan.endDate ? formatDateDisplay(plan.endDate) : '—'}
                                </strong>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Plan Visibility Date</span>
                                <strong className="text-dark fs-6">
                                    {plan.visibilityDate ? formatDateDisplay(plan.visibilityDate) : formatDateDisplay(plan.startDate)}
                                </strong>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">User Display Mode</span>
                                <span className="badge bg-light text-dark border py-1 px-2 mt-1">
                                    {plan.displayMode === 'CURRENT_WEEK' ? 'Current Week' : plan.displayMode === 'NEXT_7_DAYS' ? 'Next 7 Days' : "Today's Diet"}
                                </span>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Advance View Setting</span>
                                <span className="text-dark fw-bold small">
                                    {plan.advanceDays !== undefined ? `${plan.advanceDays} Day(s) Ahead` : '0 Days'}
                                </span>
                            </div>

                            <div className="col-6 col-md-3">
                                <span className="text-muted small d-block">Schedule Coverage</span>
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 py-1 px-2 mt-1">
                                    {configuredDaysCount} of {totalDaysCount} Days Configured
                                </span>
                            </div>

                            {plan.createdAt && (
                                <div className="col-6 col-md-3">
                                    <span className="text-muted small d-block">Created On</span>
                                    <span className="text-muted small">
                                        {formatReadableDate(plan.createdAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Schedule Hierarchy: Month -> Week -> Day */}
                {schedule.length > 0 ? (
                    <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h6 className="fw-bold mb-0 text-secondary text-uppercase small d-flex align-items-center gap-2">
                                        <Utensils size={18} className="text-primary" />
                                        Diet Schedule Hierarchy (Month → Week → Day)
                                    </h6>
                                    <small className="text-muted">Viewing all scheduled meals, water intake, exercises, and special instructions.</small>
                                </div>

                                <div className="form-check form-switch mb-0">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="filterConfiguredSwitch" 
                                        checked={showOnlyConfiguredDays}
                                        onChange={(e) => setShowOnlyConfiguredDays(e.target.checked)}
                                    />
                                    <label className="form-check-label small text-muted" htmlFor="filterConfiguredSwitch">
                                        Show only days with diet entries ({configuredDaysCount})
                                    </label>
                                </div>
                            </div>

                            {/* Month Header / Tabs */}
                            {durationMonths > 1 ? (
                                <div className="d-flex gap-2 mb-3 pb-2 border-bottom overflow-auto">
                                    {Array.from({ length: durationMonths }, (_, i) => i + 1).map(m => {
                                        const mDays = schedule.filter(d => d.month === m);
                                        const mConfigured = mDays.filter(hasDietContent).length;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                className={`btn btn-sm px-3 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                                                style={{ borderRadius: '10px' }}
                                                onClick={() => {
                                                    setSelectedMonth(m);
                                                    setOpenWeek(null);
                                                }}
                                            >
                                                Month {m}
                                                <span className={`badge ms-2 ${selectedMonth === m ? 'bg-white text-primary' : 'bg-secondary bg-opacity-25 text-dark'}`} style={{ fontSize: '0.7rem' }}>
                                                    {mConfigured} / {mDays.length} d
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                                    <h6 className="fw-bold mb-0 text-dark text-uppercase small">Month 1</h6>
                                    <span className="badge bg-light text-secondary border small">
                                        {schedule.filter(d => d.month === 1 && hasDietContent(d)).length} / {daysInSelectedMonth.length} days configured
                                    </span>
                                </div>
                            )}

                            {/* Weeks Accordion within selected Month */}
                            {availableWeeksInMonth.length === 0 ? (
                                <div className="alert alert-light border p-4 text-center rounded-3 text-muted">
                                    No diet entries found for Month {selectedMonth}.
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {availableWeeksInMonth.map(w => {
                                        const isOpen = openWeek === w;
                                        const wDays = daysInSelectedMonth.filter(d => d.week === w);
                                        const wConfigured = wDays.filter(hasDietContent).length;
                                        const displayedWeekDays = showOnlyConfiguredDays ? wDays.filter(hasDietContent) : wDays;

                                        return (
                                            <div 
                                                key={w} 
                                                className="border rounded-4 bg-white shadow-sm overflow-hidden"
                                                style={{ borderColor: isOpen ? '#22c55e' : '#e2e8f0' }}
                                            >
                                                {/* Week Header (Accordion Trigger) */}
                                                <button
                                                    type="button"
                                                    className={`w-100 btn text-start p-3 px-4 d-flex justify-content-between align-items-center border-0 ${isOpen ? 'bg-light' : 'bg-white'}`}
                                                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                    onClick={() => setOpenWeek(prev => prev === w ? null : w)}
                                                    aria-expanded={isOpen}
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        {isOpen ? (
                                                            <ChevronDown size={20} className="text-primary flex-shrink-0" />
                                                        ) : (
                                                            <ChevronRight size={20} className="text-secondary flex-shrink-0" />
                                                        )}
                                                        <span className="fw-bold text-dark fs-6">Week {w}</span>
                                                    </div>

                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-light text-secondary border small">
                                                            {wConfigured} / {wDays.length} days
                                                        </span>
                                                        {wConfigured === wDays.length && wDays.length > 0 && (
                                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small d-none d-sm-inline-flex align-items-center gap-1">
                                                                <CheckCircle2 size={12} /> Configured
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Week Days (Accordion Content) */}
                                                {isOpen && (
                                                    <div className="p-3 px-4 border-top bg-light bg-opacity-25 d-flex flex-column gap-3">
                                                        {displayedWeekDays.length === 0 ? (
                                                            <div className="alert alert-light border p-3 text-center rounded-3 text-muted small mb-0">
                                                                No diet entries found for Week {w}.
                                                            </div>
                                                        ) : (
                                                            displayedWeekDays.map(day => {
                                                                const hasData = hasDietContent(day);
                                                                return (
                                                                    <div 
                                                                        key={day.dayIndex} 
                                                                        className={`border rounded-4 p-3 transition-all ${hasData ? 'bg-white' : 'bg-light bg-opacity-50'}`}
                                                                        style={{ borderLeftWidth: '5px', borderLeftColor: hasData ? '#22c55e' : '#cbd5e1' }}
                                                                    >
                                                                        {/* Day Header */}
                                                                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <span className="badge bg-primary px-2 py-1 rounded-2" style={{ fontSize: '0.8rem' }}>
                                                                                    Day {day.dayIndex}
                                                                                </span>
                                                                                <h6 className="fw-bold mb-0 text-dark">
                                                                                    {day.label}
                                                                                </h6>
                                                                                <small className="text-muted">({day.date})</small>
                                                                            </div>

                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <span className="badge bg-light text-secondary border small">
                                                                                    Month {day.month} • Week {day.week}
                                                                                </span>
                                                                                {hasData ? (
                                                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small d-flex align-items-center gap-1">
                                                                                        <CheckCircle2 size={12} /> Configured
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="badge bg-light text-muted border small">
                                                                                        Empty Day
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Meal Fields Grid */}
                                                                        <div className="row g-3">
                                                                            {/* Breakfast */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1">☕ Breakfast</span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.breakfast ? day.meals.breakfast : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Mid-Morning Snack */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1">🍏 Mid-Morning Snack</span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.midMorning ? day.meals.midMorning : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Lunch */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1">🥗 Lunch</span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.lunch ? day.meals.lunch : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Evening Snack */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1">🍵 Evening Snack</span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.evening ? day.meals.evening : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Dinner */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1">🍲 Dinner</span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.dinner ? day.meals.dinner : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Water Intake */}
                                                                            <div className="col-md-6 col-lg-4">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1 d-flex align-items-center gap-1">
                                                                                        <Droplets size={14} className="text-info" /> Water Intake
                                                                                    </span>
                                                                                    <p className="mb-0 text-dark small">
                                                                                        {day.meals.water ? day.meals.water : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Exercise & Activity */}
                                                                            <div className="col-md-6">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1 d-flex align-items-center gap-1">
                                                                                        <Activity size={14} className="text-success" /> Exercise & Activity
                                                                                    </span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.meals.exercise ? day.meals.exercise : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Notes & Special Instructions */}
                                                                            <div className="col-md-6">
                                                                                <div className="p-3 rounded-3 bg-light h-100">
                                                                                    <span className="fw-bold small text-muted d-block mb-1 d-flex align-items-center gap-1">
                                                                                        <FileText size={14} className="text-warning" /> Notes & Instructions
                                                                                    </span>
                                                                                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                                                        {day.notes || day.meals.notes ? (day.notes || day.meals.notes) : <span className="text-muted">—</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Legacy Sections Fallback */
                    Array.isArray(plan?.sections) && plan.sections.length > 0 && (
                        <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3 text-secondary text-uppercase small d-flex align-items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    Plan Sections Overview
                                </h6>
                                <div className="d-flex flex-column gap-3">
                                    {plan.sections.map((section: any, idx: number) => (
                                        <div key={idx} className="border rounded-3 p-3 bg-light">
                                            <h6 className="fw-bold text-primary mb-2">
                                                {section.label || `Section ${section.sequence}`}
                                            </h6>
                                            <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                                                {section.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        );
    };

    return (
        <div className="cancellation-reason-overlay" style={{ zIndex: 1250 }}>
            <div 
                className="cancellation-reason-box admin-card p-0" 
                style={{ 
                    maxWidth: '1100px', 
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
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            type="button" 
                            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                            style={{ borderRadius: '10px' }}
                            onClick={handleBack}
                            title="Back to Consultations"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div>
                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                View Diet Plan Subscription
                            </h5>
                            <small className="text-muted">
                                Patient: <strong>{consultation?.fullName || 'Customer'}</strong>
                                {consultation?.age && ` • ${consultation.age} yrs / ${consultation.gender || '-'}`}
                                {consultation?.mainHealthIssue && ` • Issue: ${consultation.mainHealthIssue}`}
                            </small>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            type="button" 
                            className="btn btn-sm btn-outline-secondary d-none d-md-inline-flex align-items-center gap-1"
                            style={{ borderRadius: '10px' }}
                            onClick={handlePrint}
                            title="Print Diet Plan"
                        >
                            <Printer size={15} /> Print
                        </button>
                        <button className="btn-close" onClick={handleBack}></button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4 overflow-auto" style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                    {renderContent()}
                </div>

                {/* Footer Controls */}
                <div className="p-3 px-4 border-top bg-white d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                        {schedule.length > 0 && (
                            <>
                                Schedule Status: <strong>{configuredDaysCount}</strong> of <strong>{totalDaysCount}</strong> days configured
                            </>
                        )}
                    </span>
                    <button 
                        type="button" 
                        className="btn btn-secondary px-4" 
                        style={{ borderRadius: '12px' }} 
                        onClick={handleBack}
                    >
                        Close & Return
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDietPlanView;
