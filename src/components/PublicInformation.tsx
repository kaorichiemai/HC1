import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CalendarDays, Clock3, MapPin, Stethoscope } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const PublicInformation: React.FC = () => {
  const { language, siteContent, siteContentError } = useHealthCenter();
  const isFilipino = language === 'fil';
  const featuredServices = siteContent.services.slice(0, 5);
  const updates = siteContent.news.slice(0, 3);
  const outreach = siteContent.outreach.slice(0, 3);
  const settings = siteContent.settings;
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!viewingImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingImage(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [viewingImage]);

  return (
    <section id="clinic-information" className="site-section-bg section-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {siteContentError && <p role="status" className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{isFilipino ? 'Hindi ma-refresh ang pinakabagong impormasyon ng klinika; ipinapakita ang huling na-save na nilalaman.' : 'Clinic information could not be refreshed; showing the last saved content.'}</p>}
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Information</span></div>
        <div className="mb-6">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2c7a5f]">Clinic information</div>
            <h2 className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
              {isFilipino ? 'Kasalukuyang impormasyon' : 'Current information'}
            </h2>
          </div>
        </div>

        <div className="mx-auto max-w-5xl rounded-xl bg-[#0b3f32] p-5 shadow-lg shadow-[#0b3f32]/15 sm:p-8">
          <div className="holiday-advisory" role="note">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div><strong>{isFilipino ? 'Pabatid sa holiday:' : 'Holiday advisory:'}</strong> {isFilipino ? settings.holidayAdvisoryFil : settings.holidayAdvisory}</div>
          </div>

        <div className="mx-auto max-w-[820px] space-y-8">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-white"><Bell className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Mga anunsyo' : 'Announcements'}</h3>
            {updates.length > 0 ? (
              <div className="space-y-5">
                {updates.map((update) => (
                  <article key={update.id} className="border-b border-white/20 pb-5 last:border-0 last:pb-0">
                    <h4 className="text-sm font-bold text-white">{isFilipino ? update.titleFil : update.title}</h4>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-emerald-50">
                      {(isFilipino ? update.contentFil : update.content) || (isFilipino ? update.summaryFil : update.summary)}
                    </p>
                    {update.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: update.imageUrl!, alt: isFilipino ? update.titleFil : update.title })}
                        aria-label={isFilipino ? `Tingnan ang buong larawan: ${update.titleFil}` : `View full image: ${update.title}`}
                        className="mt-3 block w-full cursor-zoom-in overflow-hidden rounded-md border border-white/30 bg-white"
                      >
                        <img
                          src={update.imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="max-h-[28rem] w-full object-contain"
                        />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : <p className="text-sm text-emerald-50">{isFilipino ? 'Wala pang bagong anunsyo.' : 'There are no current announcements.'}</p>}
          </section>

          <div className="space-y-7">
          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white"><Clock3 className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}</h3>
            <ul className="bullet-list my-0 text-sm leading-6 text-emerald-50">
              <li><strong>{isFilipino ? settings.clinicHoursFil : settings.clinicHours}</strong></li>
              <li>{isFilipino ? settings.doctorHoursFil : settings.doctorHours}</li>
              <li>{isFilipino ? settings.xrayHoursFil : settings.xrayHours}</li>
              <li>{isFilipino ? settings.dentalHoursFil : settings.dentalHours}</li>
            </ul>
          </section>

          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white"><Stethoscope className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Mga serbisyo' : 'Services overview'}</h3>
            {featuredServices.length > 0 ? (
              <ul className="bullet-list my-0 text-sm leading-6 text-emerald-50">
                {featuredServices.map((service) => <li key={service.id}><strong>{isFilipino ? service.titleFil : service.title}</strong>{service.badge ? ` · ${service.badge}` : ''}</li>)}
              </ul>
            ) : <p className="text-sm text-emerald-50">{isFilipino ? 'Wala pang nailathalang serbisyo.' : 'No services have been published yet.'}</p>}
          </section>

          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white"><CalendarDays className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Paparating na outreach' : 'Upcoming outreach'}</h3>
            {outreach.length > 0 ? (
              <ul className="bullet-list my-0 text-sm leading-6 text-emerald-50">
                {outreach.map((program) => <li key={program.id}><strong>{isFilipino ? program.titleFil : program.title}</strong><span className="mt-1 flex items-start gap-1.5 text-xs text-emerald-100"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{program.location}</span></li>)}
              </ul>
            ) : <p className="text-sm text-emerald-50">{isFilipino ? 'Wala pang naka-iskedyul na outreach.' : 'No outreach programs are currently scheduled.'}</p>}
          </section>
          </div>
        </div>
        </div>
      </div>
      {viewingImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.alt}
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-slate-950/90 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingImage(null); }}
        >
          <button type="button" onClick={() => setViewingImage(null)} aria-label="Close image" className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <span className="text-xl leading-none">×</span>
          </button>
          <img src={viewingImage.url} alt={viewingImage.alt} className="block h-auto w-auto max-h-[85dvh] max-w-[90vw] object-contain" />
        </div>
      )}
    </section>
  );
};
