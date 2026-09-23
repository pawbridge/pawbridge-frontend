// user-service ResponseDTO 응답 봉투
export interface ApiResponse<T> {
  code: number;
  message: string | null;
  data: T;
}
