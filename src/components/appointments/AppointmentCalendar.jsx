// src/components/AppointmentCalendar.js
import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSelector } from 'react-redux';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales,
});

const AppointmentCalendar = () => {
    const appointments = useSelector(state => state.appointments.appointments);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const events = appointments.map((appt) => {
        const today = new Date(appt.date + " CST"); // Use actual date if available

        const [hours, minutes] = appt.time.split(':');
        const start = new Date(today.setHours(+hours, +minutes, 0));
        const end = new Date(start.getTime() + 30 * 60000); // 30 min slot

        return {
            title: `${appt.full_name} (${appt.status})`,
            start,
            end,
            allDay: false,
            ...appt
        };
    });

    return (
        <div style={{ height: '600px', margin: '20px' }}>
            <Calendar
                localizer={localizer}
                events={events}
                defaultView="day"
                views={['day', 'week', 'agenda']}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onSelectEvent={(event) => {
                    console.log(event);

                    setSelectedEvent(event)
                }}
            />
            {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
                        <h1 className="text-2xl font-bold mb-4 text-gray-800">Appointment Details</h1>
                        <div className="space-y-2 text-gray-700">
                            <p><span className="font-semibold">Patient:</span> {selectedEvent.full_name}</p>
                            <p><span className="font-semibold">Time:</span> {selectedEvent.time}</p>
                            <p><span className="font-semibold">Status:</span> {selectedEvent.status}</p>
                            <p><span className="font-semibold">SSN:</span> {selectedEvent.ssn}</p>
                            <p><span className="font-semibold">Doctor:</span> {selectedEvent.doctor_name}</p>
                        </div>
                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentCalendar;
