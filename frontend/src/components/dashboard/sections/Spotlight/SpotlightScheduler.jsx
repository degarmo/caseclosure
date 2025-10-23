// src/components/spotlight/SpotlightScheduler.jsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

const SpotlightScheduler = ({ onSchedule, onCancel, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(
    initialDate || setMinutes(setHours(addDays(new Date(), 1), 12), 0)
  );

  const quickOptions = [
    { label: 'Tomorrow 9 AM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 9), 0) },
    { label: 'Tomorrow 12 PM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 12), 0) },
    { label: 'Tomorrow 6 PM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 18), 0) },
    { label: 'Next Week', getValue: () => setMinutes(setHours(addDays(new Date(), 7), 12), 0) },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      <Card className="relative w-full max-w-md p-6 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold">Schedule Post</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {quickOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(option.getValue())}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="border rounded-lg p-3">
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              inline
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSchedule(selectedDate)}
            className="bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule for {selectedDate.toLocaleDateString()}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SpotlightScheduler;