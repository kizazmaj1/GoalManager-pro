import React, { useState, useEffect } from 'react';
import { PricingRules, FieldType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newRules: PricingRules) => void;
  initialRules: PricingRules;
}

const fieldLabels: { [key in FieldType]: string } = {
    [FieldType.Small]: 'Mali teren',
    [FieldType.LargeQuarter]: 'Veliki (1/4)',
    [FieldType.LargeHalf]: 'Veliki (1/2)',
    [FieldType.LargeFull]: 'Veliki (ceo)',
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialRules }) => {
  const [rules, setRules] = useState<PricingRules>(initialRules);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRules(JSON.parse(JSON.stringify(initialRules))); // Deep copy to avoid modifying parent state directly
    }
  }, [isOpen, initialRules]);

  const handleRateChange = (fieldType: FieldType, rateType: 'peak' | 'offPeak' | 'night', value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setRules(prev => ({
        ...prev,
        rates: {
          ...prev.rates,
          [fieldType]: {
            ...prev.rates[fieldType],
            [rateType]: numValue
          }
        }
      }));
    }
  };
  
  const handleDiscountChange = (type: 'small' | 'large', value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setRules(prev => ({
        ...prev,
        blockBookingDiscount: {
          ...prev.blockBookingDiscount,
          [type]: numValue
        }
      }));
    }
  };

  const handleSave = () => {
      setIsSaving(true);
      onSave(rules);
      // In a real app, you might have an async operation here
      setTimeout(() => setIsSaving(false), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 sm:p-0 backdrop-blur-sm modal-content-container">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto modal-content">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Podešavanja Cena</h3>
        <div className="space-y-6">
            
            {/* Field Rates */}
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Cene po satu (RSD)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(rules.rates) as FieldType[]).map(fieldType => (
                        <div key={fieldType} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="font-bold text-gray-700 mb-2">{fieldLabels[fieldType]}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="block text-xs font-medium text-gray-500">Peak</label><input type="number" value={rules.rates[fieldType].peak} onChange={e => handleRateChange(fieldType, 'peak', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-500">Off-Peak</label><input type="number" value={rules.rates[fieldType].offPeak} onChange={e => handleRateChange(fieldType, 'offPeak', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-500">Noćna</label><input type="number" value={rules.rates[fieldType].night} onChange={e => handleRateChange(fieldType, 'night', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Block Booking Discounts */}
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Popusti za Stalne Termine (%)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Veliki teren (ceo, 1/2, 1/4)</label>
                        <input type="number" value={rules.blockBookingDiscount.large} onChange={e => handleDiscountChange('large', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                         <label className="block text-sm font-medium text-gray-600 mb-1">Mali teren</label>
                        <input type="number" value={rules.blockBookingDiscount.small} onChange={e => handleDiscountChange('small', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                     </div>
                 </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50">Otkaži</button>
              <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Čuvanje...' : 'Sačuvaj Promene'}</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;