import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, addDoc, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
// FIX: Removed modular auth imports to use v8-compat API provided by `firebaseService` and resolve "no exported member" errors.
import { getFirebaseServices, initialAuthToken, bookingsCollectionPath, isDemoMode, type FirebaseServices } from '../services/firebaseService';
import { callGemini } from '../services/geminiService';
import { Booking, User, NewBooking, FieldType, PricingRules } from '../types';
import { getFieldLabel } from '../utils/booking';
import { getWeekDetails } from '../utils/date';
import BookingModal from './BookingModal';
import BookingDetailsModal from './BookingDetailsModal';
import DayViewCalendar from './DayViewCalendar';
import WeekViewCalendar from './WeekViewCalendar';
import ConfirmationModal from './ConfirmationModal';
import SettingsModal from './SettingsModal';
import InfoModal from './InfoModal';
import { CalendarIcon, LogoutIcon, SparklesIcon, SearchIcon, SettingsIcon, InfoIcon } from './icons';

interface BookingDashboardProps {
  user: User;
  onLogout: () => void;
}

const sampleBookings: Booking[] = [
    {
        id: 'demo-1',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        field_type: FieldType.LargeQuarter,
        field_index: 0,
        user_name: 'Demo Korisnik',
        contact: '012345',
        price: 25.00,
        status: 'confirmed',
    },
    {
        id: 'demo-2',
        date: new Date().toISOString().split('T')[0],
        start_time: '12:00',
        end_time: '14:00',
        field_type: FieldType.Small,
        field_index: 0,
        user_name: 'Test Tim',
        contact: '543210',
        price: 88.00,
        status: 'pending',
    }
];

const defaultPricingRules: PricingRules = {
  rates: {
    [FieldType.Small]:        { offPeak: 4800, peak: 6500, night: 4500 },
    [FieldType.LargeFull]:    { offPeak: 12000, peak: 16000, night: 10000 },
    [FieldType.LargeHalf]:    { offPeak: 7000, peak: 9500, night: 6000 },
    [FieldType.LargeQuarter]: { offPeak: 4000, peak: 5500, night: 3500 },
  },
  blockBookingDiscount: {
    small: 10,
    large: 15
  }
};


const BookingDashboard: React.FC<BookingDashboardProps> = ({ user, onLogout }) => {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; initialData: { date: string, startTime: string } | null; bookingToEdit: Booking | null }>({ isOpen: false, initialData: null, bookingToEdit: null });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; booking: Booking | null }>({ isOpen: false, booking: null });
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; onConfirm: () => void }>({ isOpen: false, onConfirm: () => {} });
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
  const [isFindingSlots, setIsFindingSlots] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchSuggestions, setAiSearchSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRules>(defaultPricingRules);


  const weekDetails = useMemo(() => getWeekDetails(date), [date]);
  
  useEffect(() => {
    try {
        const savedRules = localStorage.getItem('goalManagerPricingRules');
        if (savedRules) {
            setPricingRules(JSON.parse(savedRules));
        }
    } catch (error) {
        console.error("Failed to parse pricing rules from localStorage", error);
        localStorage.removeItem('goalManagerPricingRules');
    }
  }, []);

  useEffect(() => {
    getFirebaseServices()
      .then(svcs => {
        setFirebase(svcs);
        if (isDemoMode) {
          setIsDemo(true);
        }
      })
      .catch(err => {
        console.error("Initialization failed:", err);
        setFirebase(null);
        setIsDemo(true);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);
  
  const signIn = useCallback(async () => {
    if (!firebase) return;
    const { auth } = firebase;

    if (!auth.currentUser) {
      try {
        if (initialAuthToken) {
          // FIX: Switched to Firebase v8 compat API for signInWithCustomToken to resolve import error.
          await auth.signInWithCustomToken(initialAuthToken);
        } else {
          // FIX: Switched to Firebase v8 compat API for signInAnonymously to resolve import error.
          await auth.signInAnonymously();
        }
      } catch (error) { 
        console.error("Error signing in:", error); 
      }
    } else {
      setIsAuthReady(true);
    }
  }, [firebase]);

  useEffect(() => {
    if (isInitializing || isDemo) return;
    if (!firebase) return;
    const { auth } = firebase;
    // FIX: Switched to Firebase v8 compat API for onAuthStateChanged to resolve import error.
    const unsub = auth.onAuthStateChanged(user => setIsAuthReady(!!user));
    signIn();
    return () => unsub();
  }, [signIn, firebase, isInitializing, isDemo]);

  useEffect(() => {
    if (isInitializing) return;

    setIsLoading(true);
    if (isDemo) {
        let demoDataForDate = sampleBookings;
        if (viewMode === 'day') {
           demoDataForDate = sampleBookings.filter(b => b.date === date);
        }
        setTimeout(() => { // Simulate network delay
          setBookings(demoDataForDate);
          setIsLoading(false);
          setIsAuthReady(true);
        }, 300);
        return;
    }

    if (!isAuthReady || !date || !firebase) {
        if(firebase) setIsLoading(false);
        return;
    };
    const { db } = firebase;
    let q;
    if (viewMode === 'day') {
        q = query(collection(db, bookingsCollectionPath), where("date", "==", date));
    } else {
        q = query(collection(db, bookingsCollectionPath), 
            where("date", ">=", weekDetails.weekDates[0]),
            where("date", "<=", weekDetails.weekDates[6])
        );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
      setIsLoading(false);
    }, (error) => { 
      console.error("Error fetching bookings:", error); 
      setIsLoading(false); 
    });
    return () => unsub();
  }, [date, isAuthReady, firebase, isInitializing, isDemo, viewMode, weekDetails]);

  const filteredBookings = useMemo(() => {
    if (!searchQuery) {
        return bookings;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return bookings.filter(booking => 
        booking.user_name.toLowerCase().includes(lowercasedQuery) ||
        booking.contact.toLowerCase().includes(lowercasedQuery) ||
        booking.start_time.includes(lowercasedQuery) ||
        booking.end_time.includes(lowercasedQuery) ||
        getFieldLabel(booking).toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, bookings]);
  
  const handleSaveSettings = (newRules: PricingRules) => {
    setPricingRules(newRules);
    localStorage.setItem('goalManagerPricingRules', JSON.stringify(newRules));
    setIsSettingsOpen(false);
  };

  const handleGenerateSearchSuggestions = async () => {
      setIsGeneratingSuggestions(true);
      setAiSearchSuggestions([]);
      const bookingsSummary = bookings.length > 0 
        ? bookings.slice(0, 5).map(b => `- ${getFieldLabel(b)} u ${b.start_time} (rezervisao/la ${b.user_name})`).join('\n')
        : 'Nema rezervacija za danas.';
      const prompt = `Na osnovu sledećih rezervacija za danas, generiši 3 korisna i kratka predloga za pretragu. Primeri predloga: "Popodnevni termini", "Rezervacije korisnika Demo Korisnik", "Mali teren".
      Današnje rezervacije:
      ${bookingsSummary}
      Vrati samo predloge, svaki u novom redu, bez ikakvog dodatnog teksta ili nabrajanja.`;
      const result = await callGemini(prompt);
      const suggestions = result.split('\n').filter(s => s.trim() !== '');
      setAiSearchSuggestions(suggestions);
      setIsGeneratingSuggestions(false);
  };

  const handleFindAvailableSlots = async () => {
    setIsFindingSlots(true);
    setSuggestedSlots([]);
    const bookingsInfo = bookings.map(b => `- ${b.start_time} do ${b.end_time}`).join('\n');
    const prompt = `Na osnovu liste postojećih rezervacija za fudbalski teren za datum ${date}, predloži tri slobodna termina od po sat vremena u formatu HH:MM. Radno vreme je od 08:00 do 23:00. Zauzeti termini su:\n${bookingsInfo || 'Nema rezervacija'}\n\nOdgovor formatiraj SAMO kao listu termina razdvojenih zarezom, npr: "14:00, 16:00, 19:00".`;
    const result = await callGemini(prompt);
    
    const times = result.match(/\d{2}:\d{2}/g) || [];
    setSuggestedSlots(times);
    setIsFindingSlots(false);
  };

  const handleSaveBooking = async (newBookingData: Omit<NewBooking, 'status'>) => {
      const newBooking: NewBooking = {
          ...newBookingData,
          status: 'pending',
      }
      if (isDemo) {
        const bookingWithId: Booking = { ...newBooking, id: `demo-${Date.now()}` };
        setBookings(prev => [...prev, bookingWithId]);
        setBookingModal({isOpen: false, initialData: null, bookingToEdit: null});
        return true;
      }
      if (!firebase) {
        console.error("Firebase not initialized. Cannot save booking.");
        return false;
      }
      const { db } = firebase;
      try {
          await addDoc(collection(db, bookingsCollectionPath), newBooking);
          setBookingModal({isOpen: false, initialData: null, bookingToEdit: null});
          return true;
      } catch (error) { 
          console.error("Error saving booking:", error);
          return false;
      }
  };
  
  const handleSaveOrUpdateBooking = async (bookingData: Omit<Booking, 'id' | 'status'>, id?: string): Promise<boolean> => {
    if (id) { // UPDATE
        if (isDemo) {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, ...bookingData } : b));
            setBookingModal({ isOpen: false, initialData: null, bookingToEdit: null });
            return true;
        }
        if (!firebase) return false;
        try {
            const bookingRef = doc(firebase.db, bookingsCollectionPath, id);
            await updateDoc(bookingRef, bookingData as { [x: string]: any }); // Cast to avoid type issues with updateDoc
            setBookingModal({ isOpen: false, initialData: null, bookingToEdit: null });
            return true;
        } catch (error) {
            console.error("Error updating booking:", error);
            return false;
        }
    } else { // CREATE
        return handleSaveBooking(bookingData);
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    setDetailsModal({ isOpen: false, booking: null });
    if (isDemo) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed' } : b));
        return;
    }
    if (!firebase) return;
    try {
        const bookingRef = doc(firebase.db, bookingsCollectionPath, booking.id);
        await updateDoc(bookingRef, { status: 'confirmed' });
    } catch (error) {
        console.error("Error confirming booking:", error);
    }
  };
  
  const handleDeleteBooking = async (bookingId: string) => {
    if (isDemo) {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      return;
    }
    if (!firebase) {
      console.error("Firebase not available for deletion.");
      return;
    }
    try {
      await deleteDoc(doc(firebase.db, bookingsCollectionPath, bookingId));
      console.log(`Booking ${bookingId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const handleDeleteRequest = (booking: Booking) => {
    setDetailsModal({ isOpen: false, booking: null });
    setConfirmationModal({
      isOpen: true,
      onConfirm: () => {
        handleDeleteBooking(booking.id);
        setConfirmationModal({ isOpen: false, onConfirm: () => {} });
      },
    });
  };

  const handleEditRequest = (booking: Booking) => {
    setDetailsModal({ isOpen: false, booking: null });
    setBookingModal({ isOpen: true, initialData: null, bookingToEdit: booking });
  };

  const handleSelectTimeSlot = (startTime: string) => {
    setBookingModal({ isOpen: true, initialData: { date, startTime }, bookingToEdit: null });
    setSuggestedSlots([]);
  };

  const handleSelectTimeSlotForWeek = (date: string, startTime: string) => {
    setBookingModal({ isOpen: true, initialData: { date, startTime }, bookingToEdit: null });
  };

  const handleDateChange = (offset: number) => {
    const currentDate = new Date(date + 'T00:00:00Z');
    if (viewMode === 'day') {
        currentDate.setUTCDate(currentDate.getUTCDate() + offset);
    } else {
        currentDate.setUTCDate(currentDate.getUTCDate() + (offset * 7));
    }
    setDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <>
      <BookingModal isOpen={bookingModal.isOpen} onClose={() => setBookingModal({ isOpen: false, initialData: null, bookingToEdit: null })} onSave={handleSaveOrUpdateBooking} initialData={bookingModal.initialData} bookingToEdit={bookingModal.bookingToEdit} user={user} existingBookings={bookings} pricingRules={pricingRules}/>
      <BookingDetailsModal isOpen={detailsModal.isOpen} onClose={() => setDetailsModal({ isOpen: false, booking: null })} booking={detailsModal.booking} onDeleteRequest={handleDeleteRequest} onConfirmBooking={handleConfirmBooking} onEditRequest={handleEditRequest}/>
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, onConfirm: () => {} })}
        onConfirm={confirmationModal.onConfirm}
        title="Potvrda brisanja"
        message="Da li ste sigurni da želite da obrišete ovu rezervaciju?"
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialRules={pricingRules}
      />
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      
      <div className="bg-gray-50 min-h-screen text-gray-800">
        <header className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-40">
          <div className="container mx-auto p-4 flex justify-between items-center">
             <h1 className="text-xl sm:text-2xl font-bold text-gray-800">GoalManager Pro</h1>
             <div className="flex items-center gap-1 sm:gap-3">
                <span className="text-gray-600 mr-2 hidden sm:block"><strong>{user.name}</strong></span>
                 <button onClick={() => setIsInfoModalOpen(true)} title="Informacije o poslovanju" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <InfoIcon className="h-6 w-6" />
                </button>
                 <button onClick={() => setIsSettingsOpen(true)} title="Podešavanja cena" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <SettingsIcon className="h-6 w-6" />
                </button>
                <button onClick={onLogout} className="flex items-center bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors"><LogoutIcon /><span className="hidden sm:inline sm:ml-2">Odjava</span></button>
             </div>
          </div>
        </header>
        
        {isDemo && (
            <div className="bg-amber-400 text-center py-2 px-4 text-amber-900 font-semibold shadow-md">
                DEMO REŽIM: Podaci se ne čuvaju.
            </div>
        )}

        <main className="container mx-auto p-2 sm:p-4 md:p-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg min-h-[500px]">
                {isInitializing ? (
                   <div className="text-center p-8"><p className="text-gray-500 animate-pulse text-lg">Inicijalizacija aplikacije...</p></div>
                ) : !firebase && !isDemo ? (
                  <div className="text-center p-8 text-red-800 bg-red-100 rounded-lg">
                    <h2 className="text-xl font-bold mb-2">Greška pri Povezivanju</h2>
                    <p className="text-gray-600">Nije moguće uspostaviti vezu sa servisom za rezervacije. Proverite da li je aplikacija ispravno konfigurisana.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                             <div className="p-1 bg-gray-100 rounded-lg flex text-sm">
                                <button onClick={() => setViewMode('day')} className={`px-3 py-1 font-semibold rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow text-teal-600' : 'text-gray-600 hover:bg-gray-200/50'}`}>Dan</button>
                                <button onClick={() => setViewMode('week')} className={`px-3 py-1 font-semibold rounded-md transition-colors ${viewMode === 'week' ? 'bg-white shadow text-teal-600' : 'text-gray-600 hover:bg-gray-200/50'}`}>Nedelja</button>
                            </div>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                                <button onClick={() => handleDateChange(-1)} title={viewMode === 'day' ? 'Prethodni dan' : 'Prethodna nedelja'} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-md border-r border-gray-300 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                {viewMode === 'day' ? (
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="font-semibold text-teal-700 border-0 focus:ring-0 bg-transparent p-1.5 w-36"/>
                                ) : (
                                    <span className="font-semibold text-teal-700 px-2 sm:px-4 py-1.5 whitespace-nowrap">{weekDetails.formattedRange}</span>
                                )}
                                <button onClick={() => handleDateChange(1)} title={viewMode === 'day' ? 'Sledeći dan' : 'Sledeća nedelja'} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-md border-l border-gray-300 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch">
                             <button 
                              onClick={handleFindAvailableSlots} 
                              disabled={isFindingSlots || viewMode === 'week'}
                              title={viewMode === 'week' ? 'Dostupno samo u dnevnom prikazu' : 'AI Predlog Termina'}
                              className="w-full sm:w-auto bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:bg-teal-400 disabled:cursor-not-allowed"
                            >
                              <SparklesIcon /> {isFindingSlots ? 'Analiziram...' : 'AI Predlog'}
                            </button>
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (aiSearchSuggestions.length > 0) {
                                            setAiSearchSuggestions([]);
                                        }
                                    }}
                                    placeholder="Pretraži..."
                                    className="w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                                />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {aiSearchSuggestions.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fade-in-up">
                                        <p className="text-xs text-gray-500 p-2 border-b font-semibold">AI Predlozi:</p>
                                        {aiSearchSuggestions.map((suggestion, index) => (
                                            <button 
                                                key={index} 
                                                onClick={() => {
                                                    setSearchQuery(suggestion);
                                                    setAiSearchSuggestions([]);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={handleGenerateSearchSuggestions} 
                                disabled={isGeneratingSuggestions}
                                title="Dohvati AI predloge za pretragu"
                                className="p-2 bg-violet-500 text-white font-bold rounded-lg hover:bg-violet-600 transition-colors flex items-center justify-center disabled:bg-violet-400 disabled:cursor-wait shrink-0"
                            >
                                <SparklesIcon />
                            </button>
                        </div>
                    </div>
                    {isLoading ? (
                      <div className="text-center p-8"><p className="text-gray-500 animate-pulse">Učitavanje kalendara...</p></div>
                    ) : viewMode === 'day' ? (
                      <DayViewCalendar bookings={filteredBookings} onSelectTime={handleSelectTimeSlot} onSelectBooking={(booking) => setDetailsModal({ isOpen: true, booking })} suggestedSlots={suggestedSlots} />
                    ) : (
                      <WeekViewCalendar bookings={filteredBookings} weekDates={weekDetails.weekDates} onSelectTime={handleSelectTimeSlotForWeek} onSelectBooking={(booking) => setDetailsModal({ isOpen: true, booking })} />
                    )}
                  </>
                )}
            </div>
        </main>
      </div>
    </>
  );
};

export default BookingDashboard;