/**
 * Frontend Subscription Utilities for Diet Plan
 */

export interface IDietMeals {
    breakfast: string;
    midMorning: string;
    lunch: string;
    evening: string;
    dinner: string;
    water: string;
    exercise: string;
    notes: string;
}

export interface IDietDaySchedule {
    dayIndex: number;
    date: string; // YYYY-MM-DD
    month: number;
    week: number;
    dayOfWeek: number;
    label: string;
    meals: IDietMeals;
    notes?: string;
    isCompleted?: boolean;
}

export function parseDateOnly(dateInput: string | Date): Date {
    if (typeof dateInput === 'string') {
        const dateStr = dateInput.split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDateToYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function formatReadableDate(dateInput: string | Date): string {
    const d = parseDateOnly(dateInput);
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    };
    return d.toLocaleDateString('en-US', options);
}

/**
 * Calculates calendar-month end date.
 * Handles month-end dates safely (e.g. Jan 31 + 1 month -> Feb 28/29).
 */
export function calculateSubscriptionEndDate(startDateInput: string | Date, durationMonths: number): string {
    const start = parseDateOnly(startDateInput);
    const startYear = start.getFullYear();
    const startMonth = start.getMonth(); // 0 to 11
    const startDay = start.getDate();

    const targetMonthTotal = startMonth + durationMonths;
    const targetYear = startYear + Math.floor(targetMonthTotal / 12);
    const targetMonth = targetMonthTotal % 12;

    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    let endYear = targetYear;
    let endMonth = targetMonth;
    let endDay: number;

    if (startDay === 1) {
        // Ends on last day of previous month
        const prevMonthDate = new Date(targetYear, targetMonth, 0);
        endYear = prevMonthDate.getFullYear();
        endMonth = prevMonthDate.getMonth();
        endDay = prevMonthDate.getDate();
    } else {
        const candidateDay = startDay - 1;
        endDay = Math.min(candidateDay, daysInTargetMonth);
    }

    const end = new Date(endYear, endMonth, endDay);
    return formatDateToYYYYMMDD(end);
}

/**
 * Generates an empty / default meal set.
 */
export function createDefaultMeals(): IDietMeals {
    return {
        breakfast: '',
        midMorning: '',
        lunch: '',
        evening: '',
        dinner: '',
        water: '3-4 Liters',
        exercise: '',
        notes: ''
    };
}

/**
 * Generates the full schedule array for Month -> Week -> Day from start to end date.
 * Preserves any existing meal content for matching dates or dayIndexes.
 */
export function generateSchedule(
    startDateStr: string,
    durationMonths: number,
    existingSchedule: IDietDaySchedule[] = []
): IDietDaySchedule[] {
    const startDate = parseDateOnly(startDateStr);
    const endDateStr = calculateSubscriptionEndDate(startDateStr, durationMonths);
    const endDate = parseDateOnly(endDateStr);

    const existingDateMap = new Map<string, IDietDaySchedule>();
    const existingIndexMap = new Map<number, IDietDaySchedule>();
    existingSchedule.forEach(item => {
        if (item.date) existingDateMap.set(item.date, item);
        if (item.dayIndex) existingIndexMap.set(item.dayIndex, item);
    });

    const schedule: IDietDaySchedule[] = [];
    let current = new Date(startDate);
    let dayIndex = 1;

    // We track Month number and Week within that month
    // Month 1 starts at dayIndex 1.
    while (current <= endDate) {
        const dateStr = formatDateToYYYYMMDD(current);
        
        // Month calculation:
        // Each calendar month boundary from start
        // Month 1 is first month, Month 2 is second month, etc.
        let month = 1;
        for (let m = 1; m <= durationMonths; m++) {
            const mEnd = parseDateOnly(calculateSubscriptionEndDate(startDateStr, m));
            if (current <= mEnd) {
                month = m;
                break;
            }
        }

        // Calculate start of this specific month
        let monthStartDate = startDate;
        if (month > 1) {
            const prevMonthEnd = parseDateOnly(calculateSubscriptionEndDate(startDateStr, month - 1));
            monthStartDate = new Date(prevMonthEnd);
            monthStartDate.setDate(monthStartDate.getDate() + 1);
        }

        const msPerDay = 1000 * 60 * 60 * 24;
        const daysIntoMonth = Math.round((current.getTime() - monthStartDate.getTime()) / msPerDay);
        const week = Math.floor(daysIntoMonth / 7) + 1;
        const dayOfWeek = (daysIntoMonth % 7) + 1;

        const weekdayName = current.toLocaleDateString('en-US', { weekday: 'short' });
        const dayLabel = `Day ${dayIndex} (${weekdayName}, ${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

        const existing = existingDateMap.get(dateStr) || existingIndexMap.get(dayIndex);

        schedule.push({
            dayIndex,
            date: dateStr,
            month,
            week,
            dayOfWeek,
            label: dayLabel,
            meals: existing?.meals ? { ...existing.meals } : createDefaultMeals(),
            notes: existing?.notes || '',
            isCompleted: existing?.isCompleted || false
        });

        // Advance to next day
        current.setDate(current.getDate() + 1);
        dayIndex++;
    }

    return schedule;
}

/**
 * Checks whether a day schedule has any diet content entered.
 */
export function hasDietContent(day: IDietDaySchedule): boolean {
    if (!day || !day.meals) return false;
    const m = day.meals;
    return !!(
        (m.breakfast && m.breakfast.trim()) ||
        (m.midMorning && m.midMorning.trim()) ||
        (m.lunch && m.lunch.trim()) ||
        (m.evening && m.evening.trim()) ||
        (m.dinner && m.dinner.trim()) ||
        (m.exercise && m.exercise.trim()) ||
        (day.notes && day.notes.trim())
    );
}
