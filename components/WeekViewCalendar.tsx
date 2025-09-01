import React from 'react';
import { Booking } from '../types';
import { toMinutes, getFieldLabel, getFieldColor } from '../utils/booking';

interface WeekViewCalendarProps {
  bookings: Booking[];
  weekDates: string[];
  onSelectTime: (date: string, startTime: string) => void;
  onSelectBooking: (booking: Booking) => void;
}

const WeekViewCalendar: React.FC<WeekViewCalendarProps> = ({ bookings, weekDates, onSelectTime, onSelectBooking }) => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM
    const dayStartMinutes = 8 * 60;
    const pixelsPerHour = 64;

    const dayFormatter = new Intl.DateTimeFormat('sr-RS', { weekday: 'short' });
    const dateFormatter = new Intl.DateTimeFormat('sr-RS', { day: 'numeric', month: 'numeric' });

    const bookingsByDate = React.useMemo(() => {
        const grouped: { [key: string]: Booking[] } = {};
        bookings.forEach(booking => {
            if (!grouped[booking.date]) {
                grouped[booking.date] = [];
            }
            grouped[booking.date].push(booking);
        });
        return grouped;
    }, [bookings]);

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
            <div className="grid grid-cols-[4rem_repeat(7,minmax(120px,1fr))] min-w-[800px]">
                {/* Empty corner */}
                <div className="sticky top-0 left-0 z-30 bg-white border-b border-r border-gray-200">&nbsp;</div>
                {/* Day headers */}
                {weekDates.map(dateStr => (
                    <div key={dateStr} className="sticky top-0 z-20 bg-white text-center py-2 border-b-2 border-gray-200">
                        <p className="font-semibold text-gray-700">{dayFormatter.format(new Date(dateStr + 'T12:00:00'))}</p>
                        <p className="text-sm text-gray-500">{dateFormatter.format(new Date(dateStr + 'T12:00:00'))}</p>
                    </div>
                ))}

                {/* Time scale */}
                <div className="row-start-2 col-start-1 sticky left-0 bg-white z-20 border-r border-gray-200">
                    {hours.map(hour => (
                        <div key={hour} style={{ height: `${pixelsPerHour}px` }} className="relative flex justify-end items-start pr-2">
                            <span className="text-xs text-gray-400 absolute -top-2 font-medium">{`${String(hour).padStart(2, '0')}:00`}</span>
                        </div>
                    ))}
                </div>

                {/* Grid content */}
                {weekDates.map((dateStr) => (
                    <div key={dateStr} className="row-start-2 relative border-l border-gray-100">
                        {/* Grid lines & clickable slots */}
                        {hours.map(hour => (
                            <div
                                key={hour}
                                style={{ height: `${pixelsPerHour}px` }}
                                className="border-t border-gray-100 cursor-pointer group hover:bg-teal-50/50 transition-colors"
                                onClick={() => onSelectTime(dateStr, `${String(hour).padStart(2, '0')}:00`)}
                            />
                        ))}

                        {/* Bookings for this day */}
                        {(bookingsByDate[dateStr] || []).map(booking => {
                            const top = ((toMinutes(booking.start_time) - dayStartMinutes) / 60) * pixelsPerHour;
                            const height = ((toMinutes(booking.end_time) - toMinutes(booking.start_time)) / 60) * pixelsPerHour;
                            return (
                                <div
                                    key={booking.id}
                                    onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                                    className={`absolute left-1 right-1 p-1 rounded border-l-4 cursor-pointer overflow-hidden transition-all text-[11px] hover:shadow-lg hover:z-10 ${getFieldColor(booking.field_type)} ${booking.status === 'pending' ? 'opacity-70 border-dashed border-amber-500' : ''}`}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                    aria-label={`Rezervacija za ${booking.user_name} od ${booking.start_time} do ${booking.end_time}. Status: ${booking.status === 'pending' ? 'Na čekanju' : 'Potvrđeno'}.`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectBooking(booking); }}
                                >
                                    <p className="font-bold truncate">{getFieldLabel(booking)}</p>
                                    <p className="truncate">{booking.user_name}</p>
                                    {booking.status === 'pending' && <p className="text-xs font-semibold animate-pulse truncate text-amber-800">Na čekanju...</p>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeekViewCalendar;