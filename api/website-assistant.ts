import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyToken } from '@clerk/backend';
import { DEFAULT_CLINIC_PUBLIC_SETTINGS, NEWS_UPDATES, OUTREACH_PROGRAMS, SERVICES_DATA } from '../src/data/healthCenterData.js';
import { getContentDatabase, readSiteContent } from './site-content-store.js';

type ApiRequest = IncomingMessage & { body?: unknown; headers: IncomingMessage['headers'] & { authorization?: string } };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

let appointmentDatabase: ReturnType<typeof createClient> | undefined;

function getAppointmentDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  appointmentDatabase ??= createClient({ url, authToken });
  return appointmentDatabase;
}

async function authenticate(request: ApiRequest) {
  const authorization = request.headers.authorization;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';
  if (!token || !process.env.CLERK_SECRET_KEY) return null;
  try {
    return await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    return null;
  }
}

async function getWebsiteContent() {
  const db = getContentDatabase();
  return db
    ? (await readSiteContent(db)).content
    : {
      services: SERVICES_DATA,
      news: NEWS_UPDATES,
      outreach: OUTREACH_PROGRAMS,
      settings: DEFAULT_CLINIC_PUBLIC_SETTINGS,
    };
}

function normalizeText(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasAnyTerm(text: string, terms: string[]) {
  const paddedText = ` ${text} `;
  return terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return normalizedTerm.length > 0 && paddedText.includes(` ${normalizedTerm} `);
  });
}

const serviceKeywords: Record<string, string[]> = {
  maternity: ['prenatal', 'pregnancy', 'pregnant', 'buntis', 'maternal'],
  nutrition: ['nutrition', 'nutrisyon', 'bns', 'operation timbang', 'opt'],
  dental: ['dental', 'dentist', 'tooth', 'teeth', 'ngipin'],
  animal_bite: ['animal bite', 'dog bite', 'cat bite', 'rabies', 'kagat', 'nakagat', 'kalmut'],
  checkup: ['check up', 'checkup', 'consultation', 'konsultasyon', 'doctor', 'doktor'],
  xray: ['x ray', 'xray', 'radiology', 'radiological', 'rayos x'],
  pharmacy: ['pharmacy', 'botika', 'medicines', 'gamot'],
};

function answerWebsiteQuestion(question: string, content: Awaited<ReturnType<typeof getWebsiteContent>>) {
  const normalizedQuestion = normalizeText(question);
  const isFilipino = hasAnyTerm(normalizedQuestion, [
    'ano', 'saan', 'kailan', 'paano', 'magkano', 'serbisyo', 'bukas', 'oras', 'kailangan', 'pwede', 'maaari', 'po', 'ba',
  ]);
  const contact = `Contact: ${content.settings.contactPhone}${content.settings.contactEmail ? ` · ${content.settings.contactEmail}` : ''}`;

  if (hasAnyTerm(normalizedQuestion, ['emergency', 'urgent', 'symptom', 'symptoms', 'diagnose', 'diagnosis', 'treatment', 'dosage', 'dose', 'lagnat', 'masakit', 'sakit'])) {
    return isFilipino
      ? `Hindi ako makapagbibigay ng payong medikal. Para sa agarang pangangailangan, tumawag sa lokal na emergency services o sa health center: ${content.settings.emergencyPhone}.`
      : `I can't provide medical advice. For urgent concerns, contact local emergency services or call the health center at ${content.settings.emergencyPhone}.`;
  }

  if (hasAnyTerm(normalizedQuestion, ['available slot', 'free slot', 'open slot', 'free appointment', 'available appointment', 'available date', 'bakanteng oras', 'bakanteng petsa'])) {
    return isFilipino
      ? `Nagbabago ang availability. Tingnan ang schedule sa appointment form para sa mga kasalukuyang bakanteng oras. ${contact}`
      : `Availability changes; check the schedule in the appointment form for current open times. ${contact}`;
  }

  if (hasAnyTerm(normalizedQuestion, ['price', 'cost', 'fee', 'free', 'magkano', 'libre'])) {
    return isFilipino
      ? `Wala akong kumpirmadong impormasyon tungkol sa bayad sa website. Tumawag sa ${content.settings.contactPhone} o piliin ang “Clinic staff” para makumpirma.`
      : `I couldn't confirm fees or costs from the website information. Call ${content.settings.contactPhone} or choose “Clinic staff” to confirm.`;
  }

  const service = content.services.find((item) => {
    const terms = [
      item.title,
      item.titleFil,
      item.id.replaceAll('_', ' '),
      ...(serviceKeywords[item.category] ?? []),
    ];
    return hasAnyTerm(normalizedQuestion, terms);
  });
  if (service) {
    const description = isFilipino ? service.shortDescFil : service.shortDesc;
    const schedule = isFilipino ? service.scheduleFil : service.schedule;
    const requirements = isFilipino ? service.requirementsFil : service.requirements;
    const appointmentGuidance = hasAnyTerm(normalizedQuestion, ['appointment', 'book', 'booking', 'request'])
      ? (isFilipino
        ? ' Para mag-request, mag-sign in at piliin ang serbisyong ito sa appointment form.'
        : ' To request an appointment, sign in and choose this service in the appointment form.')
      : '';
    return [
      `${isFilipino ? service.titleFil : service.title}: ${description}`,
      `${isFilipino ? 'Iskedyul' : 'Schedule'}: ${schedule}`,
      `${isFilipino ? 'Lokasyon' : 'Location'}: ${service.location}`,
      requirements.length > 0 ? `${isFilipino ? 'Mga kailangan' : 'Requirements'}: ${requirements.join(', ')}` : '',
      appointmentGuidance,
      contact,
    ].filter(Boolean).join('\n');
  }

  if (hasAnyTerm(normalizedQuestion, ['address', 'location', 'where', 'saan', 'directions', 'direksyon'])) {
    return isFilipino
      ? `Address ng health center: ${content.settings.clinicAddressFil}. ${contact}`
      : `Health center address: ${content.settings.clinicAddress}. ${contact}`;
  }

  if (hasAnyTerm(normalizedQuestion, ['priority', 'pwd', 'senior', 'pregnant', 'lactating', 'priority appointment', 'priority category'])) {
    return isFilipino
      ? 'Sa appointment form, maaaring piliin ang kategoryang PWD, senior citizen (edad 60 pataas), o buntis/nagpapasuso. Priority ang Animal Bite requests. Tingnan ang form para sa mga kwalipikasyon at kasalukuyang schedule.'
      : 'The appointment form supports priority categories for PWD, senior citizens (age 60+), and pregnant/lactating patients. Animal Bite requests are prioritized. Check the form for eligibility details and current schedules.';
  }

  if (
    hasAnyTerm(normalizedQuestion, ['book', 'booking', 'appointment', 'schedule', 'iskedyul', 'reschedule', 'cancel', 'kansela', 'request', 'status', 'confirmed', 'accepted', 'pending', 'rejected', 'completed'])
    && !hasAnyTerm(normalizedQuestion, ['news', 'announcement', 'update', 'balita', 'anunsyo', 'outreach', 'community program', 'barangay program', 'programa'])
  ) {
    if (hasAnyTerm(normalizedQuestion, ['reschedule', 'cancel', 'kansela', 'change appointment', 'edit appointment'])) {
      return isFilipino
        ? `Para magkansela o magtanong tungkol sa pagbabago ng appointment, piliin ang “Clinic staff” sa chat. Maaari ring gamitin ang “Cancel appointment” button kung available sa iyong request.`
        : 'To cancel or ask about changing an appointment, choose “Clinic staff” in this chat. You can also use the “Cancel appointment” button when it is available for your request.';
    }
    if (hasAnyTerm(normalizedQuestion, ['status', 'confirmed', 'accepted', 'pending', 'rejected', 'completed'])) {
      return isFilipino
        ? 'Makikita ang pinakabagong status sa appointment card at mensahe sa chat na ito. Ang “Confirmed” ay tinanggap na; ang “Pending” ay hinihintay pa ng pagsusuri. Para sa detalye, piliin ang “Clinic staff”.'
        : 'Check the appointment card and messages in this chat for the latest status. “Confirmed” means accepted; “Pending” means it is still under review. Choose “Clinic staff” if you need help with your request.';
    }
    if (hasAnyTerm(normalizedQuestion, ['available', 'availability', 'open slot', 'free slot', 'bakante', 'available date'])) {
      return isFilipino
        ? `Nagbabago ang availability. Tingnan ang schedule sa appointment form para sa mga kasalukuyang bakanteng oras. ${contact}`
        : `Availability changes; check the schedule in the appointment form for current open times. ${contact}`;
    }
    return isFilipino
      ? 'Mag-sign in, pumili ng serbisyo, kumpletuhin ang mga detalye at kinakailangang pahintulot, saka pumili ng available na petsa at oras sa appointment form. Saklaw ng form ang rolling 30-day schedule; kumpirmahin doon ang kasalukuyang availability. Ang pasyenteng edad 17 pababa ay kailangang samahan ng magulang o guardian.'
      : 'Sign in, choose a service, complete the details and required consents, then select an available date and time in the appointment form. It offers schedules within a rolling 30-day window; check the form for current availability. Patients age 17 or younger need a parent or guardian to accompany them.';
  }

  if (hasAnyTerm(normalizedQuestion, ['autofill', 'auto fill', 'prefill', 'saved details', 'previous appointment'])) {
    return isFilipino
      ? 'Para sa mga susunod na request, maaaring awtomatikong mapunan ang ilang detalye mula sa pinakahuling appointment. Suriin ang mga ito bago isumite; kailangang pumili muli ng petsa, oras, at mga pahintulot.'
      : 'Some details from your most recent appointment may be filled in automatically for a later request. Review them before submitting; choose the date, time, and consents again.';
  }

  if (hasAnyTerm(normalizedQuestion, ['sign up', 'signup', 'register', 'create account', 'sign in', 'login', 'log in', 'password', 'account'])) {
    return isFilipino
      ? 'Gamitin ang account button sa website. Kung bago ka, piliin ang “Sign up”; kung mayroon ka nang account, piliin ang “Sign in”. Huwag ibahagi ang iyong password sa chat.'
      : 'Use the account button on the website. Choose “Sign up” to create an account or “Sign in” if you already have one. Do not share your password in chat.';
  }

  if (hasAnyTerm(normalizedQuestion, ['hours', 'open', 'opening', 'close', 'closing', 'oras', 'bukas'])) {
    return isFilipino
      ? `Oras ng health center: ${content.settings.clinicHoursFil}. Para sa holiday operations, tumawag muna upang kumpirmahin.`
      : `Health center hours: ${content.settings.clinicHours}. Contact the center to confirm holiday operations.`;
  }

  if (hasAnyTerm(normalizedQuestion, ['phone', 'telephone', 'call', 'contact', 'email', 'number', 'telepono', 'tawag', 'contact number'])) {
    return contact;
  }

  if (hasAnyTerm(normalizedQuestion, ['services', 'service list', 'serbisyo', 'what do you offer', 'ano ang meron'])) {
    const services = content.services.map((item) => isFilipino ? item.titleFil : item.title);
    return services.length > 0
      ? `${isFilipino ? 'Mga serbisyong nakalista sa website' : 'Services listed on the website'}: ${services.join('; ')}.`
      : `${isFilipino ? 'Walang nakalistang serbisyo sa ngayon.' : 'No services are currently listed.'} ${contact}`;
  }

  if (hasAnyTerm(normalizedQuestion, ['news', 'announcement', 'update', 'balita', 'anunsyo'])) {
    const updates = content.news.slice(0, 5).map((item) => `${isFilipino ? item.titleFil : item.title} (${item.date})`);
    return updates.length > 0
      ? `${isFilipino ? 'Mga anunsyo sa website' : 'Website announcements'}: ${updates.join('; ')}.`
      : `${isFilipino ? 'Walang kasalukuyang anunsyo.' : 'There are no current announcements.'} ${contact}`;
  }

  if (hasAnyTerm(normalizedQuestion, ['outreach', 'community program', 'barangay program', 'programa'])) {
    const programs = content.outreach.slice(0, 5).map((item) => {
      const title = isFilipino ? item.titleFil : item.title;
      const description = isFilipino ? item.descriptionFil : item.description;
      return `${title}: ${description} Schedule: ${item.scheduleDate}, ${item.timeWindow}; location: ${item.location}`;
    });
    return programs.length > 0
      ? `${isFilipino ? 'Mga outreach program na nakalista sa website' : 'Outreach programs listed on the website'}: ${programs.join('\n')}`
      : `${isFilipino ? 'Walang kasalukuyang nakalistang outreach program.' : 'There are no outreach programs currently listed.'} ${contact}`;
  }

  return isFilipino
    ? `Wala akong kumpirmadong sagot mula sa impormasyon ng website. Maaari mong piliin ang “Clinic staff” sa chat o tumawag sa ${content.settings.contactPhone}.`
    : `I couldn't find a confirmed answer in the website information. Choose “Clinic staff” in this chat or call ${content.settings.contactPhone}.`;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const decoded = await authenticate(request);
  if (!decoded) return response.status(401).json({ error: 'Sign in to use the website assistant.' });
  const db = getAppointmentDatabase();
  if (!db) return response.status(503).json({ error: 'Appointment messaging is not configured.' });
  const body = request.body && typeof request.body === 'object'
    ? request.body as Record<string, unknown>
    : {};
  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId.trim().slice(0, 128) : '';
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!appointmentId || question.length === 0 || question.length > 1200) {
    return response.status(400).json({ error: 'Enter a message about the health center website.' });
  }

  try {
    const appointment = await db.execute({
      sql: `SELECT patient_name, chat_status FROM appointment_requests
            WHERE id = ? AND owner_uid = ?`,
      args: [appointmentId, decoded.sub],
    });
    if (!appointment.rows[0] || String(appointment.rows[0].chat_status) === 'deleted') {
      return response.status(404).json({ error: 'Appointment conversation not found.' });
    }
    if (String(appointment.rows[0].chat_status) !== 'open') {
      return response.status(409).json({ error: 'This appointment conversation is closed.' });
    }
    const content = await getWebsiteContent();
    const answerMessage = answerWebsiteQuestion(question, content);
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    const createdAt = new Date();
    const transaction = await db.transaction('write');
    try {
      const currentAppointment = await transaction.execute({
        sql: `SELECT patient_name, chat_status FROM appointment_requests
              WHERE id = ? AND owner_uid = ?`,
        args: [appointmentId, decoded.sub],
      });
      if (!currentAppointment.rows[0] || String(currentAppointment.rows[0].chat_status) !== 'open') {
        await transaction.rollback();
        return response.status(409).json({ error: 'This appointment conversation is no longer available.' });
      }
      await transaction.execute({
        sql: `INSERT INTO appointment_messages
              (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, ?, 'user', ?, ?, ?)`,
        args: [userMessageId, appointmentId, decoded.sub, String(currentAppointment.rows[0].patient_name), question, createdAt.toISOString()],
      });
      await transaction.execute({
        sql: `INSERT INTO appointment_messages
              (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, 'website-assistant', 'assistant', 'Website Assistant', ?, ?)`,
        args: [assistantMessageId, appointmentId, answerMessage, new Date(createdAt.getTime() + 1).toISOString()],
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    return response.status(200).json({ answer: answerMessage });
  } catch (error) {
    console.error('Website assistant could not answer:', error);
    return response.status(502).json({ error: 'The website assistant could not respond right now. Please try again or contact clinic staff.' });
  }
}
