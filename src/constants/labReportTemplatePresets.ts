/**
 * Per–lab-test report layouts for clinical (non-pathology) results.
 * Stored on lab_tests.report_template (JSON); when null, presets match by name/code.
 */

export type LabReportParam = {
  key: string;
  label: string;
  unit?: string;
  reference?: string;
  /** When set, Unit column is a dropdown; values stored as `${key}__unit` in result JSON. */
  unit_options?: string[];
  /** When set, Reference column is a dropdown; values stored as `${key}__reference`. */
  reference_options?: string[];
  input?: 'text' | 'select';
  options?: string[];
  /** Wider text fields (pathology / narrative lines) */
  multiline?: boolean;
};

/** Matches `test_categories.report_type` (ERP default layout). */
export type CategoryReportType =
  | 'numeric'
  | 'text'
  | 'culture'
  | 'paragraph'
  | 'pathology'
  | 'single'
  | 'pcr';

export type LabReportTemplate = {
  layout: 'single' | 'parameter_table';
  /** Shown above the parameter grid */
  title?: string;
  parameters: LabReportParam[];
};

/** JSON keys for per-row unit / reference when using `unit_options` / `reference_options`. */
export function structuredUnitKey(paramKey: string): string {
  return `${paramKey}__unit`;
}

export function structuredReferenceKey(paramKey: string): string {
  return `${paramKey}__reference`;
}

const CBC_TEMPLATE: LabReportTemplate = {
  layout: 'parameter_table',
  title: 'Complete blood count (CBC)',
  parameters: [
    { key: 'wbc', label: 'WBC', unit: '×10³/µL', reference: '4.0–11.0' },
    { key: 'rbc', label: 'RBC', unit: '×10⁶/µL', reference: '4.2–5.9' },
    { key: 'hgb', label: 'Hemoglobin', unit: 'g/dL', reference: '12–16 (F), 13–17 (M)' },
    { key: 'hct', label: 'Hematocrit', unit: '%', reference: '36–46 (F), 41–53 (M)' },
    { key: 'mcv', label: 'MCV', unit: 'fL', reference: '80–100' },
    { key: 'mch', label: 'MCH', unit: 'pg', reference: '27–33' },
    { key: 'mchc', label: 'MCHC', unit: 'g/dL', reference: '32–36' },
    { key: 'rdw', label: 'RDW-CV', unit: '%', reference: '11.5–14.5' },
    { key: 'plt', label: 'Platelets', unit: '×10³/µL', reference: '150–400' },
    { key: 'mpv', label: 'MPV', unit: 'fL', reference: '7.4–10.4' },
    { key: 'neut', label: 'Neutrophils', unit: '%', reference: '40–70' },
    { key: 'lymph', label: 'Lymphocytes', unit: '%', reference: '20–45' },
    { key: 'mono', label: 'Monocytes', unit: '%', reference: '2–10' },
    { key: 'eos', label: 'Eosinophils', unit: '%', reference: '0–6' },
    { key: 'baso', label: 'Basophils', unit: '%', reference: '0–2' },
  ],
};

const NP_SEEN = ['None seen', 'Present', 'Not performed'] as const;
const NOT_SEEN_PRESENT = ['Not seen', 'Present', 'Not performed'] as const;
const U_DASH = ['—', 'N/A'] as const;
const U_HPF = ['/HPF', '/LPF', '—'] as const;
const REF_RBC = ['0–2', '0–3', '0–5', '1–3', '—'] as const;
const REF_PUS = ['0–5', '0–10', '1–5', '5–10', '—'] as const;

/** Matches master catalog MC-STO-OP — professional O&P + stool microscopy rows. */
const STOOL_OP_EXAMINATION_TEMPLATE: LabReportTemplate = {
  layout: 'parameter_table',
  title: 'Stool O&P Examination',
  parameters: [
    {
      key: 'consistency',
      label: 'Consistency',
      input: 'select',
      options: ['Formed', 'Soft', 'Loose', 'Watery'],
      unit_options: [...U_DASH],
      reference_options: ['Formed', 'Soft', 'Loose', 'Watery', '—'],
    },
    {
      key: 'color',
      label: 'Color',
      input: 'select',
      options: ['Brown', 'Yellow', 'Green', 'Black', 'Red', 'Other'],
      unit_options: [...U_DASH],
      reference_options: ['Brown', 'Yellow', 'Green', 'Black', 'Red', 'Other', '—'],
    },
    {
      key: 'occult_blood',
      label: 'Occult blood',
      input: 'select',
      options: ['Negative', 'Positive', 'Not performed'],
      unit_options: [...U_DASH],
      reference_options: ['Negative', 'Positive', 'Not performed', '—'],
    },
    {
      key: 'ova',
      label: 'Ova',
      input: 'select',
      options: [...NP_SEEN],
      unit_options: [...U_DASH],
      reference_options: [...NP_SEEN, 'Rare', '—'],
    },
    {
      key: 'parasites',
      label: 'Parasites',
      input: 'select',
      options: [...NP_SEEN],
      unit_options: [...U_DASH],
      reference_options: [...NP_SEEN, 'Rare', '—'],
    },
    {
      key: 'cysts',
      label: 'Cysts',
      input: 'select',
      options: [...NP_SEEN],
      unit_options: [...U_DASH],
      reference_options: [...NP_SEEN, 'Rare', '—'],
    },
    {
      key: 'trophozoites',
      label: 'Trophozoites',
      input: 'select',
      options: [...NP_SEEN],
      unit_options: [...U_DASH],
      reference_options: [...NP_SEEN, 'Rare', '—'],
    },
    {
      key: 'rbcs',
      label: 'RBCs',
      unit: '/HPF',
      reference: '0–2',
      unit_options: [...U_HPF],
      reference_options: [...REF_RBC],
    },
    {
      key: 'pus_cells',
      label: 'Pus cells',
      unit: '/HPF',
      reference: '0–5',
      unit_options: [...U_HPF],
      reference_options: [...REF_PUS],
    },
    {
      key: 'mucus',
      label: 'Mucus',
      input: 'select',
      options: [...NOT_SEEN_PRESENT],
      unit_options: [...U_DASH],
      reference_options: [...NOT_SEEN_PRESENT, '+', '++', '—'],
    },
    {
      key: 'yeast',
      label: 'Yeast',
      input: 'select',
      options: [...NOT_SEEN_PRESENT],
      unit_options: [...U_DASH],
      reference_options: [...NOT_SEEN_PRESENT, '+', '++', '—'],
    },
    {
      key: 'fat_globules',
      label: 'Fat globules',
      input: 'select',
      options: [...NOT_SEEN_PRESENT],
      unit_options: [...U_DASH],
      reference_options: [...NOT_SEEN_PRESENT, '+', '++', '—'],
    },
    {
      key: 'undigested_food',
      label: 'Undigested food',
      input: 'select',
      options: ['None', 'Few', 'Moderate', 'Not performed'],
      unit_options: [...U_DASH],
      reference_options: ['None', 'Few', 'Moderate', 'Not performed', '—'],
    },
    {
      key: 'comment',
      label: 'Comment',
      reference: 'e.g. No ova or parasites detected.',
      multiline: true,
      unit_options: [...U_DASH],
      reference_options: [
        '—',
        'No ova or parasites detected.',
        'Ova and/or parasites seen — see description.',
        'Further evaluation recommended.',
      ],
    },
  ],
};

const H_PYLORI_TEMPLATE: LabReportTemplate = {
  layout: 'parameter_table',
  title: 'Helicobacter pylori serology / related',
  parameters: [
    {
      key: 'igg',
      label: 'Anti–H. pylori IgG',
      input: 'select',
      options: ['Negative', 'Positive', 'Borderline', 'Not done'],
    },
    {
      key: 'igm',
      label: 'Anti–H. pylori IgM',
      input: 'select',
      options: ['Negative', 'Positive', 'Borderline', 'Not done'],
    },
    { key: 'iga', label: 'Anti–H. pylori IgA', input: 'select', options: ['Negative', 'Positive', 'Borderline', 'Not done'] },
    { key: 'urea_breath', label: 'Urea breath test', input: 'select', options: ['Negative', 'Positive', 'Not done'] },
    { key: 'stool_ag', label: 'Stool antigen', input: 'select', options: ['Negative', 'Positive', 'Not done'] },
    { key: 'method', label: 'Method / kit', reference: 'e.g. ELISA, rapid' },
  ],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isCbcMatch(name: string, code: string): boolean {
  const n = norm(name);
  const c = norm(code);
  return (
    n.includes('cbc') ||
    n.includes('complete blood count') ||
    c.includes('cbc') ||
    n.includes('full blood count') ||
    n.includes('blood count')
  );
}

function isStoolOpExaminationMatch(name: string, code: string): boolean {
  const n = norm(name);
  const c = norm(code);
  if (c.includes('mc-sto-op') || c.includes('sto-op')) return true;
  if (!n.includes('stool')) return false;
  return (
    n.includes('o&p') ||
    n.includes('o and p') ||
    n.includes('ova and parasite') ||
    n.includes('ova & parasite') ||
    (n.includes('ova') && n.includes('parasite'))
  );
}

function isHpyloriMatch(name: string, code: string): boolean {
  const n = norm(name);
  const c = norm(code);
  return (
    n.includes('helicobacter') ||
    n.includes('h. pylori') ||
    n.includes('h pylori') ||
    n.includes('hpylori') ||
    n.includes('pylori') ||
    c.includes('hpyl') ||
    c.includes('h-pyl') ||
    c.includes('hpy')
  );
}

function coerceTemplate(raw: unknown): LabReportTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const layout = o.layout;
  const parameters = o.parameters;
  if (layout !== 'parameter_table' && layout !== 'single') return null;
  if (!Array.isArray(parameters) || parameters.length === 0) return null;
  const params: LabReportParam[] = [];
  for (const p of parameters) {
    if (!p || typeof p !== 'object') continue;
    const row = p as Record<string, unknown>;
    const key = typeof row.key === 'string' ? row.key : '';
    const label = typeof row.label === 'string' ? row.label : key;
    if (!key) continue;
    const param: LabReportParam = { key, label };
    if (typeof row.unit === 'string') param.unit = row.unit;
    if (typeof row.reference === 'string') param.reference = row.reference;
    if (Array.isArray(row.unit_options) && row.unit_options.every((x) => typeof x === 'string')) {
      param.unit_options = row.unit_options as string[];
    }
    if (
      Array.isArray(row.reference_options) &&
      row.reference_options.every((x) => typeof x === 'string')
    ) {
      param.reference_options = row.reference_options as string[];
    }
    if (row.input === 'select' || row.input === 'text') param.input = row.input;
    if (Array.isArray(row.options) && row.options.every((x) => typeof x === 'string')) {
      param.options = row.options as string[];
    }
    if (row.multiline === true) {
      param.multiline = true;
    }
    params.push(param);
  }
  if (params.length === 0) return null;
  return {
    layout: layout as 'single' | 'parameter_table',
    title: typeof o.title === 'string' ? o.title : undefined,
    parameters: params,
  };
}

const SIR_OPTIONS = ['—', 'S', 'I', 'R', 'NS'];

function fallbackTemplateForCategoryType(
  reportType: string | null | undefined,
  labTest: {
    name?: string;
    code?: string;
    unit?: string;
    reference_range?: string;
  }
): LabReportTemplate | null {
  const title = labTest.name || 'Result';
  const unit = labTest.unit || '';
  const ref = labTest.reference_range || '—';

  switch (reportType) {
    case 'single':
      return {
        layout: 'parameter_table',
        title,
        parameters: [{ key: 'result', label: 'Result', unit, reference: ref }],
      };
    case 'numeric':
      return {
        layout: 'parameter_table',
        title,
        parameters: [
          {
            key: 'value',
            label: labTest.name || 'Value',
            unit,
            reference: ref,
          },
        ],
      };
    case 'text':
      return {
        layout: 'parameter_table',
        title,
        parameters: [
          { key: 'macroscopic', label: 'Appearance / macroscopic', reference: '' },
          { key: 'microscopic', label: 'Microscopy / findings', reference: '', multiline: true },
          { key: 'comment', label: 'Comment', reference: '', multiline: true },
        ],
      };
    case 'culture':
      return {
        layout: 'parameter_table',
        title: `${title} — culture & sensitivity`,
        parameters: [
          { key: 'specimen', label: 'Specimen', reference: '' },
          { key: 'organism', label: 'Organism', reference: '' },
          { key: 'ab1', label: 'Antibiotic 1', input: 'select', options: SIR_OPTIONS },
          { key: 'ab2', label: 'Antibiotic 2', input: 'select', options: SIR_OPTIONS },
          { key: 'ab3', label: 'Antibiotic 3', input: 'select', options: SIR_OPTIONS },
          { key: 'ab4', label: 'Antibiotic 4', input: 'select', options: SIR_OPTIONS },
          { key: 'ab5', label: 'Antibiotic 5', input: 'select', options: SIR_OPTIONS },
          { key: 'comment', label: 'Notes', reference: '', multiline: true },
        ],
      };
    case 'paragraph':
      return {
        layout: 'parameter_table',
        title,
        parameters: [
          { key: 'clinical', label: 'Clinical information', reference: '', multiline: true },
          { key: 'specimen', label: 'Specimen / site', reference: '', multiline: true },
          { key: 'gross', label: 'Gross description', reference: '', multiline: true },
          { key: 'micro', label: 'Microscopic description', reference: '', multiline: true },
          { key: 'diagnosis', label: 'Diagnosis', reference: '', multiline: true },
          { key: 'comment', label: 'Comment', reference: '', multiline: true },
        ],
      };
    case 'pcr':
      return {
        layout: 'parameter_table',
        title,
        parameters: [
          { key: 'target', label: 'Target / gene', reference: '' },
          { key: 'ct', label: 'Ct / quantitative value', reference: '' },
          {
            key: 'qual_result',
            label: 'Qualitative result',
            input: 'select',
            options: ['Negative', 'Positive', 'Indeterminate', 'Not performed'],
          },
          { key: 'interpretation', label: 'Interpretation', reference: '', multiline: true },
        ],
      };
    default:
      return null;
  }
}

export function resolveLabReportTemplate(
  labTest: {
    name?: string;
    code?: string;
    unit?: string;
    reference_range?: string;
    report_template?: unknown;
  },
  options?: { categoryReportType?: string | null }
): LabReportTemplate | null {
  const fromDb = coerceTemplate(labTest.report_template);
  if (fromDb) return fromDb;

  const name = labTest.name || '';
  const code = labTest.code || '';
  if (isCbcMatch(name, code)) return CBC_TEMPLATE;
  if (isStoolOpExaminationMatch(name, code)) return STOOL_OP_EXAMINATION_TEMPLATE;
  if (isHpyloriMatch(name, code)) return H_PYLORI_TEMPLATE;

  const crt = (options?.categoryReportType || '').toLowerCase();
  /** Visit uses PathologyRecordForm narrative sections, not per-test structured rows. */
  if (crt === 'pathology') {
    return null;
  }

  return fallbackTemplateForCategoryType(options?.categoryReportType, labTest);
}

/** Parse visit_test.result_value into structured map when using a template. */
export function parseStructuredResultValue(
  resultValue: string | undefined | null
): { structured: Record<string, string>; legacySingle: string } {
  const raw = (resultValue || '').trim();
  if (!raw) return { structured: {}, legacySingle: '' };
  try {
    const j = JSON.parse(raw) as unknown;
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      const structured: Record<string, string> = {};
      for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
        if (typeof v === 'string' || typeof v === 'number') {
          structured[k] = String(v);
        }
      }
      return { structured, legacySingle: '' };
    }
  } catch {
    /* plain string */
  }
  return { structured: {}, legacySingle: raw };
}
