import React from 'react';
import { Booking } from '../types';
import { getFieldLabel } from '../utils/booking';
import { TrashIcon, CalendarIcon, ClockIcon, UserCircleIcon, PriceTagIcon, PencilIcon } from './icons';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteRequest: (booking: Booking) => void;
  onConfirmBooking: (booking: Booking) => void;
  onEditRequest: (booking: Booking) => void;
  booking: Booking | null;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, onDeleteRequest, onConfirmBooking, onEditRequest, booking }) => {
    if (!isOpen || !booking) return null;

    const statusLabel = booking.status === 'confirmed' ? 'Potvrđena' : 'Na čekanju';
    const statusClass = booking.status === 'confirmed' ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100';


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 sm:p-0 backdrop-blur-sm modal-content-container">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-md relative modal-content">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Detalji Rezervacije</h3>
                <div className="space-y-3 text-gray-700">
                    <p className="flex items-center"><UserCircleIcon className="text-gray-400" /> <strong>Teren:</strong> <span className="ml-2">{getFieldLabel(booking)}</span></p>
                    <p className="flex items-center"><CalendarIcon className="text-gray-400" /> <strong>Datum:</strong> <span className="ml-2">{new Date(booking.date + 'T00:00:00').toLocaleDateString('sr-RS')}</span></p>
                    <p className="flex items-center"><ClockIcon className="text-gray-400" /> <strong>Vreme:</strong> <span className="ml-2">{booking.start_time} - {booking.end_time}</span></p>
                    <p className="flex items-center"><UserCircleIcon className="text-gray-400" /> <strong>Rezervisao:</strong> <span className="ml-2">{booking.user_name}</span></p>
                    <p className="flex items-center"><UserCircleIcon className="text-gray-400" /> <strong>Kontakt:</strong> <span className="ml-2">{booking.contact}</span></p>
                    <div className="pt-2 pb-1">
                      <p><strong>Status:</strong> <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${statusClass}`}>{statusLabel}</span></p>
                    </div>
                    <p className="text-xl font-bold text-teal-600 flex items-center pt-2"><PriceTagIcon className="text-gray-400" /><strong>Cena:</strong> <span className="ml-2">{booking.price.toFixed(2)} RSD</span></p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                    {booking.status === 'pending' && (
                         <button onClick={() => onConfirmBooking(booking)} className="w-full px-4 py-2.5 text-base bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 flex items-center justify-center">Potvrdi Rezervaciju</button>
                    )}
                    <button onClick={() => onEditRequest(booking)} className="w-full px-4 py-2.5 text-base bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 flex items-center justify-center"><PencilIcon />Izmeni Rezervaciju</button>
                    <button onClick={() => onDeleteRequest(booking)} className="w-full px-4 py-2.5 text-base bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 flex items-center justify-center"><TrashIcon />Obriši Rezervaciju</button>
                    <button onClick={onClose} className="w-full mt-2 px-4 py-2.5 text-base bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Zatvori</button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;