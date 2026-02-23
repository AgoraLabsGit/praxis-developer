export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  github_repo: string | null;
  color: string;
  status: string;
  created_at: string;
  teams?: { id: string; agents?: { count: number }[] }[];
};

export type Agent = {
  id: string;
  team_id: string;
  name: string;
  type: 'research' | 'builder' | 'review' | 'sync';
  model_provider: string;
  model_name: string;
  provider_id: string | null;
  system_prompt: string;
  max_cost_per_run: number;
  monthly_budget: number;
  current_month_spend: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_agent_id: string | null;
  workflow_run_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  user_id: string | null;
  status: string;
  current_step: number;
  total_steps: number;
  input_task: string;
  pr_url: string | null;
  total_cost: number;
  started_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
};
