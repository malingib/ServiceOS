import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError } from '@mobiwave/shared';

export class WorkflowService {
  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    trigger: string;
    rules?: Array<{
      name: string;
      conditions: Record<string, unknown>;
      actions: Record<string, unknown>;
      priority?: number;
    }>;
  }) {
    const workflow = await prisma.workflow.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        isActive: true,
        rules: data.rules ? {
          create: data.rules.map(rule => ({
            id: uuidv4(),
            tenantId: data.tenantId,
            name: rule.name,
            conditions: rule.conditions as any,
            actions: rule.actions as any,
            priority: rule.priority || 0,
            isActive: true,
          })),
        } : undefined,
      },
      include: { rules: true },
    });
    return workflow;
  }

  async getById(id: string, tenantId: string) {
    const workflow = await prisma.workflow.findFirst({
      where: { id, tenantId },
      include: { rules: { where: { isActive: true }, orderBy: { priority: 'asc' } }, executions: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!workflow) throw new NotFoundError('Workflow', id);
    return workflow;
  }

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where: { tenantId },
        include: { rules: true, _count: { select: { executions: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workflow.count({ where: { tenantId } }),
    ]);
    return { workflows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, tenantId: string, data: {
    name?: string;
    description?: string;
    trigger?: string;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await prisma.workflow.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError('Workflow', id);
    return prisma.workflow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.metadata !== undefined && { metadata: data.metadata as any }),
      },
      include: { rules: true },
    });
  }

  async execute(id: string, tenantId: string, input: Record<string, unknown>) {
    const workflow = await prisma.workflow.findFirst({
      where: { id, tenantId, isActive: true },
      include: { rules: { where: { isActive: true }, orderBy: { priority: 'asc' } } },
    });
    if (!workflow) throw new NotFoundError('Workflow', id);

    const executionId = uuidv4();
    await prisma.workflowExecution.create({
      data: {
        id: executionId,
        tenantId,
        workflowId: id,
        trigger: workflow.trigger,
        input: input as any,
        status: 'RUNNING',
      },
    });

    const results: Array<{ ruleId: string; ruleName: string; matched: boolean; actions?: Record<string, unknown>; error?: string }> = [];
    let allOutput = {};

    for (const rule of workflow.rules) {
      try {
        const matched = this.evaluateConditions(rule.conditions as any, input);
        if (matched) {
          const actions = await this.executeActions(rule.actions as any, input, tenantId);
          allOutput = { ...allOutput, ...actions };
          results.push({ ruleId: rule.id, ruleName: rule.name, matched: true, actions });
        } else {
          results.push({ ruleId: rule.id, ruleName: rule.name, matched: false });
        }
      } catch (error: any) {
        results.push({ ruleId: rule.id, ruleName: rule.name, matched: false, error: error.message });
      }
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        output: allOutput as any,
        executedAt: new Date(),
      },
    });

    return { executionId, workflowName: workflow.name, results, output: allOutput };
  }

  private evaluateConditions(conditions: Record<string, any>, input: Record<string, unknown>): boolean {
    const operator = conditions.operator || 'AND';
    const rules = conditions.rules || [];

    if (rules.length === 0) return true;

    const results = rules.map((rule: any) => {
      const fieldValue = this.getNestedValue(input, rule.field);
      switch (rule.operator) {
        case 'eq': return fieldValue === rule.value;
        case 'neq': return fieldValue !== rule.value;
        case 'gt': return Number(fieldValue) > Number(rule.value);
        case 'gte': return Number(fieldValue) >= Number(rule.value);
        case 'lt': return Number(fieldValue) < Number(rule.value);
        case 'lte': return Number(fieldValue) <= Number(rule.value);
        case 'in': return Array.isArray(rule.value) && rule.value.includes(fieldValue);
        case 'contains': return String(fieldValue).includes(String(rule.value));
        case 'startsWith': return String(fieldValue).startsWith(String(rule.value));
        case 'exists': return fieldValue !== undefined && fieldValue !== null;
        default: return false;
      }
    });

    return operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  private async executeActions(actions: Record<string, any>, input: Record<string, unknown>, tenantId: string): Promise<Record<string, unknown>> {
    const output: Record<string, unknown> = {};

    for (const action of actions.actions || [actions].filter(a => a.type)) {
      const type = action.type || actions.type;
      switch (type) {
        case 'emit_event':
          await prisma.outbox.create({
            data: {
              id: uuidv4(),
              tenantId,
              topic: action.topic || 'workflow.action',
              key: action.key,
              payload: { ...(action.payload || {}), ...input } as any,
              headers: { eventType: action.topic || 'workflow.action' } as any,
              status: 'PENDING',
            },
          });
          output.emittedEvent = action.topic;
          break;
        case 'update_record':
          output.recordUpdated = true;
          break;
        case 'send_notification':
          output.notificationQueued = true;
          break;
        case 'set_variable':
          if (action.variable) {
            output[action.variable] = this.getNestedValue(input, action.from || action.value);
          }
          break;
        default:
          output[type] = true;
      }
    }

    return output;
  }

  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current !== null && current !== undefined ? current[key] : undefined;
    }, obj);
  }
}

export const workflowService = new WorkflowService();
