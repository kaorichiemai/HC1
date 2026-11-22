import React, { useEffect } from 'react';

type LegalPageKind = 'privacy' | 'terms';

const privacySections = [
  {
    title: 'Information we collect',
    paragraphs: [
      'When you use this website, we may collect your name, email address, username, and information provided by your sign-in provider. If you choose Google sign-in, Google processes your authentication under its own privacy policy, and Clerk provides account information needed to authenticate you.',
      'If you submit an appointment request or contact form, we collect the details you enter, such as your name, phone number, email address, barangay, requested service, preferred date and time, and message.',
      'The health-record features may process sensitive personal information, including date of birth, gender, PhilHealth number, patient category, vital signs, prescriptions, radiology reports, and messages. Please submit this information only when you are authorized to do so.',
      'The website also stores your language preference in your browser and uses authentication technologies needed to keep your account signed in.',
    ],
  },
  {
    title: 'How we use information',
    paragraphs: [
      'We use information to authenticate accounts, manage patient records and clinic communications, receive and respond to appointment requests, administer website content, and maintain the security and operation of the service.',
      'An appointment request is not confirmed until clinic staff respond and confirm it.',
    ],
  },
  {
    title: 'Service providers and sharing',
    paragraphs: [
      'The website uses Clerk for authentication, Turso for database storage, and Vercel for hosting and serverless functions. Google may process authentication information when you choose Google sign-in. These providers process information to provide their services under their own terms and privacy notices.',
      'We do not sell personal information. Information may be accessed by authorized clinic personnel who need it to handle your request or records, by service providers operating the website, or when disclosure is required by law.',
    ],
  },
  {
    title: 'Retention and your choices',
    paragraphs: [
      'Information is retained for as long as needed for the purposes described here and for applicable healthcare, records-management, or legal requirements. Retention periods may differ by record type.',
      'You may contact the health center to ask about access, correction, or deletion of your information, or to raise a privacy concern. Requests may be subject to applicable legal and recordkeeping requirements.',
    ],
  },
  {
    title: 'Security and contact',
    paragraphs: [
      'We use account authentication and technical controls to help protect information. No online service can guarantee complete security.',
      'For privacy questions or requests, contact Mayor Moises R. Flores Health Center at mrfloreshealthcenter@gmail.com.',
    ],
  },
];

const termsSections = [
  {
    title: 'Using the website',
    paragraphs: [
      'This website provides health-center information and online tools for appointment requests, patient records, and clinic communications. Use it lawfully and provide accurate information. Do not attempt to access another person’s account or records, interfere with the service, or use the website to submit unlawful or harmful material.',
      'If you submit information for another person, you must be authorized to do so.',
    ],
  },
  {
    title: 'Appointments and health information',
    paragraphs: [
      'Submitting an appointment request does not guarantee a booking. The request remains pending until clinic staff respond and confirm it. Clinic schedules and services may change.',
      'Website information is general information and is not a diagnosis, medical advice, or a substitute for care from a qualified health professional. This website is not an emergency service. For emergencies, contact local emergency services or the health center by phone at (02) 8642-5159.',
    ],
  },
  {
    title: 'Accounts and availability',
    paragraphs: [
      'You are responsible for keeping your sign-in credentials secure and for activity performed through your account. Contact the health center if you believe your account has been used without authorization.',
      'We may update, suspend, or discontinue parts of the website to maintain or improve the service. Online availability is not guaranteed.',
    ],
  },
  {
    title: 'Changes and contact',
    paragraphs: [
      'These terms may be updated when the website or its services change. Continued use after an update means you accept the revised terms to the extent allowed by applicable law.',
      'Questions about these terms may be sent to mrfloreshealthcenter@gmail.com.',
    ],
  },
];

export const LegalPage: React.FC<{ page: LegalPageKind }> = ({ page }) => {
  const isPrivacy = page === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const sections = isPrivacy ? privacySections : termsSections;

  useEffect(() => {
    document.title = `${title} | Mayor Moises R. Flores Health Center`;
  }, [title]);

  return (
    <main className="min-h-dvh bg-[#f3f7f4] px-4 py-8 text-[#24332d] sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl border border-[#dce7e1] bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        <nav aria-label="Legal pages" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#17645c]">
          <a href="/" className="hover:underline">Home</a>
          <a href="/privacy-policy" aria-current={isPrivacy ? 'page' : undefined} className="hover:underline">Privacy Policy</a>
          <a href="/terms-of-service" aria-current={!isPrivacy ? 'page' : undefined} className="hover:underline">Terms of Service</a>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#17645c]">Mayor Moises R. Flores Health Center</p>
        <h1 className="mt-2 text-3xl font-bold text-[#173a37] sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-[#66736f]">Last updated: November 22, 2026</p>

        {isPrivacy && (
          <p className="mt-6 border-l-4 border-[#17645c] bg-[#f3f7f4] px-4 py-3 text-sm leading-6">
            This notice describes how information is handled through this website. Health information is sensitive; please contact the health center for questions about a specific record or request.
          </p>
        )}

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-[#173a37]">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-[#4b5a54]">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-[#dce7e1] pt-5 text-sm text-[#66736f]">
          Contact us at <a className="font-semibold text-[#17645c] underline" href="mailto:mrfloreshealthcenter@gmail.com">mrfloreshealthcenter@gmail.com</a>.
        </p>
      </article>
    </main>
  );
};
