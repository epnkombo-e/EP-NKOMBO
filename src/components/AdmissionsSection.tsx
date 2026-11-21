import { useState, type FormEvent, type RefObject } from 'react';
import { AlertCircle, CheckCircle2, Mail, MapPin, Clock, Phone } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';

interface AdmissionsSectionProps {
  nameInputRef: RefObject<HTMLInputElement | null>;
}

interface FormState {
  parentName: string;
  contact: string;
  gradeLevel: string;
  inquiryType: string;
  message: string;
}

interface FormErrors {
  parentName?: string;
  contact?: string;
  message?: string;
  submit?: string;
}

const CANONICAL_INQUIRY_PURPOSES = [
  'New Student Enrollment',
  'Campus Visit & Tour',
  'Transfer Student Inquiry',
  'Community / Alumni Partnership',
];

export function AdmissionsSection({ nameInputRef }: AdmissionsSectionProps) {
  const { settings, submitInquiry } = useSchoolData();
  const { t, portal } = useLanguage();
  const [form, setForm] = useState<FormState>({
    parentName: '',
    contact: '',
    gradeLevel: 'Primary 1 (P1)',
    inquiryType: 'New Student Enrollment',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (form.parentName.trim().length < 2) {
      nextErrors.parentName = t.admissions.errName;
    }
    const contactVal = form.contact.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactVal);
    const looksLikePhone = /^[+\d\s()-]{8,}$/.test(contactVal);
    if (!looksLikeEmail && !looksLikePhone) {
      nextErrors.contact = t.admissions.errContact;
    }
    if (form.message.trim().length < 10) {
      nextErrors.message = t.admissions.errMessage;
    }
    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const code = await submitInquiry(form);
      setSubmittedRef(code);
    } catch {
      setErrors({
        submit: `${t.admissions.errSubmit} (${settings.contactEmail})`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      parentName: '',
      contact: '',
      gradeLevel: 'Primary 1 (P1)',
      inquiryType: 'New Student Enrollment',
      message: '',
    });
    setErrors({});
    setSubmittedRef(null);
  };

  return (
    <section
      id="admissions"
      className="bg-[#F6F9FC] py-16 dark:bg-[#0B1728]/70 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.admissions.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.admissions.heading}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
              {t.admissions.subtitleBefore} {settings.gradesServed}
              {t.admissions.subtitleAfter}
            </p>

            <div className="mt-8 divide-y divide-[#D4DFEB] border-y border-[#D4DFEB] dark:divide-[#1E334D] dark:border-[#1E334D]">
              {t.admissions.steps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4 py-4">
                  <span className="mt-0.5 font-mono text-xs font-medium text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <h3 className="text-xs font-semibold tracking-wide text-[#475569] dark:text-[#94A3B8]">
                {t.admissions.checklistHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#334155] dark:text-[#CBD5E1]">
                {t.admissions.checklistDocs.map((docItem) => (
                  <li key={docItem} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1769AA] dark:bg-[#60A5FA]"
                      aria-hidden="true"
                    />
                    <span>{docItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-[#D4DFEB] bg-[#EDF4FA]/80 p-5 dark:border-[#1E334D] dark:bg-[#0D1B2D] sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#123D68] dark:text-[#60A5FA]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {t.admissions.emailLabel}
                  </p>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="mt-0.5 block text-sm font-semibold text-[#0B2E50] underline decoration-[#CBD8E6] underline-offset-4 hover:decoration-[#1769AA] dark:text-[#E7EFF8]"
                  >
                    {settings.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#123D68] dark:text-[#60A5FA]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {portal.contact.phoneLabel}
                  </p>
                  <a
                    href={`tel:${settings.phoneNumber.replace(/\s+/g, '').replace(/^0/, '+250')}`}
                    className="mt-0.5 block font-mono text-sm font-semibold text-[#0B2E50] underline decoration-[#CBD8E6] underline-offset-4 hover:decoration-[#1769AA] dark:text-[#E7EFF8] tabular-figures"
                  >
                    {settings.phoneNumber}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2 sm:border-t sm:border-[#D4DFEB] sm:pt-3 dark:sm:border-[#1E334D]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#123D68] dark:text-[#60A5FA]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {t.admissions.locationLabel}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                    {settings.locationLabel}
                  </p>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8]">{settings.campusAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2 sm:border-t sm:border-[#D4DFEB] sm:pt-3 dark:sm:border-[#1E334D]">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#123D68] dark:text-[#60A5FA]" aria-hidden="true" />
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  {t.admissions.officeHoursLabel}{' '}
                  <span className="font-mono text-[#0B2E50] dark:text-[#E7EFF8] tabular-figures">
                    {settings.officeHours}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] sm:p-8">
              {submittedRef ? (
                <div className="py-6">
                  <div className="flex items-center gap-3 text-[#14532D] dark:text-[#6EE7B7]">
                    <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                      {t.admissions.successTitle} · {settings.schoolName}
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                    {t.admissions.successBodyBefore}{' '}
                    <span className="font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">{form.parentName}</span>.{' '}
                    {t.admissions.successBodyMiddle}{' '}
                    <span className="font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">{form.gradeLevel}</span>{' '}
                    {t.admissions.successBodyAfter}
                  </p>

                  <div className="mt-5 rounded-lg border border-[#D4DFEB] bg-[#F8FAFD] p-4 text-xs text-[#475569] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#CBD5E1]">
                    <p>
                      {t.admissions.refCodeLabel}{' '}
                      <span className="font-mono font-medium text-[#0B2E50] dark:text-[#E7EFF8]">{submittedRef}</span>
                    </p>
                    <p className="mt-1">
                      {t.admissions.contactProvidedLabel}{' '}
                      <span className="font-medium text-[#0B2E50] dark:text-[#E7EFF8]">{form.contact}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent(
                        `[${submittedRef}] ${form.inquiryType} — ${form.gradeLevel}`,
                      )}&body=${encodeURIComponent(
                        `Parent/Guardian: ${form.parentName}\nContact: ${form.contact}\nGrade Level: ${form.gradeLevel}\n\n${form.message}`,
                      )}`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#123D68] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0B2E50] dark:bg-[#1769AA] whitespace-nowrap"
                    >
                      {t.admissions.sendEmailCopy}
                    </a>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
                    >
                      {t.admissions.submitAnother}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h3 className="font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                    {t.admissions.formTitle}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#475569] dark:text-[#94A3B8]">
                    {t.admissions.formSubtitle}
                  </p>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label
                        htmlFor="parent-name"
                        className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                      >
                        {t.admissions.parentNameLabel}
                      </label>
                      <input
                        ref={nameInputRef}
                        id="parent-name"
                        type="text"
                        maxLength={100}
                        value={form.parentName}
                        onChange={(e) => {
                          setForm({ ...form, parentName: e.target.value });
                          if (errors.parentName) setErrors({ ...errors, parentName: undefined });
                        }}
                        placeholder={t.admissions.parentNamePlaceholder}
                        aria-invalid={Boolean(errors.parentName)}
                        className={`mt-1.5 h-11 w-full rounded-md border bg-[#F8FAFD] px-3.5 text-sm text-[#0B2E50] placeholder:text-[#64748B] focus:outline-none dark:bg-[#13253D] dark:text-[#E7EFF8] ${
                          errors.parentName
                            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                            : 'border-[#CBD8E6] focus:border-[#1769AA] dark:border-[#1E334D]'
                        }`}
                      />
                      {errors.parentName && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{errors.parentName}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-info"
                        className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                      >
                        {t.admissions.contactLabel}
                      </label>
                      <input
                        id="contact-info"
                        type="text"
                        maxLength={120}
                        value={form.contact}
                        onChange={(e) => {
                          setForm({ ...form, contact: e.target.value });
                          if (errors.contact) setErrors({ ...errors, contact: undefined });
                        }}
                        placeholder={t.admissions.contactPlaceholder}
                        aria-invalid={Boolean(errors.contact)}
                        className={`mt-1.5 h-11 w-full rounded-md border bg-[#F8FAFD] px-3.5 text-sm text-[#0B2E50] placeholder:text-[#64748B] focus:outline-none dark:bg-[#13253D] dark:text-[#E7EFF8] ${
                          errors.contact
                            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                            : 'border-[#CBD8E6] focus:border-[#1769AA] dark:border-[#1E334D]'
                        }`}
                      />
                      {errors.contact && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{errors.contact}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="grade-level"
                          className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                        >
                          {t.admissions.gradeLevelLabel}
                        </label>
                        <select
                          id="grade-level"
                          value={form.gradeLevel}
                          onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                          className="mt-1.5 h-11 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] focus:border-[#1769AA] focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                        >
                          <option>Nursery (N1–N3)</option>
                          <option>Primary 1 (P1)</option>
                          <option>Primary 2 (P2)</option>
                          <option>Primary 3 (P3)</option>
                          <option>Primary 4 (P4)</option>
                          <option>Primary 5 (P5)</option>
                          <option>Primary 6 (P6)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="inquiry-type"
                          className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                        >
                          {t.admissions.inquiryTypeLabel}
                        </label>
                        <select
                          id="inquiry-type"
                          value={form.inquiryType}
                          onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
                          className="mt-1.5 h-11 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] focus:border-[#1769AA] focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                        >
                          {CANONICAL_INQUIRY_PURPOSES.map((canonicalVal, idx) => (
                            <option key={canonicalVal} value={canonicalVal}>
                              {t.admissions.inquiryPurposeOptions[idx] || canonicalVal}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="inquiry-message"
                        className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                      >
                        {t.admissions.messageLabel}
                      </label>
                      <textarea
                        id="inquiry-message"
                        rows={4}
                        maxLength={2000}
                        value={form.message}
                        onChange={(e) => {
                          setForm({ ...form, message: e.target.value });
                          if (errors.message) setErrors({ ...errors, message: undefined });
                        }}
                        placeholder={t.admissions.messagePlaceholder}
                        aria-invalid={Boolean(errors.message)}
                        className={`mt-1.5 w-full rounded-md border bg-[#F8FAFD] p-3.5 text-sm text-[#0B2E50] placeholder:text-[#64748B] focus:outline-none dark:bg-[#13253D] dark:text-[#E7EFF8] ${
                          errors.message
                            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                            : 'border-[#CBD8E6] focus:border-[#1769AA] dark:border-[#1E334D]'
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.submit}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#123D68] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0B2E50] disabled:opacity-60 dark:bg-[#1769AA] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                    >
                      {submitting ? t.admissions.submitBusy : t.admissions.submitIdle}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
