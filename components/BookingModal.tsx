import React, { useState, useEffect, useMemo } from 'react';
import { Booking, FieldType, NewBooking, User, PricingRules } from '../types';
import { hasConflict, calculatePrice } from '../utils/booking';
import { CheckCircleIcon } from './icons';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Omit<Booking, 'id' | 'status'>, id?: string) => Promise<boolean>;
  initialData: { date: string; startTime: string } | null;
  bookingToEdit: Booking | null;
  user: User;
  existingBookings: Booking[];
  pricingRules: PricingRules;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, initialData, bookingToEdit, user, existingBookings, pricingRules }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [fieldType, setFieldType] = useState<FieldType>(FieldType.LargeQuarter);
    const [fieldIndex, setFieldIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [view, setView] = useState<'form' | 'success'>('form');

    const isEditMode = !!bookingToEdit;

    useEffect(() => {
        if (isOpen) {
            setView('form');
            setMessage('');
            setIsSaving(false);

            if (bookingToEdit) { // EDIT MODE
                setDate(bookingToEdit.date);
                setStartTime(bookingToEdit.start_time);
                setEndTime(bookingToEdit.end_time);
                setFieldType(bookingToEdit.field_type);
                setFieldIndex(bookingToEdit.field_index);
            } else if (initialData) { // NEW BOOKING MODE
                setDate(initialData.date);
                setStartTime(initialData.startTime);
                const startHour = parseInt(initialData.startTime.split(':')[0], 10);
                const endHour = startHour < 23 ? startHour + 1 : 23;
                setEndTime(`${String(endHour).padStart(2, '0')}:00`);
                setFieldType(FieldType.LargeQuarter);
                setFieldIndex(0);
            }
        }
    }, [isOpen, initialData, bookingToEdit]);

    const { computedPrice, rateName } = useMemo(() => {
        if (!startTime || !endTime || !fieldType) {
            return { computedPrice: 0, rateName: '' };
        }
        const { price, rateName: calculatedRateName } = calculatePrice(startTime, endTime, fieldType, pricingRules);
        return { computedPrice: price, rateName: calculatedRateName };
    }, [fieldType, startTime, endTime, pricingRules]);

    const handleSave = async () => {
        setMessage('');
        if (computedPrice <= 0) {
            setMessage('Krajnje vreme mora biti posle početnog.');
            return;
        }
        
        const bookingData: Omit<Booking, 'id' | 'status'> = {
            date: date,
            start_time: startTime,
            end_time: endTime,
            field_type: fieldType,
            field_index: Number(fieldIndex),
            user_name: bookingToEdit?.user_name || user.name,
            contact: bookingToEdit?.contact || user.contact,
            price: computedPrice
        };
        
        if (existingBookings.some(b => hasConflict({ ...bookingData, status: 'pending' }, b, bookingToEdit?.id))) {
            setMessage('Konflikt termina! Izaberite drugo vreme ili teren.');
            return;
        }
        
        setIsSaving(true);
        const success = await onSave(bookingData, bookingToEdit?.id);
        setIsSaving(false);

        if (success) {
            setView('success');
        } else {
            setMessage("Došlo je do greške prilikom čuvanja. Pokušajte ponovo.");
        }
    };

    const fieldIndexOptions = useMemo(() => {
        if (fieldType === FieldType.LargeQuarter) return [0, 1, 2, 3];
        if (fieldType === FieldType.LargeHalf) return [0, 1];
        return [];
    }, [fieldType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 sm:p-0 backdrop-blur-sm modal-content-container">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-lg relative modal-content">
                {view === 'form' ? (
                    <>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{isEditMode ? 'Izmena Rezervacije' : 'Nova Rezervacija'}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Datum</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Početak</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kraj</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vrsta terena</label><select value={fieldType} onChange={e => { setFieldType(e.target.value as FieldType); setFieldIndex(0); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value={FieldType.LargeQuarter}>Veliki teren (1/4)</option><option value={FieldType.LargeHalf}>Veliki teren (1/2)</option><option value={FieldType.LargeFull}>Veliki teren (ceo)</option><option value={FieldType.Small}>Mali teren</option></select></div>
                            {fieldIndexOptions.length > 0 && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Deo terena</label><select value={fieldIndex} onChange={e => setFieldIndex(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">{fieldIndexOptions.map(i => <option key={i} value={i}>{i + 1}</option>)}</select></div>)}
                            <div className="text-center bg-teal-50 p-3 rounded-lg">
                                <span className="text-sm font-medium text-teal-800">Procenjena cena ({rateName} tarifa)</span>
                                <p className="text-2xl font-bold text-teal-600">{computedPrice.toFixed(2)} RSD</p>
                            </div>
                            {!isEditMode && (<p className="text-sm text-gray-600 mt-4 p-2 bg-gray-100 rounded-lg text-center">Potvrda o statusu rezervacije biće Vam poslata na: <strong>{user.contact}</strong></p>)}
                            {message && <p className="text-sm text-center font-semibold p-2 rounded-lg bg-red-100 text-red-800">{message}</p>}
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50">Otkaži</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Čuvanje...' : (isEditMode ? 'Sačuvaj Promene' : 'Pošalji Zahtev')}</button>
                            </div>
                        </div>
                    </>
                ) : (
                     <div className="text-center p-4 sm:p-8">
                        <CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{isEditMode ? 'Uspešno Izmenjeno!' : 'Zahtev Poslat!'}</h3>
                        <p className="text-gray-600">
                          {isEditMode ? 'Detalji rezervacije su uspešno ažurirani.' : 'Vaša rezervacija je evidentirana i čeka na potvrdu. Dobićete SMS ili email obaveštenje čim termin bude odobren od strane administratora.'}
                        </p>
                        <div className="mt-6">
                            <button onClick={onClose} className="w-full px-4 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-transform hover:scale-105">
                                U redu
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;