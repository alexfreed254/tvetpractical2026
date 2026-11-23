export type UserRole =
  | 'super_admin'
  | 'hod'
  | 'trainer'
  | 'internal_verifier'
  | 'external_verifier'
  | 'trainee'
  | 'management';

export interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  staff_or_adm_no: string;
  avatar_url?: string | null;
  active: boolean;
}

export interface AuthDirectoryUser {
  id: string;
  supabase_user_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  staff_or_adm_no: string;
  department_id?: string | null;
  avatar_url?: string | null;
  in_supabase_auth: boolean;
  last_sign_in_at?: string | null;
  created_at?: string | null;
}

export interface AuthStateInfo {
  checked: boolean;
  supabaseAuthConfigured: boolean;
  supabaseUserCount: number;
  adminClaimed: boolean;
  envAdminPasscodeActive: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hod_name: string;
}

export interface Course {
  id: string;
  department_id: string;
  code: string;
  title: string;
  level: string;
}

export interface CohortClass {
  id: string;
  course_id: string;
  name: string;
  level: string;
  cycle: string;
  academic_year: string;
  term: string;
}

export interface Unit {
  id: string;
  course_id: string;
  code: string;
  name: string;
  level: string;
}

export interface TrainerAllocation {
  id: string;
  trainer_user_id: string;
  class_id: string;
  unit_id: string;
  academic_year: string;
  term: string;
  allocated_by: string;
  allocated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  department: string;
  logo_url: string;
  competency_threshold: number;
  oral_weight_percent?: number;
  practical_weight_percent?: number;
  active_academic_year?: string;
  active_term?: string;
}

export interface Trainee {
  id: string;
  admission_number: string;
  full_name: string;
  class_name: string;
  course_title: string;
  department_id?: string;
  course_id?: string;
  class_id?: string;
  level?: string;
  cycle?: string;
}

export interface AssessmentItem {
  id: string;
  task_id: string;
  item_number: string;
  description: string;
  max_marks: number;
  is_subcriterion: boolean;
  parent_item_id: string | null;
  sort_order: number;
  instruction?: string;
}

export interface AssessmentTask {
  id: string;
  assessment_id: string;
  task_number: number;
  task_title: string;
  sort_order: number;
  items: AssessmentItem[];
}

export type ChecklistScoringMode = 'numerical' | 'binary';

export interface ChecklistCriterion {
  id: string;
  checklist_id: string;
  item_number: string;
  description: string;
  max_marks: number;
  is_subitem: boolean;
  parent_criteria_id: string | null;
  sort_order: number;
  performance_indicator?: string;
  competency_standard?: string;
}

export interface ObservationChecklist {
  id: string;
  assessment_id: string;
  title: string;
  instruction?: string;
  scoring_mode?: ChecklistScoringMode;
  sort_order: number;
  criteria: ChecklistCriterion[];
}

export type AssessmentType = 'PRACTICAL' | 'ORAL' | 'THEORY' | 'PROJECT';
export type AssessmentStatus = 'draft' | 'published' | 'withdrawn' | 'archived';

export interface AssessmentAttachment {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

export interface Assessment {
  id: string;
  institution_id: string;
  title: string;
  assessment_number: number;
  assessment_type: AssessmentType;
  department_id?: string;
  department_name: string;
  course_id?: string;
  course_title: string;
  class_id?: string;
  class_name?: string;
  unit_id?: string;
  level: string;
  cycle?: string;
  unit_code: string;
  unit_name: string;
  assessment_date: string;
  deadline_date?: string;
  duration_minutes: number;
  academic_year: string;
  term: string;
  status: AssessmentStatus;
  version?: number;
  parent_assessment_id?: string | null;
  is_template?: boolean;
  published_at?: string;
  created_by?: string;
  instructions?: string;
  required_tools_materials?: string;
  safety_ppe?: string;
  marking_guidelines?: string;
  reference_attachments?: AssessmentAttachment[];
  competency_threshold: number;
  tasks: AssessmentTask[];
  checklists: ObservationChecklist[];
  updated_at: string;
}

export interface CriterionResult {
  item_id: string;
  marks_obtained: number;
  comments: string;
  observations?: string;
  competency_achieved?: boolean;
}

export interface ChecklistResult {
  criteria_id: string;
  marks_obtained: number;
  comments: string;
  observations?: string;
  competency_status?: 'Achieved' | 'Not Yet Achieved' | 'Pending';
}

export type EvidenceCategory =
  | 'Photograph'
  | 'Video'
  | 'Audio'
  | 'Document'
  | 'Scanned Document';

export interface EvidenceVersion {
  version: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  preview_url?: string;
}

export interface AssessmentEvidence {
  id: string;
  session_id: string;
  assessment_id: string;
  trainee_id: string;
  trainee_adm_no: string;
  trainee_name: string;
  course_title: string;
  class_name: string;
  unit_name: string;
  assessment_type: AssessmentType;
  assessment_number: number;
  target_type: 'task_item' | 'checklist_criterion' | 'general';
  target_id: string;
  target_label: string;
  category: EvidenceCategory;
  file_name: string;
  mime_type: string;
  file_size: number;
  preview_url?: string;
  uploaded_at: string;
  assessor_name: string;
  version: number;
  previous_versions?: EvidenceVersion[];
}

export interface CorrectionRequest {
  id: string;
  session_id: string;
  target_type: 'task_item' | 'checklist_criterion';
  target_id: string;
  target_label: string;
  previous_marks: number;
  requested_marks: number;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: 'assessment' | 'session' | 'evidence' | 'correction' | 'allocation' | 'institution';
  entity_id: string;
  action: string;
  actor_name: string;
  actor_role: UserRole;
  details: string;
  timestamp: string;
}

export type SessionStatus = 'in_progress' | 'submitted' | 'verified' | 'returned' | 'rejected';
export type CompetencyOutcome =
  | 'Not Yet Competent'
  | 'Competent'
  | 'Proficient'
  | 'Mastery'
  | 'Pending';
export type VerificationStatus = 'pending' | 'approved' | 'returned' | 'rejected';

export interface AssessmentSession {
  id: string;
  assessment_id: string;
  trainee_id: string;
  assessor_user_id?: string;
  assessor_name: string;
  assessment_date: string;
  venue: string;
  status: SessionStatus;
  attempt_number?: number;
  parent_session_id?: string | null;
  is_reassessment?: boolean;
  grand_total_available: number;
  grand_total_obtained: number;
  percentage: number;
  competency_outcome: CompetencyOutcome;
  results: CriterionResult[];
  checklist_results: ChecklistResult[];
  evidence?: AssessmentEvidence[];
  correction_requests?: CorrectionRequest[];
  feedback_from_candidate: string;
  feedback_to_candidate: string;
  candidate_signed_at?: string;
  assessor_signed_at?: string;
  verification_status?: VerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  verifier_name?: string;
  external_verifier_name?: string;
  external_verification_notes?: string;
  external_verified_at?: string;
  results_released?: boolean;
  released_at?: string;
  released_by?: string;
  updated_at: string;
}

export type AppRoute =
  | 'overview'
  | 'admin'
  | 'assessments'
  | 'builder'
  | 'execute'
  | 'sessions'
  | 'export-zip';
