import prisma from '@mobiwave/prisma';
import { NotFoundError, ConflictError } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class ServiceService {
  async create(data: {
    tenantId: string;
    name: string;
    slug?: string;
    description?: string;
    category: string;
    basePrice: number;
    durationMinutes: number;
    requirements?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await prisma.service.findFirst({
      where: { tenantId: data.tenantId, slug },
    });
    if (existing) {
      throw new ConflictError(`Service with slug '${slug}' already exists`);
    }

    return prisma.service.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        basePrice: data.basePrice,
        durationMinutes: data.durationMinutes,
        requirements: data.requirements || [],
        isActive: true,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  async getById(id: string, tenantId: string) {
    const service = await prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!service) throw new NotFoundError('Service');
    return service;
  }

  async getBySlug(slug: string, tenantId: string) {
    const service = await prisma.service.findFirst({
      where: { slug, tenantId, deletedAt: null },
    });
    if (!service) throw new NotFoundError('Service');
    return service;
  }

  async update(id: string, tenantId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    basePrice?: number;
    durationMinutes?: number;
    requirements?: string[];
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const service = await prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!service) throw new NotFoundError('Service');

    return prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        basePrice: data.basePrice,
        durationMinutes: data.durationMinutes,
        requirements: data.requirements,
        isActive: data.isActive,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  async list(tenantId: string, page = 1, limit = 20, activeOnly = true) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId, deletedAt: null };
    if (activeOnly) where.isActive = true;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.service.count({ where }),
    ]);
    return { services, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string, tenantId: string) {
    const service = await prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!service) throw new NotFoundError('Service');

    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Service deleted successfully' };
  }
}

export const serviceService = new ServiceService();
