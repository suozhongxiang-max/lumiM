/**
 * 类型定义统一导出入口
 */

// API 类型
export type {
  APIErrorResponse,
  APIResponse,
  PaginatedData,
  PaginationParams,
  QueryParams,
  SortParams,
} from './api/common';
export type { GalleryDetailResponse, GalleryListResponse, GalleryQueryParams } from './api/gallery';
export type {
  JSendResponse,
  JSendSuccess,
  JSendFail,
  JSendError,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  SendVerificationCodeRequest,
  VerificationCodeType,
} from './api/auth';
export type {
  BatchInteractionsRequest,
  BatchInteractionsResponse,
  InteractionStatusResponse,
  InteractionToggleRequest,
  InteractionToggleResponse,
  InteractionType,
  ModelInteractionStatus,
} from './api/interactions';
export type {
  BindPrinterRequest,
  BindPrinterResponse,
  CreatePrintTaskRequest,
  CreatePrintTaskResponse,
  CurrentJob,
  PrinterApiStatus,
  PrinterBasicInfo,
  PrinterDetailInfo,
  PrinterListResponse,
  ProductInfo,
  ProductListResponse,
  RealtimeStatus,
  UnbindPrinterRequest,
} from './api/printer';

// 模型类型
export type {
  GalleryModel,
  ModelStatus,
  ModelSummary,
  ModelVisibility,
  UserInfo,
} from './models/gallery';
export type { Printer, PrinterListItem, PrinterStatus, PrintTask, Product } from './models/printer';
