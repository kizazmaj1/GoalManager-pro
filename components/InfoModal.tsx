import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 sm:p-0 backdrop-blur-sm modal-content-container">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto modal-content">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 border-b pb-3">Vodič i Informacije o Poslovanju</h3>
        <div className="space-y-6 text-gray-700 text-sm sm:text-base">

          <Section title="Osnovne Informacije">
            <InfoItem label="Naziv" value="FK Bezanija - Fudbalski Tereni" />
            <InfoItem label="Telefon" value="+381 63 1110407" />
            <InfoItem label="Radno vreme" value="08:00 - 23:00 (7 dana u nedelji)" />
          </Section>

          <Section title="Opis">
            <p>FK Bezanija nudi profesionalne fudbalske terene sa vestackom travom i osvetljenjem za nocne termine. Nasi tereni su idealni za treninge, turnire, rekreativni fudbal i korporativne događaje. Rezervisite online ili pozovite za vise informacija.</p>
          </Section>

          <Section title="Uslovi Rezervacije (Q&A)">
            <InfoItem label="Kakvi su uslovi rezervacije?" value="Rezervacije mozete napraviti online ili telefonom. Potreban je depozit od 50% za potvrdu termina. Otkazivanje je moguce do 24h pre termina." />
            <InfoItem label="Da li imate parking?" value="Da, imamo besplatan parking za nase korisnike." />
            <InfoItem label="Kakva je podloga na terenima?" value="Nasi tereni imaju profesionalnu vestacku travu koja je idealna za sve vremenske uslove." />
          </Section>
          
          <Section title="Dostupni Sadržaji">
             <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <li>Pristupačnost za invalidska kolica</li>
                <li>Wi-Fi</li>
                <li>Dostupnost parkinga</li>
                <li>Svlacionice</li>
                <li>Osvetljenje</li>
                <li>Vestacka trava</li>
             </ul>
          </Section>

        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button onClick={onClose} className="px-5 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600">Zatvori</button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
    <div className="pl-2 border-l-2 border-teal-200 space-y-2">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="font-semibold text-gray-600">{label}</p>
    <p className="text-gray-800">{value}</p>
  </div>
);

export default InfoModal;