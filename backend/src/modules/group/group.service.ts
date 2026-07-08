import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateGroupInput, UpdateGroupInput } from '../../validators/group.validator';

const groupWithParticipants = {
  groupParticipants: {
    include: {
      participant: true,
    },
  },
} as const;

function mapGroupDetail<T extends {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  groupParticipants: Array<{
    participant: {
      id: string;
      name: string | null;
      photoUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}>(group: T) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    participants: group.groupParticipants.map((gp) => gp.participant),
  };
}

function mapGroupListItem(group: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { groupParticipants: number };
}) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    participantCount: group._count.groupParticipants,
  };
}

/** Valida que todos los IDs existan en Participant. */
async function assertParticipantsExist(participantIds: string[]) {
  const uniqueIds = [...new Set(participantIds)];
  if (!uniqueIds.length) return uniqueIds;

  const count = await prisma.participant.count({
    where: { id: { in: uniqueIds } },
  });
  if (count !== uniqueIds.length) {
    throw new AppError('One or more participants not found', 'NOT_FOUND', 404);
  }
  return uniqueIds;
}

/** Reemplaza miembros del grupo (lista completa). */
async function syncGroupParticipants(groupId: string, participantIds: string[]) {
  const uniqueIds = await assertParticipantsExist(participantIds);

  await prisma.$transaction(async (tx) => {
    await tx.groupParticipant.deleteMany({ where: { groupId } });
    if (uniqueIds.length) {
      await tx.groupParticipant.createMany({
        data: uniqueIds.map((participantId) => ({ groupId, participantId })),
      });
    }
  });
}

export class GroupService {
  /** GET /groups — ordenados por createdAt DESC */
  async list() {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { groupParticipants: true } },
      },
    });
    return groups.map(mapGroupListItem);
  }

  /** POST /groups — opcionalmente vincula participantes */
  async create(input: CreateGroupInput) {
    const uniqueIds = await assertParticipantsExist(input.participantIds ?? []);

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });

      if (uniqueIds.length) {
        await tx.groupParticipant.createMany({
          data: uniqueIds.map((participantId) => ({
            groupId: created.id,
            participantId,
          })),
        });
      }

      return created;
    });

    return this.getById(group.id);
  }

  /** GET /groups/{id} — incluye participantes asociados */
  async getById(id: string) {
    const group = await prisma.group.findUnique({
      where: { id },
      include: groupWithParticipants,
    });

    if (!group) {
      throw new AppError('Group not found', 'NOT_FOUND', 404);
    }

    return mapGroupDetail(group);
  }

  /** PUT /groups/{id} — opcionalmente sincroniza participantes */
  async update(id: string, input: UpdateGroupInput) {
    const existing = await prisma.group.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Group not found', 'NOT_FOUND', 404);
    }

    if (input.name !== undefined || input.description !== undefined) {
      await prisma.group.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
      });
    }

    if (input.participantIds !== undefined) {
      await syncGroupParticipants(id, input.participantIds);
    }

    return this.getById(id);
  }

  /** DELETE /groups/{id} — cascade GroupParticipant vía Prisma/FK */
  async remove(id: string) {
    const existing = await prisma.group.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Group not found', 'NOT_FOUND', 404);
    }

    await prisma.group.delete({ where: { id } });
    return { id };
  }
}

export const groupService = new GroupService();
