import { Booking, FieldType, NewBooking, PricingRules } from '../types';

export const toMinutes = (time: string): number => {
    const [h, m] = String(time).split(':').map(Number);
    return h * 60 + (m || 0);
};

export const hasConflict = (newBooking: NewBooking, existingBooking: Booking, editingBookingId: string | null = null): boolean => {
    if (editingBookingId && existingBooking.id === editingBookingId) {
        return false; // Ne proveravaj konflikt sa samim sobom
    }

    if (newBooking.date !== existingBooking.date) return false;

    const startA = toMinutes(newBooking.start_time);
    const endA = toMinutes(newBooking.end_time);
    const startB = toMinutes(existingBooking.start_time);
    const endB = toMinutes(existingBooking.end_time);

    if (startA >= endA) return false; // Invalid new booking time

    const overlap = startA < endB && startB < endA;
    if (!overlap) return false;

    // Small field conflicts only with other small fields
    if (newBooking.field_type === FieldType.Small && existingBooking.field_type === FieldType.Small) {
        return true;
    }

    // Large field conflict logic
    if (newBooking.field_type.startsWith('large') && existingBooking.field_type.startsWith('large')) {
        // Full field conflicts with any other large field
        if (newBooking.field_type === FieldType.LargeFull || existingBooking.field_type === FieldType.LargeFull) {
            return true;
        }

        // Half field conflicts
        if (newBooking.field_type === FieldType.LargeHalf && existingBooking.field_type === FieldType.LargeHalf) {
            return newBooking.field_index === existingBooking.field_index;
        }

        const quarterToHalfMap: { [key: number]: number } = { 0: 0, 1: 0, 2: 1, 3: 1 };
        if (newBooking.field_type === FieldType.LargeHalf && existingBooking.field_type === FieldType.LargeQuarter) {
            return quarterToHalfMap[existingBooking.field_index] === newBooking.field_index;
        }
        if (newBooking.field_type === FieldType.LargeQuarter && existingBooking.field_type === FieldType.LargeHalf) {
            return quarterToHalfMap[newBooking.field_index] === existingBooking.field_index;
        }

        // Quarter field conflicts
        if (newBooking.field_type === FieldType.LargeQuarter && existingBooking.field_type === FieldType.LargeQuarter) {
            return newBooking.field_index === existingBooking.field_index;
        }
    }

    return false;
};


export const getFieldLabel = (booking: Booking | NewBooking | null): string => {
    if (!booking) return '';
    switch (booking.field_type) {
        case FieldType.LargeQuarter: return `Veliki (1/4 - ${booking.field_index + 1})`;
        case FieldType.LargeHalf: return `Veliki (1/2 - ${booking.field_index + 1})`;
        case FieldType.LargeFull: return 'Veliki (ceo)';
        case FieldType.Small: return 'Mali';
        default: return 'Teren';
    }
};

export const getFieldColor = (type: FieldType): string => {
    switch(type) {
        case FieldType.Small: return 'bg-emerald-100 border-emerald-300 text-emerald-900';
        case FieldType.LargeQuarter: return 'bg-sky-100 border-sky-300 text-sky-900';
        case FieldType.LargeHalf: return 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900';
        case FieldType.LargeFull: return 'bg-rose-100 border-rose-300 text-rose-900';
        default: return 'bg-gray-200 border-gray-400 text-gray-800';
    }
};

export const calculatePrice = (startTime: string, endTime: string, fieldType: FieldType, pricingRules: PricingRules): { price: number; rateName: string } => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
        return { price: 0, rateName: 'Greška' };
    }
    
    const startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    
    const durationInHours = (endMinutes - startMinutes) / 60;
    if (durationInHours <= 0) return { price: 0, rateName: 'Nevalidno vreme' };

    const startHourFloat = sh + sm / 60;

    const fieldRates = pricingRules.rates[fieldType];
    if (!fieldRates) {
        return { price: 0, rateName: 'Nema cene' };
    }

    let rateName: string;
    let hourlyRate: number;

    if (startHourFloat >= 16 && startHourFloat < 23) {
        rateName = 'Peak';
        hourlyRate = fieldRates.peak;
    } else if (startHourFloat >= 9 && startHourFloat < 16) {
        rateName = 'Off-Peak';
        hourlyRate = fieldRates.offPeak;
    } else { // Everything else (night 23-01, early morning 01-09)
        rateName = 'Noćna';
        hourlyRate = fieldRates.night;
    }

    const price = Math.round(hourlyRate * durationInHours);
    return { price, rateName };
};