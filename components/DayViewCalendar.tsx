import React, { useMemo } from 'react';
import { Booking, FieldType } from '../types';
import { toMinutes, getFieldLabel, getFieldColor } from '../utils/booking';

interface DayViewCalendarProps {
  bookings: Booking[];
  onSelectTime: (startTime: string) => void;
  onSelectBooking: (booking: Booking) => void;
  suggestedSlots: string[];
}

interface OccupancyStatus {
    smallField: boolean;
    largeField: [boolean, boolean, boolean, boolean];
}

const OccupancyIndicator: React.FC<{ status: OccupancyStatus }> = ({ status }) => {
    if (!status.smallField && !status.largeField.some(Boolean)) {
        return null;
    }
    
    return (
        <div className="absolute inset-0 flex items-center justify-start gap-2 p-2 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity z-0">
            <div className="grid grid-cols-2 grid-rows-2 gap-1 w-8 h-8 flex-shrink-0" aria-label="Zauzetost velikog terena">
                <div title="Veliki teren - deo 1" className={`w-full h-full rounded-sm transition-colors ${status.largeField[0] ? 'bg-sky-400' : 'bg-gray-200'}`}></div>
                <div title="Veliki teren - deo 2" className={`w-full h-full rounded-sm transition-colors ${status.largeField[1] ? 'bg-sky-400' : 'bg-gray-200'}`}></div>
                <div title="Veliki teren - deo 3" className={`w-full h-full rounded-sm transition-colors ${status.largeField[2] ? 'bg-sky-400' : 'bg-gray-200'}`}></div>
                <div title="Veliki teren - deo 4" className={`w-full h-full rounded-sm transition-colors ${status.largeField[3] ? 'bg-sky-400' : 'bg-gray-200'}`}></div>
            </div>
            <div className="w-4 h-8 flex-shrink-0" aria-label="Zauzetost malog terena">
                <div title="Mali teren" className={`w-full h-full rounded-sm transition-colors ${status.smallField ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
            </div>
        </div>
    );
};

const getOccupancyStatus = (startTime: string, allBookings: Booking[]): OccupancyStatus => {
    const status: OccupancyStatus = {
        smallField: false,
        largeField: [false, false, false, false]
    };

    const slotStart = toMinutes(startTime);
    const slotEnd = slotStart + 60; // 1-hour slots

    for (const booking of allBookings) {
        const bookingStart = toMinutes(booking.start_time);
        const bookingEnd = toMinutes(booking.end_time);

        if (slotStart < bookingEnd && bookingStart < slotEnd) {
            switch (booking.field_type) {
                case FieldType.Small:
                    status.smallField = true;
                    break;
                case FieldType.LargeFull:
                    status.largeField = [true, true, true, true];
                    break;
                case FieldType.LargeHalf:
                    if (booking.field_index === 0) {
                        status.largeField[0] = true;
                        status.largeField[1] = true;
                    } else {
                        status.largeField[2] = true;
                        status.largeField[3] = true;
                    }
                    break;
                case FieldType.LargeQuarter:
                    if (booking.field_index >= 0 && booking.field_index < 4) {
                        status.largeField[booking.field_index] = true;
                    }
                    break;
            }
        }
    }
    return status;
};

const DayViewCalendar: React.FC<DayViewCalendarProps> = ({ bookings, onSelectTime, onSelectBooking, suggestedSlots }) => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM (23:00)
    const dayStartMinutes = 8 * 60;
    const pixelsPerHour = 64; // Corresponds to h-16 in Tailwind

    const occupancyByHour = useMemo(() => {
        const statuses: { [key: string]: OccupancyStatus } = {};
        hours.forEach(hour => {
            const timeString = `${String(hour).padStart(2, '0')}:00`;
            statuses[timeString] = getOccupancyStatus(timeString, bookings);
        });
        return statuses;
    }, [bookings, hours]);

    return (
        <div className="relative bg-white p-4 rounded-2xl shadow-lg">
            {/* Hour markers and clickable slots */}
            {hours.map(hour => {
                const timeString = `${String(hour).padStart(2, '0')}:00`;
                const isSuggested = suggestedSlots.includes(timeString);
                const occupancyStatus = occupancyByHour[timeString];

                return (
                    <div key={hour} className="relative h-16 border-t border-gray-100">
                        <span className="absolute -top-3 left-0 text-xs text-gray-400 bg-white px-1 font-medium">
                           {timeString}
                        </span>
                        <div 
                            className="absolute left-12 md:left-16 right-2 md:right-4 h-full cursor-pointer group"
                            onClick={() => onSelectTime(timeString)}
                        >
                            <OccupancyIndicator status={occupancyStatus} />
                            <div
                                className={`relative w-full h-full transition-all duration-300 rounded-lg flex items-center justify-center ${
                                    isSuggested
                                    ? 'bg-teal-50 border-2 border-dashed border-teal-400 opacity-100'
                                    : 'opacity-0 group-hover:bg-gray-50'
                                }`}
                            >
                                {isSuggested && (
                                <span className="font-bold text-teal-600 text-sm animate-pulse">
                                    Slobodno!
                                </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            {/* Render bookings */}
            {bookings.map(booking => {
                const top = ((toMinutes(booking.start_time) - dayStartMinutes) / 60) * pixelsPerHour;
                const height = ((toMinutes(booking.end_time) - toMinutes(booking.start_time)) / 60) * pixelsPerHour;
                return (
                    <div 
                        key={booking.id} 
                        onClick={() => onSelectBooking(booking)} 
                        className={`absolute left-12 md:left-16 right-2 md:right-4 p-2 rounded-lg border-l-4 cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:brightness-105 hover:z-10 ${getFieldColor(booking.field_type)} ${booking.status === 'pending' ? 'opacity-70 border-dashed border-amber-500' : ''}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        aria-label={`Detalji za rezervaciju: ${booking.user_name} od ${booking.start_time} do ${booking.end_time}. Status: ${booking.status === 'pending' ? 'Na čekanju' : 'Potvrđeno'}. Pritisnite Enter da otvorite.`}
                        aria-haspopup="dialog"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault(); // Prevent scrolling on spacebar press
                                onSelectBooking(booking); 
                            }
                        }}
                    >
                        <p className="font-bold text-sm truncate">{getFieldLabel(booking)}</p>
                        <p className="text-xs truncate">{booking.user_name}</p>
                        <p className="text-xs truncate">{booking.start_time} - {booking.end_time}</p>
                         {booking.status === 'pending' && <p className="text-xs font-semibold animate-pulse truncate text-amber-800">Na čekanju...</p>}
                    </div>
                );
            })}
        </div>
    );
};

export default DayViewCalendar;