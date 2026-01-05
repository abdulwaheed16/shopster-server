import { PaginatedResult } from "../../common/types/pagination.types";
import { GetJobsQuery } from "./jobs.validation";

export interface IJobsService {
  getJobs(query: GetJobsQuery): Promise<PaginatedResult<any>>;
  getJobById(id: string): Promise<any>;
}
