import type { ActionPlan, PlanAction } from "@/features/plans/model";
import {
  createPlanActionInputSchema,
  createPlanInputSchema,
  updatePlanActionInputSchema,
  updatePlanInputSchema,
} from "@/lib/validation/plans";
import { ResourceNotFoundError } from "@/server/http/responses";
import {
  createPlanActionRecord,
  createPlanRecord,
  deletePlanRecord,
  listPlanActionRecords,
  listPlanRecords,
  updatePlanActionRecord,
  updatePlanRecord,
  type PlanActionRecord,
  type PlanRecord,
} from "@/server/repositories/plan-repository";
import { requireProductDataAccess } from "@/server/services/product-access-service";

function serializeAction(action: PlanActionRecord): PlanAction {
  return {
    completedAt: action.completedAt?.toDate().toISOString() ?? null,
    createdAt: action.createdAt.toDate().toISOString(),
    description: action.description,
    dueDate: action.dueDate,
    id: action.id,
    planId: action.planId,
    schemaVersion: action.schemaVersion,
    status: action.status,
    title: action.title,
    updatedAt: action.updatedAt.toDate().toISOString(),
  };
}

async function serializePlan(
  userId: string,
  plan: PlanRecord,
): Promise<ActionPlan> {
  const actions = await listPlanActionRecords(userId, plan.id);

  return {
    actions: actions.map((action) => serializeAction(action)),
    checkInFrequency: plan.checkInFrequency,
    createdAt: plan.createdAt.toDate().toISOString(),
    description: plan.description,
    id: plan.id,
    linkedTags: plan.linkedTags,
    schemaVersion: plan.schemaVersion,
    sourceType: plan.sourceType,
    startDate: plan.startDate,
    status: plan.status,
    targetDate: plan.targetDate,
    title: plan.title,
    updatedAt: plan.updatedAt.toDate().toISOString(),
  };
}

export async function listPlans(
  userId: string | null | undefined,
): Promise<ActionPlan[]> {
  const context = await requireProductDataAccess(userId);
  const plans = await listPlanRecords(context.userId);

  return Promise.all(plans.map((plan) => serializePlan(context.userId, plan)));
}

export async function createPlan(
  userId: string | null | undefined,
  input: unknown,
): Promise<ActionPlan> {
  const context = await requireProductDataAccess(userId);
  const parsed = createPlanInputSchema.parse(input);
  const plan = await createPlanRecord(context.userId, parsed);

  return serializePlan(context.userId, plan);
}

export async function updatePlan(
  userId: string | null | undefined,
  planId: string,
  input: unknown,
): Promise<ActionPlan> {
  const context = await requireProductDataAccess(userId);
  const parsed = updatePlanInputSchema.parse(input);
  const plan = await updatePlanRecord(context.userId, planId, parsed);

  if (!plan) {
    throw new ResourceNotFoundError();
  }

  return serializePlan(context.userId, plan);
}

export async function deletePlan(
  userId: string | null | undefined,
  planId: string,
): Promise<void> {
  const context = await requireProductDataAccess(userId);
  const deleted = await deletePlanRecord(context.userId, planId);

  if (!deleted) {
    throw new ResourceNotFoundError();
  }
}

export async function createPlanAction(
  userId: string | null | undefined,
  planId: string,
  input: unknown,
): Promise<PlanAction> {
  const context = await requireProductDataAccess(userId);
  const parsed = createPlanActionInputSchema.parse(input);
  const action = await createPlanActionRecord(context.userId, planId, parsed);

  if (!action) {
    throw new ResourceNotFoundError();
  }

  return serializeAction(action);
}

export async function updatePlanAction(
  userId: string | null | undefined,
  planId: string,
  actionId: string,
  input: unknown,
): Promise<PlanAction> {
  const context = await requireProductDataAccess(userId);
  const parsed = updatePlanActionInputSchema.parse(input);
  const action = await updatePlanActionRecord(
    context.userId,
    planId,
    actionId,
    parsed,
  );

  if (!action) {
    throw new ResourceNotFoundError();
  }

  return serializeAction(action);
}
