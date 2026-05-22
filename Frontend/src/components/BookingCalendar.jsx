import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

const BookingCalendar = ({ selectedDate, onSelect }) => {
  return (
    <div className="flex justify-center p-4 bg-white/40 backdrop-blur-md rounded-3xl border border-rose-mid/30 shadow-sm">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={es}
        disabled={{ before: new Date() }} // Bloquea días pasados
        modifiersClassNames={{
          selected: 'bg-rose-text text-white rounded-full font-bold', // Día seleccionado
          today: 'text-rose-deep font-bold underline decoration-2' // Hoy
        }}
        classNames={{
          caption: "flex justify-between items-center px-2 py-2 mb-4",
          caption_label: "font-serif text-lg capitalize text-text-dark",
          nav: "flex gap-2",
          nav_button: "h-8 w-8 flex items-center justify-center rounded-full border border-rose-mid text-rose-text hover:bg-rose-light transition-colors",
          table: "w-full border-collapse",
          head_cell: "text-[10px] uppercase tracking-[0.2em] text-text-mid font-bold pb-4",
          cell: "p-2 text-center",
          day: "h-10 w-10 p-3 text-sm font-medium rounded-full transition-all hover:bg-rose-light/50 active:scale-90",
        }}
        components={{
          IconLeft: () => <span className="text-xl">‹</span>,
          IconRight: () => <span className="text-xl">›</span>,
        }}
      />
    </div>
  );
};

export default BookingCalendar;