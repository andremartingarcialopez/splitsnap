import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type {
  CreateParticipantInput,
  UpdateParticipantInput,
} from '../../validators/participant.validator';

export class ParticipantService {
  /** GET /participants — listado (necesario para UI; orden name ASC, nulls last-ish) */
  async list(search?: string) {
    return prisma.participant.findMany({
      where: search
        ? {
            name: {
              contains: search,
            },
          }
        : undefined,
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      throw new AppError('Participant not found', 'NOT_FOUND', 404);
    }
    return participant;
  }

  async create(input: CreateParticipantInput) {
    return prisma.participant.create({
      data: {
        name: input.name,
        photoUrl: input.photoUrl,
      },
    });
  }

  async update(id: string, input: UpdateParticipantInput) {
    const existing = await this.getById(id);

    const nextName = input.name !== undefined ? input.name || null : existing.name;
    const nextPhoto =
      input.photoUrl !== undefined ? input.photoUrl || null : existing.photoUrl;

    if (!nextName && !nextPhoto) {
      throw new AppError(
        'At least name or photoUrl is required',
        'VALIDATION_ERROR',
        400,
      );
    }

    return prisma.participant.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name || null } : {}),
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await prisma.participant.delete({ where: { id } });
    return { id };
  }
}

export const participantService = new ParticipantService();
