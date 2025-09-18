-- PR-S1: Services, Plans, Plan Options and Student Services
-- Migration: 20250103_services_plans_p0.sql
-- Description: Create services, plans, plan_options and student_services tables with RLS

-- Services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for service name per organization
CREATE UNIQUE INDEX services_org_name_idx ON services (org_id, lower(name));

-- Index for active services per organization
CREATE INDEX services_org_active_idx ON services (org_id, active);

-- Plans table
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('parcelado','recorrente')),
  currency char(3) NOT NULL DEFAULT 'BRL',
  active boolean NOT NULL DEFAULT true,
  allow_duplicate_per_student boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for active plans per service
CREATE INDEX plans_service_active_idx ON plans (service_id, active);

-- Plan options table
CREATE TABLE plan_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  interval text NOT NULL CHECK (interval IN ('mensal','semanal','anual')),
  installments int CHECK (installments >= 1),
  price_per_interval numeric(12,2) NOT NULL CHECK (price_per_interval >= 0),
  entry_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (entry_amount >= 0),
  charge_entry_now boolean NOT NULL DEFAULT true,
  first_charge_offset_days int NOT NULL DEFAULT 0 CHECK (first_charge_offset_days >= 0),
  fine_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (fine_percent >= 0),
  active boolean NOT NULL DEFAULT true
);

-- Student services (vínculo) table
CREATE TABLE student_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  student_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES services(id),
  plan_option_id uuid NOT NULL REFERENCES plan_options(id),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','cancelado')),
  start_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for student services per organization, student and status
CREATE INDEX student_services_org_student_status_idx ON student_services (org_id, student_id, status);

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Users can view services from their organization" ON services
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert services" ON services
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update services" ON services
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete services" ON services
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for plans
CREATE POLICY "Users can view plans from their organization" ON plans
  FOR SELECT USING (
    service_id IN (SELECT id FROM services WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Admin/Manager can insert plans" ON plans
  FOR INSERT WITH CHECK (
    service_id IN (SELECT id FROM services WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update plans" ON plans
  FOR UPDATE USING (
    service_id IN (SELECT id FROM services WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete plans" ON plans
  FOR DELETE USING (
    service_id IN (SELECT id FROM services WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for plan_options
CREATE POLICY "Users can view plan options from their organization" ON plan_options
  FOR SELECT USING (
    plan_id IN (
      SELECT p.id FROM plans p 
      JOIN services s ON p.service_id = s.id 
      WHERE s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin/Manager can insert plan options" ON plan_options
  FOR INSERT WITH CHECK (
    plan_id IN (
      SELECT p.id FROM plans p 
      JOIN services s ON p.service_id = s.id 
      WHERE s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    ) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update plan options" ON plan_options
  FOR UPDATE USING (
    plan_id IN (
      SELECT p.id FROM plans p 
      JOIN services s ON p.service_id = s.id 
      WHERE s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    ) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete plan options" ON plan_options
  FOR DELETE USING (
    plan_id IN (
      SELECT p.id FROM plans p 
      JOIN services s ON p.service_id = s.id 
      WHERE s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    ) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for student_services
CREATE POLICY "Users can view student services from their organization" ON student_services
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert student services" ON student_services
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update student services" ON student_services
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete student services" ON student_services
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Constraints for data consistency
-- Rule 1: plans.type = 'parcelado' => plan_options.installments não nulo
CREATE OR REPLACE FUNCTION check_parcelado_installments()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT type FROM plans WHERE id = NEW.plan_id) = 'parcelado' AND NEW.installments IS NULL THEN
    RAISE EXCEPTION 'Plan type "parcelado" requires installments to be specified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_parcelado_installments
  BEFORE INSERT OR UPDATE ON plan_options
  FOR EACH ROW EXECUTE FUNCTION check_parcelado_installments();

-- Rule 2: plans.type = 'recorrente' => plan_options.installments nulo
CREATE OR REPLACE FUNCTION check_recorrente_no_installments()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT type FROM plans WHERE id = NEW.plan_id) = 'recorrente' AND NEW.installments IS NOT NULL THEN
    RAISE EXCEPTION 'Plan type "recorrente" cannot have installments';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_recorrente_no_installments
  BEFORE INSERT OR UPDATE ON plan_options
  FOR EACH ROW EXECUTE FUNCTION check_recorrente_no_installments();

-- Rule 3: plan_options.active = true para criar vínculo
CREATE OR REPLACE FUNCTION check_plan_option_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT (SELECT active FROM plan_options WHERE id = NEW.plan_option_id) THEN
    RAISE EXCEPTION 'Cannot create student service with inactive plan option';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_plan_option_active
  BEFORE INSERT ON student_services
  FOR EACH ROW EXECUTE FUNCTION check_plan_option_active();

-- Rule 4: Se plans.allow_duplicate_per_student = false => bloquear student_services ativo do mesmo service_id
CREATE OR REPLACE FUNCTION check_duplicate_student_service()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT (SELECT allow_duplicate_per_student FROM plans p JOIN plan_options po ON p.id = po.id WHERE po.id = NEW.plan_option_id) THEN
    IF EXISTS (
      SELECT 1 FROM student_services ss
      JOIN plan_options po ON ss.plan_option_id = po.id
      JOIN plans p ON po.plan_id = p.id
      WHERE ss.student_id = NEW.student_id 
        AND p.service_id = (SELECT service_id FROM plans p2 JOIN plan_options po2 ON p2.id = po2.id WHERE po2.id = NEW.plan_option_id)
        AND ss.status = 'ativo'
        AND ss.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Student already has an active service of this type and duplicates are not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_duplicate_student_service
  BEFORE INSERT OR UPDATE ON student_services
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_student_service();

-- Soft delete: bloquear hard delete se houver vínculo ativo
CREATE OR REPLACE FUNCTION prevent_delete_service_with_active_links()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM student_services ss
    JOIN plan_options po ON ss.plan_option_id = po.id
    JOIN plans p ON po.plan_id = p.id
    WHERE p.service_id = OLD.id AND ss.status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Cannot delete service with active student links. Deactivate instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_delete_service_with_active_links
  BEFORE DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_service_with_active_links();

-- Similar protection for plans
CREATE OR REPLACE FUNCTION prevent_delete_plan_with_active_links()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM student_services ss
    JOIN plan_options po ON ss.plan_option_id = po.id
    WHERE po.plan_id = OLD.id AND ss.status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Cannot delete plan with active student links. Deactivate instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_delete_plan_with_active_links
  BEFORE DELETE ON plans
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_plan_with_active_links();

-- Similar protection for plan_options
CREATE OR REPLACE FUNCTION prevent_delete_plan_option_with_active_links()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM student_services ss
    WHERE ss.plan_option_id = OLD.id AND ss.status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Cannot delete plan option with active student links. Deactivate instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_delete_plan_option_with_active_links
  BEFORE DELETE ON plan_options
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_plan_option_with_active_links();
