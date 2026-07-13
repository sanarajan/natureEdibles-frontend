import React, { useEffect, useState } from 'react';
import { getConsultationSettings, updateConsultationSettings } from '../../../services/api/consultationApi';
import { toast } from 'react-toastify';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type DayType = typeof DAYS[number];

const AdminConsultationSettings: React.FC = () => {
    const [settings, setSettings] = useState<any>({
        bookingEnabled: true,
        consultationFee: 0,
        slotGapMinutes: 15,
        minAdvanceBookingHours: 24,
        maxAdvanceBookingDays: 30,
        workingDays: {
            monday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            thursday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            friday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            saturday: { enabled: false, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 },
            sunday: { enabled: false, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxDailyBookings: 20 }
        },
        leaveDates: [],
        specialSchedules: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getConsultationSettings();
                if (res.success && res.data) {
                    setSettings({
                        ...res.data,
                        bookingEnabled: res.data.bookingEnabled ?? res.data.isActive ?? true,
                        consultationFee: res.data.consultationFee ?? 0,
                        slotGapMinutes: res.data.slotGapMinutes ?? res.data.bufferMinutes ?? 15,
                        workingDays: res.data.workingDays || settings.workingDays,
                        leaveDates: res.data.leaveDates || [],
                        specialSchedules: res.data.specialSchedules || []
                    });
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : Number(value)
        }));
    };

    const handleDayChange = (day: DayType, field: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            workingDays: {
                ...prev.workingDays,
                [day]: {
                    ...prev.workingDays[day],
                    [field]: value
                }
            }
        }));
    };

    const addLeaveDate = () => {
        setSettings((prev: any) => ({
            ...prev,
            leaveDates: [...prev.leaveDates, { id: Date.now().toString(), date: '', reason: '', status: 'Active' }]
        }));
    };

    const updateLeaveDate = (index: number, field: string, value: any) => {
        const newLeaves = [...settings.leaveDates];
        newLeaves[index] = { ...newLeaves[index], [field]: value };
        setSettings((prev: any) => ({ ...prev, leaveDates: newLeaves }));
    };

    const removeLeaveDate = (index: number) => {
        const newLeaves = settings.leaveDates.filter((_: any, i: number) => i !== index);
        setSettings((prev: any) => ({ ...prev, leaveDates: newLeaves }));
    };

    const addSpecialSchedule = () => {
        setSettings((prev: any) => ({
            ...prev,
            specialSchedules: [...prev.specialSchedules, { id: Date.now().toString(), date: '', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxBookings: 20 }]
        }));
    };

    const updateSpecialSchedule = (index: number, field: string, value: any) => {
        const newSchedules = [...settings.specialSchedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setSettings((prev: any) => ({ ...prev, specialSchedules: newSchedules }));
    };

    const removeSpecialSchedule = (index: number) => {
        const newSchedules = settings.specialSchedules.filter((_: any, i: number) => i !== index);
        setSettings((prev: any) => ({ ...prev, specialSchedules: newSchedules }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await updateConsultationSettings(settings);
            if (res.success) {
                toast.success('Settings updated successfully');
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="admin-page-container p-4">
            <style>
                {`
                    /* Force-Repair Bootstrap Form Switch */
                    .admin-page-container .form-check.form-switch {
                        padding-left: 3.5em !important;
                        min-height: 1.5em;
                        display: flex;
                        align-items: center;
                        position: relative;
                        margin-bottom: 0;
                    }
                    .admin-page-container .form-switch .form-check-input {
                        width: 3em !important;
                        height: 1.5em !important;
                        border-radius: 2em !important;
                        margin-left: -3.5em !important;
                        margin-top: 0 !important;
                        cursor: pointer !important;
                        background-color: #e9ecef !important;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.35%29'/%3e%3c/svg%3e") !important;
                        background-position: left center !important;
                        background-repeat: no-repeat !important;
                        background-size: contain !important;
                        border: 1px solid rgba(0,0,0,.25) !important;
                        transition: background-position .15s ease-in-out, background-color .15s ease-in-out !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        box-shadow: none !important;
                        position: absolute;
                        left: 3.5em;
                    }
                    .admin-page-container .form-switch .form-check-input:checked {
                        background-position: right center !important;
                        background-color: #198754 !important;
                        border-color: #198754 !important;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
                    }
                    /* Style disabled inputs perfectly */
                    .admin-page-container input.form-control:disabled {
                        background-color: #e9ecef !important;
                        color: #6c757d !important;
                        cursor: not-allowed !important;
                        border-color: #ced4da !important;
                    }
                    /* Dim the row when switch is off */
                    .admin-page-container tr:has(.form-switch .form-check-input:not(:checked)) {
                        opacity: 0.65;
                        background-color: #fcfcfc;
                        transition: all 0.2s ease-in-out;
                    }
                `}
            </style>
            <h2 className="h4 mb-4">Consultation Settings</h2>

            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white pt-4 pb-2 border-0">
                        <h5 className="mb-0">General Settings</h5>
                    </div>
                    <div className="card-body">
                        <div className="form-check form-switch mb-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="bookingEnabled"
                                name="bookingEnabled"
                                checked={settings.bookingEnabled}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="bookingEnabled">
                                Enable Consultations globally
                            </label>
                        </div>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">Consultation Fee (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="consultationFee"
                                    min="0"
                                    value={settings.consultationFee}
                                    onChange={handleChange}
                                />
                                <small className="text-muted">Set 0 for free consultations.</small>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Buffer Between Slots (Minutes)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="slotGapMinutes"
                                    min="0"
                                    value={settings.slotGapMinutes}
                                    onChange={handleChange}
                                />
                                <small className="text-muted">Resting time after each consultation.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white pt-4 pb-2 border-0">
                        <h5 className="mb-0">Weekly Schedule</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Day</th>
                                        <th>Enabled</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Duration (mins)</th>
                                        <th>Max Bookings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map(day => (
                                        <tr key={day}>
                                            <td className="text-capitalize fw-medium">{day}</td>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={settings.workingDays[day].enabled}
                                                        onChange={(e) => handleDayChange(day, 'enabled', e.target.checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    value={settings.workingDays[day].startTime}
                                                    onChange={(e) => handleDayChange(day, 'startTime', e.target.value)}
                                                    disabled={!settings.workingDays[day].enabled}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    value={settings.workingDays[day].endTime}
                                                    onChange={(e) => handleDayChange(day, 'endTime', e.target.value)}
                                                    disabled={!settings.workingDays[day].enabled}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="5"
                                                    value={settings.workingDays[day].slotDurationMinutes}
                                                    onChange={(e) => handleDayChange(day, 'slotDurationMinutes', Number(e.target.value))}
                                                    disabled={!settings.workingDays[day].enabled}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="1"
                                                    value={settings.workingDays[day].maxDailyBookings}
                                                    onChange={(e) => handleDayChange(day, 'maxDailyBookings', Number(e.target.value))}
                                                    disabled={!settings.workingDays[day].enabled}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white pt-4 pb-2 border-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Leave Management</h5>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLeaveDate}>
                            <Plus className="w-4 h-4 me-1 inline-block" /> Add Leave
                        </button>
                    </div>
                    <div className="card-body">
                        {settings.leaveDates.length === 0 ? (
                            <p className="text-muted mb-0">No leave dates configured.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Reason (optional)</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settings.leaveDates.map((leave: any, idx: number) => (
                                            <tr key={leave.id}>
                                                <td>
                                                    <input type="date" className="form-control form-control-sm" value={leave.date} onChange={e => updateLeaveDate(idx, 'date', e.target.value)} required />
                                                </td>
                                                <td>
                                                    <input type="text" className="form-control form-control-sm" value={leave.reason} onChange={e => updateLeaveDate(idx, 'reason', e.target.value)} placeholder="e.g. Christmas" />
                                                </td>
                                                <td>
                                                    <select className="form-select form-select-sm" value={leave.status} onChange={e => updateLeaveDate(idx, 'status', e.target.value)}>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeLeaveDate(idx)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white pt-4 pb-2 border-0 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-1">Special Schedule (Override)</h5>
                            <small className="text-muted">Override the normal weekly schedule for one specific date.</small>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSpecialSchedule}>
                            <Plus className="w-4 h-4 me-1 inline-block" /> Add Schedule
                        </button>
                    </div>
                    <div className="card-body">
                        {settings.specialSchedules.length === 0 ? (
                            <p className="text-muted mb-0">No special schedules configured.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Enabled</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                            <th>Duration (mins)</th>
                                            <th>Max Bookings</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settings.specialSchedules.map((sched: any, idx: number) => (
                                            <tr key={sched.id}>
                                                <td>
                                                    <input type="date" className="form-control form-control-sm" value={sched.date} onChange={e => updateSpecialSchedule(idx, 'date', e.target.value)} required />
                                                </td>
                                                <td>
                                                    <div className="form-check form-switch">
                                                        <input className="form-check-input" type="checkbox" checked={sched.enabled} onChange={e => updateSpecialSchedule(idx, 'enabled', e.target.checked)} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <input type="time" className="form-control form-control-sm" value={sched.startTime} onChange={e => updateSpecialSchedule(idx, 'startTime', e.target.value)} disabled={!sched.enabled} />
                                                </td>
                                                <td>
                                                    <input type="time" className="form-control form-control-sm" value={sched.endTime} onChange={e => updateSpecialSchedule(idx, 'endTime', e.target.value)} disabled={!sched.enabled} />
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control form-control-sm" min="5" value={sched.slotDurationMinutes} onChange={e => updateSpecialSchedule(idx, 'slotDurationMinutes', Number(e.target.value))} disabled={!sched.enabled} />
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control form-control-sm" min="1" value={sched.maxBookings} onChange={e => updateSpecialSchedule(idx, 'maxBookings', Number(e.target.value))} disabled={!sched.enabled} />
                                                </td>
                                                <td>
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSpecialSchedule(idx)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-end mb-5">
                    <button type="submit" className="btn btn-primary px-4 py-2" disabled={saving}>
                        {saving ? <Loader2 className="animate-spin w-4 h-4 d-inline me-2" /> : null}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminConsultationSettings;
