export function getWeekDetails(selectedDateStr: string): { weekDates: string[], weekStart: Date, weekEnd: Date, formattedRange: string } {
    const selectedDate = new Date(selectedDateStr + 'T00:00:00Z');
    
    // getDay() returns 0 for Sunday, 1 for Monday, etc. We want Monday to be the start.
    const dayOfWeek = selectedDate.getUTCDay();
    const diff = selectedDate.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday
    
    const weekStart = new Date(selectedDate.setUTCDate(diff));

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(weekStart);
        nextDay.setUTCDate(weekStart.getUTCDate() + i);
        weekDates.push(nextDay.toISOString().split('T')[0]);
    }

    const weekEnd = new Date(weekDates[6] + 'T00:00:00Z');
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const formatter = new Intl.DateTimeFormat('sr-RS', options);
    const formattedRange = `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;

    return {
        weekDates,
        weekStart,
        weekEnd,
        formattedRange
    };
}
