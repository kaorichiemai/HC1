import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, MessageCircle, Send, X } from 'lucide-react';
import { useAuth, useUser } from '@clerk/react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { formatAppointmentTime } from '../appointmentSchedule';

interface UserAppointment {
  id: string;
  reference_code: string;
  patient_name: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  chat_status: string;
}

interface UserMessage {
  id: string;
  appointment_id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const isAutomatedReminder = (message: UserMessage) => message.sender_role === 'admin'
  && (message.message.startsWith('This is an automated reminder.')
    || message.message.startsWith('Reminder: Your appointment'));

const getDisplayMessage = (message: string) => {
  const legacyConfirmation = message.match(
    /^Your appointment for (.+) on (\d{4}-\d{2}-\d{2}) at (.+?) has been automatically confirmed\. You can view this schedule in your appointment chat\./,
  );
  if (!legacyConfirmation) return message;

  const [, service, date, time] = legacyConfirmation;
  return `This is an automated message.\n\nYour appointment for ${service} on ${date} at ${time} has been automatically confirmed. You can view the schedule in your appointment chat.\n\nFilipino:\nAwtomatikong mensahe ito. Kumpirmado na ang iyong appointment para sa ${service} sa ${date}, ganap na ${time}. Maaari mong tingnan ang iskedyul sa chat ng iyong appointment.`;
};

export const UserAppointmentChat: React.FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { messagesOpen, setMessagesOpen, markAppointmentMessagesRead } = useHealthCenter();
  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [lastStatuses, setLastStatuses] = useState<Record<string, string>>({});
  const [requestedReferenceCode, setRequestedReferenceCode] = useState('');
  const [composerMode, setComposerMode] = useState<'assistant' | 'clinic'>('assistant');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const loadChat = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Appointment chat could not be loaded.');
      const data = await response.json() as { appointments: UserAppointment[]; messages: UserMessage[] };
      const normalizedAppointments = data.appointments.map((appointment) => ({
        ...appointment,
        status: String(appointment.status).toLowerCase(),
        chat_status: String(appointment.chat_status || 'closed'),
      }));
      normalizedAppointments.forEach((appointment) => {
        const previousStatus = lastStatuses[appointment.id];
        if (previousStatus && previousStatus !== appointment.status) {
          window.dispatchEvent(new CustomEvent('appointment-status-change', { detail: { status: appointment.status, referenceCode: appointment.reference_code } }));
        }
      });
      setLastStatuses(Object.fromEntries(normalizedAppointments.map((appointment) => [appointment.id, appointment.status])));
      setAppointments(normalizedAppointments);
      setMessages(data.messages.filter((message) => !isAutomatedReminder(message)));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Appointment chat could not be loaded.');
    }
  };

  useEffect(() => {
    if (!messagesOpen) return;
    void loadChat();
    const timer = window.setInterval(() => void loadChat(), 3000);
    return () => window.clearInterval(timer);
  }, [messagesOpen]);

  useEffect(() => {
    const openAppointmentMessage = (event: Event) => {
      const { referenceCode } = (event as CustomEvent<{ referenceCode?: unknown }>).detail ?? {};
      if (typeof referenceCode !== 'string') return;
      setRequestedReferenceCode(referenceCode);
      setComposerMode('assistant');
      setSelectedId('');
      setMessagesOpen(true);
    };

    window.addEventListener('open-appointment-message', openAppointmentMessage);
    return () => window.removeEventListener('open-appointment-message', openAppointmentMessage);
  }, [setMessagesOpen]);

  useEffect(() => {
    if (!requestedReferenceCode) return;
    const appointment = appointments.find((item) => item.reference_code === requestedReferenceCode);
    if (!appointment) return;
    setSelectedId(appointment.id);
    setRequestedReferenceCode('');
  }, [appointments, requestedReferenceCode]);

  const selected = useMemo(() => appointments.find((appointment) => appointment.id === selectedId), [appointments, selectedId]);
  const selectedMessages = useMemo(() => messages.filter((message) => message.appointment_id === selectedId), [messages, selectedId]);
  const latestSelectedMessageId = selectedMessages.at(-1)?.id;

  useEffect(() => {
    if (!messagesOpen || !selected || !latestSelectedMessageId) return;
    void markAppointmentMessagesRead(selected.id).catch((caught) => {
      setError(caught instanceof Error ? caught.message : 'Messages could not be marked as read.');
    });
  }, [messagesOpen, selected?.id, latestSelectedMessageId, markAppointmentMessagesRead]);

  if (!messagesOpen) return null;

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'message', appointmentId: selected.id, message: draft.trim(), senderName: user?.fullName || 'Patient' }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'Message could not be sent.');
      }
      setDraft('');
      await loadChat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message could not be sent.');
    }
  };

  const sendAssistantMessage = async (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!selected || !question || assistantLoading) return;
    setError('');
    setAssistantError('');
    setAssistantLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to ask the website assistant.');
      const response = await fetch('/api/website-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentId: selected.id, question }),
      });
      const responseBody = await response.text();
      let result: { error?: string } = {};
      try {
        result = JSON.parse(responseBody) as { error?: string };
      } catch {
        if (response.ok) throw new Error('The website assistant returned an invalid response. Please try again.');
      }
      if (!response.ok && !result.error) {
        throw new Error(`The website assistant is temporarily unavailable (HTTP ${response.status}). Please try again.`);
      }
      if (!response.ok) throw new Error(result.error || 'The website assistant could not respond.');
      setDraft('');
      await loadChat();
    } catch (caught) {
      setAssistantError(caught instanceof Error ? caught.message : 'The website assistant could not respond.');
    } finally {
      setAssistantLoading(false);
    }
  };

  const cancelSelectedAppointment = async () => {
    if (!selected || !['pending', 'confirmed'].includes(selected.status)) return;
    if (!window.confirm('Cancel this appointment request?')) return;
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to cancel this appointment.');
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'patient_cancel', appointmentId: selected.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Appointment could not be cancelled.');
      await loadChat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Appointment could not be cancelled.');
    }
  };

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="messages-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setMessagesOpen(false); }}>
      <div className="flex max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-5xl flex-col overflow-hidden border border-[#dfe6e1] bg-[#f8faf7] shadow-2xl sm:max-h-[92dvh]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#dfe6e1] bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div><div className="text-xs font-bold text-[#17645c]">Your appointments</div><h2 id="messages-title" className="mt-1 text-xl font-bold text-[#17312e]">Messages</h2></div>
          <button type="button" onClick={() => setMessagesOpen(false)} aria-label="Close messages" className="p-2 text-[#66736f] hover:bg-[#f1f4f1]"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden bg-white lg:grid lg:grid-cols-[300px_1fr]">
          <aside className={`${selected ? 'hidden lg:block' : 'block'} border-b border-[#dfe6e1] lg:border-b-0 lg:border-r`}>
            {appointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => { setComposerMode('assistant'); setAssistantError(''); setSelectedId(appointment.id); }} className={`w-full border-b border-[#edf1ee] px-4 py-4 text-left hover:bg-[#f4f7f4] ${selectedId === appointment.id ? 'bg-[#edf3ef]' : ''}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-[#17312e]">{appointment.service_name}</div><div className="mt-1 text-xs text-[#66736f]">{appointment.reference_code}</div></div><span className={`px-2 py-1 text-[10px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'completed' ? 'bg-sky-100 text-sky-800' : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                <div className="mt-2 text-xs text-[#66736f]">{appointment.preferred_date} · {formatAppointmentTime(appointment.preferred_time)}</div>
              </button>
            ))}
            {appointments.length === 0 && <p className="p-4 text-sm text-[#66736f]">No conversations yet</p>}
          </aside>

          <div className={`${selected ? 'block' : 'hidden'} lg:block`}>
            {!selected ? <div className="flex min-h-[360px] items-center justify-center text-sm text-[#66736f]">Select a conversation</div> : (
              <div className="flex min-h-[min(420px,55dvh)] flex-col">
                <div className="flex min-w-0 items-center gap-2 border-b border-[#dfe6e1] px-3 py-3 sm:px-4"><button type="button" onClick={() => setSelectedId('')} className="shrink-0 lg:hidden" aria-label="Back to conversations"><ChevronLeft className="h-5 w-5 text-[#17645c]" /></button><MessageCircle className="h-4 w-4 shrink-0 text-[#17645c]" /><div className="min-w-0"><div className="truncate text-sm font-bold">{selected.service_name}</div><div className="text-[11px] text-[#66736f]">{selected.chat_status === 'closed' ? 'Chat closed by clinic staff' : 'Chat open'}</div></div></div>
                {['pending', 'confirmed'].includes(selected.status) && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfe6e1] bg-white px-3 py-2 sm:px-4"><p className="text-[11px] text-[#66736f]">Need to change your appointment? Message clinic staff here.</p><button type="button" onClick={() => void cancelSelectedAppointment()} className="min-h-10 border border-rose-200 px-3 text-xs font-bold text-rose-700">Cancel appointment</button></div>}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4">
                  {selectedMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${message.sender_role === 'user' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm bg-[#edf1ee] text-[#17312e]'}`}><div className="whitespace-pre-line">{getDisplayMessage(message.message)}</div><div className={`mt-1 text-[10px] ${message.sender_role === 'user' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</div></div></div>
                  ))}
                  {composerMode === 'assistant' && <p className="text-[11px] leading-relaxed text-[#66736f]">AI answers use published health center information and may not cover every question. Please do not include private or medical details. For appointment changes or questions needing confirmation, contact clinic staff.</p>}
                  {assistantLoading && <p role="status" className="text-xs text-[#66736f]">Website assistant is replying…</p>}
                </div>
                {selected.chat_status === 'open' ? (
                  <div className="shrink-0 border-t border-[#dfe6e1] bg-white p-2.5 sm:p-3">
                    <div className="mb-2 flex gap-2" role="group" aria-label="Choose who to message">
                      <button type="button" aria-pressed={composerMode === 'assistant'} onClick={() => { setComposerMode('assistant'); setAssistantError(''); }} className={`min-h-9 rounded-full px-3 text-xs font-bold ${composerMode === 'assistant' ? 'bg-[#17645c] text-white' : 'border border-[#cfd8d2] text-[#52635b]'}`}>Website assistant</button>
                      <button type="button" aria-pressed={composerMode === 'clinic'} onClick={() => setComposerMode('clinic')} className={`min-h-9 rounded-full px-3 text-xs font-bold ${composerMode === 'clinic' ? 'bg-[#17645c] text-white' : 'border border-[#cfd8d2] text-[#52635b]'}`}>Clinic staff</button>
                    </div>
                    {assistantError && composerMode === 'assistant' && <p role="alert" className="mb-2 text-xs text-rose-800">{assistantError}</p>}
                    <form onSubmit={composerMode === 'assistant' ? sendAssistantMessage : sendMessage} className="flex gap-2">
                      <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={composerMode === 'assistant' ? 1200 : 2000} placeholder={composerMode === 'assistant' ? 'Ask about the health center website' : 'Message clinic staff'} className="h-11 min-w-0 flex-1 rounded-full border border-[#cfd8d2] px-4 text-sm outline-none focus:border-[#17645c]" />
                      <button type="submit" disabled={!draft.trim() || assistantLoading} aria-label={composerMode === 'assistant' ? 'Send question to website assistant' : 'Send message to clinic staff'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17645c] text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
                    </form>
                  </div>
                ) : <div className="border-t border-[#dfe6e1] bg-white px-4 py-4 text-center text-xs font-bold text-[#66736f]">This chat has been closed by clinic staff</div>}
              </div>
            )}
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-rose-800">{error}</p>}
        </div>
      </div>
    </section>
  );
};
