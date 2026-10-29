import { SortOrder } from "../index.js";

export class Pagination {
  page!: number;
  limit!: number;
  search?: string;
  sort!: string;
  order!: SortOrder;
}
