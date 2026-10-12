export type ApiParamsPagination = {
  page?: number;
  limit?: number;
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
};

export type ApiResponseWithPagination<T> = {
  data: T[];
  meta: Meta;
};

export type ApiResponse<T> = { data: T };

export type ApiResponseList<T> = { data: T[] };
