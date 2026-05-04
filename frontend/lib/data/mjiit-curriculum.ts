/**
 * MJIIT — Bachelor of Chemical Process Engineering with Honours
 * Department of Chemical and Environmental Engineering (ChEE), MJIIT, UTM KL.
 *
 * Full canonical curriculum for the 2022/2023 intake onwards.
 * Credits follow the UTM code convention (last digit of the 4-digit numeric
 * portion = credit hours): SMJC1213→3cr, SMJC2711→1cr, SMJC4824→4cr, SMJG3206→6cr.
 */

export type Prefix =
  | 'SMJC'  // Chemical Process Engineering core
  | 'SMJM'  // MJIIT Mathematics
  | 'SMJP'  // MJIIT Programming
  | 'SMJG'  // MJIIT General (industrial training)
  | 'SHLJ'  // Japanese language (UTM)
  | 'UHLB'  // English language (UTM)
  | 'UHLJ'  // Japanese language (UTM alt)
  | 'UHLM'  // Malay language (UTM)
  | 'UHIS'  // Humanities: Islamic/philosophy (UTM)
  | 'UHMS'  // Humanities: Malaysian studies (UTM)
  | 'UMJT'  // MJIIT general education
  | 'ULRS'  // UTM religious studies / values

export type CourseKind =
  | 'core'
  | 'lab'
  | 'capstone'
  | 'elective'
  | 'general'          // University general-education subjects
  | 'language'         // Language courses
  | 'industrial'       // Industrial training

export type ElectiveGroup = 'resources' | 'environment' | 'energy'

export interface CurriculumCourse {
  code: string
  name: string
  credits: number
  /** Program year 1–4. Electives land in Year 4. */
  programYear: 1 | 2 | 3 | 4
  /** 1 or 2 (regular semesters) or 3 (industrial training short sem). */
  programSemester: 1 | 2 | 3
  kind: CourseKind
  /** Set for electives only. */
  electiveGroup?: ElectiveGroup
  description: string
  /** Presentation note (e.g. "local students only"). */
  note?: string
}

/** Derive credits from UTM code convention. Returns null on pattern mismatch. */
export function creditsFromCode(code: string): number | null {
  const m = /^[A-Z]{2,4}\d{3}(\d)$/.exec(code.trim().toUpperCase().replace(/\s+/g, ''))
  if (!m) return null
  const c = parseInt(m[1], 10)
  return Number.isFinite(c) && c >= 1 && c <= 9 ? c : null
}

/** Year level from the first digit of the numeric portion (1–4). */
export function yearLevelFromCode(code: string): 1 | 2 | 3 | 4 | null {
  const m = /^[A-Z]{2,4}(\d)\d{3}$/.exec(code.trim().toUpperCase().replace(/\s+/g, ''))
  if (!m) return null
  const y = parseInt(m[1], 10)
  return y >= 1 && y <= 4 ? (y as 1 | 2 | 3 | 4) : null
}

export const ELECTIVE_GROUP_LABEL: Record<ElectiveGroup, string> = {
  resources:   'Group 1 · Sustainable Resources',
  environment: 'Group 2 · Sustainable Environment',
  energy:      'Group 3 · Sustainable Energy',
}

const c = (
  code: string,
  name: string,
  credits: number,
  programYear: 1 | 2 | 3 | 4,
  programSemester: 1 | 2 | 3,
  kind: CourseKind,
  description: string,
  extra: { electiveGroup?: ElectiveGroup; note?: string } = {}
): CurriculumCourse => ({ code, name, credits, programYear, programSemester, kind, description, ...extra })

export const MJIIT_SMJC_CURRICULUM: CurriculumCourse[] = [
  // ── Year 1 Semester 1 (14 cr target) ─────────────────────────────────────────
  c('SMJC1202', 'Introduction to Chemical Process Engineering', 2, 1, 1, 'core',     'Foundational overview of chemical process engineering.'),
  c('SMJM1013', 'Engineering Mathematics 1',                     3, 1, 1, 'core',     'Calculus and algebra foundations.'),
  c('SMJC1101', 'Engineering Drawing with CAD',                  1, 1, 1, 'core',     'Technical drawing and CAD.'),
  c('SMJP1043', 'Programming for Engineers',                     3, 1, 1, 'core',     'Programming fundamentals for engineers.'),
  c('SMJC1003', 'Organic Chemistry 1',                           3, 1, 1, 'core',     'Introduction to organic chemistry.'),
  c('UHMS1182', 'Appreciation of Ethics and Civilisation',       2, 1, 1, 'general',  'Humanities core.', { note: 'Local students' }),
  c('UHLM1012', 'Malay Language for Communication 2',            2, 1, 1, 'language', 'Malay for communication.', { note: 'International students' }),
  c('UHLB1112', 'English Communication Skills',                  2, 1, 1, 'language', 'Academic English communication.'),

  // ── Year 1 Semester 2 (17 cr target) ─────────────────────────────────────────
  c('SMJC1213', 'Thermodynamics',                                3, 1, 2, 'core',     'Fundamentals of thermodynamics.'),
  c('SMJM1023', 'Engineering Mathematics 2',                     3, 1, 2, 'core',     'Multivariable calculus and differential equations.'),
  c('UHLJ1112', 'Japanese for Communication 1',                  2, 1, 2, 'language', 'Introductory Japanese.'),
  c('SMJC2013', 'Organic Chemistry 2',                           3, 1, 2, 'core',     'Advanced organic chemistry.'),
  c('UMJT2142', 'Professional Ethics, Safety and Health (Ningen-Ryoku)', 2, 1, 2, 'general', 'Ethics, safety, Japanese Ningen-Ryoku.'),
  c('ULRS1032', 'Integrity and Anti-Bribery',                    2, 1, 2, 'general',  'Integrity and anti-bribery.', { note: '2023/2024 intake onwards' }),
  c('SMJC2022', 'Analytical Chemistry',                          2, 1, 2, 'core',     'Analytical chemistry principles.'),

  // ── Year 2 Semester 1 (18 cr target) ─────────────────────────────────────────
  c('SMJC2223', 'Mass and Energy Balance',                       3, 2, 1, 'core',     'Material and energy balance calculations.'),
  c('SMJC2113', 'Fluid Mechanics',                               3, 2, 1, 'core',     'Fluid flow, pumps, pipes.'),
  c('SMJM2033', 'Engineering Mathematics 3',                     3, 2, 1, 'core',     'Vector calculus, PDEs, linear algebra.'),
  c('SHLJ2252', 'Japanese for Communication 2',                  2, 2, 1, 'language', 'Intermediate Japanese.'),
  c('UHLB2122', 'Professional Communication Skills 1',           2, 2, 1, 'language', 'Professional writing and presentation.'),
  c('UHIS1022', 'Philosophy and Current Issue',                  2, 2, 1, 'general',  'Philosophy and contemporary issues.'),

  // ── Year 2 Semester 2 (18 cr target) ─────────────────────────────────────────
  c('SMJC2701', 'Organic Chemistry/Analytical Lab',              1, 2, 2, 'lab',      'Wet lab: organic and analytical chemistry.'),
  c('SMJC2711', 'Chemical Process Engineering Laboratory 1',     1, 2, 2, 'lab',      'First core chemical engineering lab.'),
  c('SMJC2233', 'Physical Chemistry for Chemical Engineer',      3, 2, 2, 'core',     'Physical chemistry for process engineering.'),
  c('SMJC2243', 'Chemical Engineering Thermodynamics',           3, 2, 2, 'core',     'Advanced thermodynamics for chemical systems.'),
  c('SMJC2253', 'Transport Phenomena',                           3, 2, 2, 'core',     'Momentum, heat, mass transfer.'),
  c('SMJM2043', 'Engineering Statistics',                        3, 2, 2, 'core',     'Probability, statistics, DOE.'),
  c('SHLJ2352', 'Japanese for Communication 3',                  2, 2, 2, 'language', 'Upper-intermediate Japanese.'),

  // ── Year 3 Semester 1 (18 cr target) ─────────────────────────────────────────
  c('SMJC3263', 'Separation Process 1',                          3, 3, 1, 'core',     'Distillation, absorption and basic separations.'),
  c('SMJC3303', 'Chemical Kinetics and Reactor Design',          3, 3, 1, 'core',     'Reaction kinetics and reactor engineering.'),
  c('SMJC3313', 'Process Control and Instrumentation',           3, 3, 1, 'core',     'Dynamics, control, instrumentation.'),
  c('SMJC3273', 'Numerical Methods for Chemical Engineers',      3, 3, 1, 'core',     'Numerical techniques for chemical engineering.'),
  c('SMJC3323', 'Fundamentals of Microbiology and Biotechnology',3, 3, 1, 'core',     'Microbiology and biotech fundamentals.'),
  c('SMJC3721', 'Chemical Process Engineering Laboratory 2',     1, 3, 1, 'lab',      'Second core chemical engineering lab.'),
  c('ULRS3032', 'Entrepreneurship & Innovation',                 2, 3, 1, 'general',  'Entrepreneurship and innovation.'),

  // ── Year 3 Semester 2 (16 cr target) ─────────────────────────────────────────
  c('SMJC3283', 'Separation Process 2',                          3, 3, 2, 'core',     'Extraction, membranes, adsorption.'),
  c('SMJC3333', 'Introduction to Environmental Engineering',     3, 3, 2, 'core',     'Environmental impact, pollution control.'),
  c('SMJC3293', 'Materials Science',                             3, 3, 2, 'core',     'Materials for chemical process equipment.'),
  c('SMJC4353', 'Process Safety and Health',                     3, 3, 2, 'core',     'Process safety, HAZOP, occupational health.'),
  c('SMJC3731', 'Chemical Process Engineering Laboratory 3',     1, 3, 2, 'lab',      'Third core chemical engineering lab.'),
  c('SMJC3741', 'Chemical Process Engineering Laboratory 4',     1, 3, 2, 'lab',      'Fourth core chemical engineering lab.'),
  c('UHLB3132', 'Professional Communication Skills 2',           2, 3, 2, 'language', 'Advanced professional communication.'),

  // ── Year 3 Semester 3 (Industrial Training — 6 cr) ───────────────────────────
  c('SMJG3206', 'Industrial Training',                           6, 3, 3, 'industrial', '12-week minimum industrial placement.'),

  // ── Year 4 Semester 1 (15 cr target, 2 electives chosen separately) ──────────
  c('SMJC4813', 'Final Year Project 1',                          3, 4, 1, 'core',     'First half of the undergraduate research project.'),
  c('SMJC4343', 'Chemical Process Design',                       3, 4, 1, 'core',     'Integrated chemical process design.'),
  c('SMJC3123', 'Process Economic and Project Management',       3, 4, 1, 'core',     'Engineering economics and project management.'),

  // ── Year 4 Semester 2 (13 cr target, 2 electives chosen separately) ──────────
  c('SMJC4823', 'Final Year Project 2',                          3, 4, 2, 'core',     'Second half of the undergraduate research project.'),
  c('SMJC4824', 'Chemical Plant Design Project',                 4, 4, 2, 'capstone', 'Capstone integrated chemical plant design.'),

  // ── Electives (take any 4) ───────────────────────────────────────────────────
  // Group 1: Sustainable Resources
  c('SMJC4413', 'Fine Chemicals Technology',                     3, 4, 1, 'elective', 'Fine chemicals manufacturing.',    { electiveGroup: 'resources' }),
  c('SMJC4423', 'Polymer Science and Engineering',               3, 4, 1, 'elective', 'Polymer science and processing.',   { electiveGroup: 'resources' }),
  c('SMJC4433', 'Biotechnology and Bio-Processing',              3, 4, 1, 'elective', 'Bioprocess and downstream processing.', { electiveGroup: 'resources' }),
  c('SMJC4443', 'Fundamentals and Application of Bio-Sensors',   3, 4, 1, 'elective', 'Biosensor technology.',             { electiveGroup: 'resources' }),
  // Group 2: Sustainable Environment
  c('SMJC4513', 'Air Pollution Control Engineering',             3, 4, 1, 'elective', 'Air pollution control.',            { electiveGroup: 'environment' }),
  c('SMJC4523', 'Waste Water Engineering',                       3, 4, 1, 'elective', 'Wastewater treatment.',             { electiveGroup: 'environment' }),
  c('SMJC4533', 'Solid and Hazardous Waste Management',          3, 4, 1, 'elective', 'Waste management.',                 { electiveGroup: 'environment' }),
  c('SMJC4543', 'Environmental Microbiology and Biotechnology',  3, 4, 1, 'elective', 'Environmental biotech.',            { electiveGroup: 'environment' }),
  // Group 3: Sustainable Energy
  c('SMJC4613', 'Power Plant Engineering',                       3, 4, 1, 'elective', 'Power plant systems.',              { electiveGroup: 'energy' }),
  c('SMJC4623', 'Energy Conversion Science and Technology',      3, 4, 1, 'elective', 'Energy conversion.',                { electiveGroup: 'energy' }),
  c('SMJC4633', 'Fuel Cell Fundamentals',                        3, 4, 1, 'elective', 'Fuel cell fundamentals.',           { electiveGroup: 'energy' }),
  c('SMJC4643', 'Biomass Technology',                            3, 4, 1, 'elective', 'Biomass and biofuels.',             { electiveGroup: 'energy' }),
]
