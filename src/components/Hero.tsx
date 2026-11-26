import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown, Clock3, MapPin } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';
import { ListenButton } from './AccessibilityTools';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const clinicAddress = language === 'fil' ? siteContent.settings.clinicAddressFil : siteContent.settings.clinicAddress;
  const clinicHours = language === 'fil' ? siteContent.settings.clinicHoursFil : siteContent.settings.clinicHours;
  const bookingEnabled = appointmentRequestAvailability === 'available';
  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="overview" data-speech-section className="hero-section-enter bg-[#0f4d3c] text-white">
      <div className="relative min-h-[300px] sm:min-h-[340px] flex items-center overflow-hidden border-b border-white/10">
        <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0f4d3c]/88" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-14">
          <div className="flex w-full flex-col gap-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <h1 className="hero-enter max-w-xl text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.08] text-white">
              Mayor Moises R. Flores Health Center
            </h1>
            <ListenButton className="mt-4 border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            <div className="hero-actions mt-7 flex flex-wrap gap-3">
              {bookingEnabled && <button onClick={() => setBookingModalOpen(true)} className="inline-flex items-center gap-2 bg-white text-[#0f4d3c] px-5 py-3 text-sm font-bold rounded-sm border border-white hover:bg-[#eaf3ee] transition-colors">
                <CalendarDays className="w-4 h-4" /> REQUEST AN APPOINTMENT
              </button>}
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
              <div className="min-w-0 max-w-[290px] space-y-1.5 text-xs leading-relaxed text-white/85 sm:ml-2">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{clinicAddress}</span></p>
                <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{clinicHours}</span></p>
              </div>
            </div>
          </div>
          <div className="flex min-h-20 min-w-0 max-w-full items-center justify-center gap-3 self-end rounded-md border border-emerald-200/50 bg-emerald-950/50 px-5 py-4 text-center text-base font-extrabold leading-tight text-white shadow-lg sm:min-h-28 sm:min-w-64 sm:self-center sm:gap-4 sm:px-9 sm:py-5 sm:text-xl" role="status">
            <CalendarDays className="h-5 w-5 shrink-0 text-emerald-300 sm:h-6 sm:w-6" />
            {language === 'fil' ? 'TUMATANGGAP NG REQUEST · 24/7' : 'ONLINE REQUESTS · 24/7'}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
