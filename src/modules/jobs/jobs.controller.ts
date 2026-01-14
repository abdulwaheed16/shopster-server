import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendPaginated, sendSuccess } from "../../common/utils/response.util";
import { jobsService } from "./jobs.service";
import { GetJobsQuery } from "./jobs.validation";

export class JobsController {
  // Get all jobs --- GET /jobs
  async getJobs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query: GetJobsQuery = req.query;

      const result = await jobsService.getJobs(query);

      sendPaginated(res, MESSAGES.JOBS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get job by ID --- GET /jobs/:id
  async getJobById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const job = await jobsService.getJobById(id);

      sendSuccess(res, MESSAGES.JOBS.FETCHED_ONE, job);
    } catch (error) {
      next(error);
    }
  }
}

export const jobsController = new JobsController();
