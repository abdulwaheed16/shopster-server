import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import { GetJobsQuery } from "./jobs.validation";

import { IJobsService } from "./jobs.types";

export class JobsService implements IJobsService {
  // Get all jobs
  async getJobs(query: GetJobsQuery): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const [jobs, total] = await Promise.all([
      prisma.generationJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          ads: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      prisma.generationJob.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // Get job by ID
  async getJobById(id: string) {
    const job = await prisma.generationJob.findUnique({
      where: { id },
      include: {
        ads: true,
      },
    });

    if (!job) {
      throw ApiError.notFound("Job not found");
    }

    return job;
  }
}

export const jobsService = new JobsService();
