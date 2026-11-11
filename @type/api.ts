export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ApiSuccess<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  status: number;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
